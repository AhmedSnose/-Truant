import * as schema from "@/db/schema"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigation } from "expo-router"
import React, { useCallback, useMemo, useRef, useState } from "react"
import { FlatList, StyleSheet, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import {
  ActivityIndicator,
  Button,
  FAB,
  Modal,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper"

import DaySelector from "@/components/sprints/DaySelector"
import SprintCard from "@/components/sprints/SprintCard"

// Local DB sprint service functions
import * as localSprintService from "@/services/SprintService"

// Notion actions
import { getAllDays } from "@/actions/notion/days"
import { createSprint, getAllSprints, getSprintById, removeSprint, updateSprint } from "@/actions/notion/sprints"
import type { Day } from "@/types/general"

export default function SprintsPage() {
  const theme = useTheme()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const bottomSheetRef = useRef<BottomSheet>(null)

  // UI state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<schema.Sprint | null>(null)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState("")

  // Fetch Notion sprints (always enabled)
  const {
    data: notionSprints,
    isLoading: fetchNotionLoading,
    error: fetchNotionError,
    refetch: refetchNotionSprints,
  } = useQuery<schema.Sprint[]>({
    queryKey: ["notionSprints"],
    queryFn: getAllSprints,
  })

  // Fetch Local sprints (always enabled)
  const {
    data: localSprints,
    isLoading: fetchLocalLoading,
    error: fetchLocalError,
    refetch: refetchLocalSprints,
  } = useQuery<schema.Sprint[]>({
    queryKey: ["localSprints"],
    queryFn: async () => localSprintService.index(),
  })

  // Merge Notion and Local sprints.
  // If a sprint exists in both sources (matched by id), mark it as synced.
  const mergedSprints = useMemo(() => {
    const notion = notionSprints || []
    const local = localSprints || []
    const mergedMap = new Map<number, (schema.Sprint & { isSynced: boolean })>()

    // Add Notion sprints first (default sync flag false)
    notion.forEach((s) => {
      mergedMap.set(s.id, { ...s, isSynced: false })
    })

    // For each local sprint, if it already exists, mark as synced; otherwise add it
    local.forEach((s) => {
      if (mergedMap.has(s.id)) {
        const existing = mergedMap.get(s.id)!
        mergedMap.set(s.id, { ...existing, isSynced: true })
      } else {
        mergedMap.set(s.id, { ...s, isSynced: false })
      }
    })
    return Array.from(mergedMap.values())
  }, [notionSprints, localSprints])

  // Fetch days (used by DaySelector)
  const {
    data: daysResponse,
    isLoading: fetchDaysLoading,
    error: fetchDaysError,
  } = useQuery<{ days: Day[]; nextCursor: string | null }>({
    queryKey: ["fetchAllDays"],
    queryFn: () => getAllDays(false),
  })

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Bottom sheet index:", index)
  }, [])


  const [state, setState] = React.useState({ open: false });
  const onStateChange = ({ open }: { open: boolean }) => setState({ open });
  const { open } = state;


  const confirmDelete = (sprint: schema.Sprint) => {
    setSelectedSprint(sprint)
    setDeleteModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      // If the sprint exists in Notion, remove from Notion;
      // otherwise, remove from local DB.
      // (You might customize this logic based on your app requirements.)
      const sprintId = Number(id)
      const notionSprint = notionSprints?.find((s) => s.id === sprintId)
      if (notionSprint) {
        await removeSprint(id)
        refetchNotionSprints()
      } else {
        await localSprintService.remove(sprintId)
        refetchLocalSprints()
      }
      setDeleteModalVisible(false)
      setSnackbarMsg("Sprint deleted successfully")
      setSnackbarVisible(true)
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const handleUpdate = async (id: number) => {
    const sprint = await getSprintById(id)
    if (sprint) {
      //@ts-ignore
      navigation.navigate("edit/index", { sprintData: sprint })
    }
  }

  const handleLinkSprintWithDays = async (id: number) => {
    const sprint = await getSprintById(id)
    if (sprint) {
      setSelectedSprint(sprint)
      bottomSheetRef.current?.expand() // open the sheet
    }
  }

  const handleShow = (id: number) => {
    //@ts-ignore
    navigation.navigate("sprint", { screen: "show/index", params: { id } })
  }

  const handleAddSprint = () => {
    //@ts-ignore
    navigation.navigate("edit/index", { sprintData: null })
  }

  // --- Sync Functions ---

  // Sync local DB sprints to Notion

const syncLocalToNotion = async () => {
  try {
    // Get all local sprints from your local DB
    const localData = await localSprintService.index();

    // Get all sprints currently in Notion
    const notionData = await getAllSprints();

    // Loop through local sprints and sync them
    for (const localSprint of localData) {
      // We assume that if a local sprint is already synced,
      // its id (converted to string) will match the Notion sprint id.
      const matchedNotionSprint = notionData.find(
        (nSprint:schema.Sprint) => nSprint.id == localSprint.id
      );

      if (matchedNotionSprint) {
        // If found, update the sprint in Notion.
        // Note: updateSprint expects an object with a "days" field.
        await updateSprint(matchedNotionSprint.id.toString(), {
          days: [], // Adjust if you have local days data to sync
          title: localSprint.title,
          totalTime: localSprint.totalTime ? localSprint.totalTime.toString() : "0",
          goalTime: localSprint.goalTime ? localSprint.goalTime.toString() : "0",
          startDate: localSprint.startDate,
          endDate: localSprint.endDate,
          description: localSprint.description || "",
        });
      } else {

        await createSprint({
          title: localSprint.title,
          totalTime: localSprint.totalTime ? localSprint.totalTime.toString() : "0",
          goalTime: localSprint.goalTime ? localSprint.goalTime.toString() : "0",
          startDate: localSprint.startDate,
          endDate: localSprint.endDate,
          description: localSprint.description || "",
        });
      }
    }
    setSnackbarMsg("Local sprints synced to Notion successfully");
    setSnackbarVisible(true);
    refetchNotionSprints();
  } catch (error) {
    console.error("Error syncing local to Notion:", error);
    setSnackbarMsg("Error syncing local to Notion");
    setSnackbarVisible(true);
  }
};


  // Sync Notion sprints to local DB
  const syncNotionToLocal = async () => {
    try {
      const notionData = await getAllSprints()
      for (const sprint of notionData) {
        const existing = await localSprintService.show(Number(sprint.id))
        if (existing) {
          //@ts-ignore
          await localSprintService.update(Number(sprint.id), sprint)
        } else {
          //@ts-ignore
          await localSprintService.post(sprint)
        }
        console.log("Synced sprint:", sprint)
      }
      setSnackbarMsg("Notion sprints synced to local DB successfully")
      setSnackbarVisible(true)
      refetchLocalSprints()
    } catch (error) {
      console.error("Error syncing Notion to local:", error)
      setSnackbarMsg("Error syncing Notion to local")
      setSnackbarVisible(true)
    }
  }

  if (
    fetchDaysLoading ||
    fetchNotionLoading ||
    fetchLocalLoading
  ) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading sprints...
        </Text>
      </View>
    )
  }

  if (fetchDaysError || fetchNotionError || fetchLocalError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {String(fetchDaysError || fetchNotionError || fetchLocalError)}
        </Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* List of merged sprints */}
      {mergedSprints && (
        <FlatList
          data={mergedSprints}
          renderItem={({ item }) => (
            <SprintCard
              sprint={item}
              onDelete={() => confirmDelete(item)}
              onUpdate={() => handleUpdate(item.id)}
              onLink={() => handleLinkSprintWithDays(item.id)}
              onShow={() => handleShow(item.id)}
              syncStatus={item.isSynced}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Floating Action Buttons */}
      <FAB.Group
        onStateChange={onStateChange}
        open={open}
        visible
        icon={open ? 'close' : 'menu'}
        actions={[
          { icon: "plus", label: "Add Sprint", onPress: handleAddSprint },
          { icon: "cloud-download", label: "Sync Notion To Local", onPress: syncNotionToLocal },
          { icon: "cloud-upload", label: "Sync Local To Notion", onPress: syncLocalToNotion },
        ]}
      />

      {/* Bottom Sheet for linking days */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <DaySelector
            refetchSprints={async () => {
              await refetchNotionSprints()
              await refetchLocalSprints()
            }}
            days={daysResponse?.days || []}
            selectedSprint={selectedSprint}
            onClose={() => bottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalText, { color: theme.colors.onSurface }]}>
            Are you sure you want to delete this sprint?
          </Text>
          <View style={styles.modalActions}>
            <Button
              mode="contained"
              onPress={() => handleDelete(selectedSprint?.id.toString() || "")}
              style={styles.modalButton}
            >
              Delete
            </Button>
            <Button
              mode="outlined"
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Snackbar for feedback */}
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMsg}
      </Snackbar>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  segmentContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  segmentButton: {
    marginHorizontal: 4,
  },
  list: {
    paddingBottom: 80,
  },
  modalContent: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    marginHorizontal: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
})
