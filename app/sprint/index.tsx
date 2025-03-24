import { getAllDays, getAllSprints, getSprintById, removeSprint } from "@/actions/notion"
import DaySelector from "@/components/sprints/DaySelector"
import SprintCard from "@/components/sprints/SprintCard"
import type { Day, Sprint } from "@/types/general"
import { MaterialIcons } from "@expo/vector-icons"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { useQuery } from "@tanstack/react-query"
import { useNavigation } from "expo-router"
import React, { useCallback, useRef, useState } from "react"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from "react-native-paper"

export default function SprintsPage() {
  const theme = useTheme()

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const navigation = useNavigation()
  const bottomSheetRef = useRef<BottomSheet>(null)

  const {
    data: sprints,
    isLoading: fetchSprintsLoading,
    error: fetchSprintError,
    refetch: refetchAllSprints,
  } = useQuery<Sprint[]>({
    queryKey: ["fetchAllSprints"],
    queryFn: async () => await getAllSprints(),
  })

  const {
    data: daysResponse,
    isLoading: fetchDaysLoading,
    error: fetchDaysError,
  } = useQuery<{ days: Day[]; nextCursor: string | null }>({
    queryKey: ["fetchAllDays"],
    queryFn: async () => await getAllDays(false),
  })

  const handleSheetChanges = useCallback((index: number) => {
    if (index === 0) {
      console.log("Bottom sheet closed")
    }
  }, [])

  const handleDelete = async (id: string) => {
    await removeSprint(id)
    refetchAllSprints()
    setDeleteModalVisible(false)
  }

  const confirmDelete = (sprint: Sprint) => {
    setSelectedSprint(sprint)
    setDeleteModalVisible(true)
  }

  const handleUpdate = async (id: string) => {
    const sprint = await getSprintById(id)
    if (sprint) {
      // @ts-ignore
      navigation.navigate("edit/index", { sprintData: sprint })
    }
  }

  const handleLinkSprintWithDays = async (id: string) => {
    const sprint = await getSprintById(id)
    if (sprint) {
      bottomSheetRef.current?.expand()
      setSelectedSprint(sprint)
    }
  }


  const handleShow = (id: string) => {
    //@ts-ignore
    navigation.navigate("sprint", { screen: "show/index", params: { id } })
  }

  const handleAddSprint = () => {
    // @ts-ignore
    navigation.navigate("edit/index", { sprintData: null })
  }

  if (fetchDaysLoading || fetchSprintsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Loading sprints...</Text>
      </View>
    )
  }

  if (fetchDaysError || fetchSprintError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {String(fetchDaysError || fetchSprintError)}
        </Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={sprints}
        renderItem={({ item }) => (
          <SprintCard
            sprint={item}
            onDelete={() => confirmDelete(item)}
            onUpdate={() => handleUpdate(item.id)}
            onLink={() => handleLinkSprintWithDays(item.id)}
            onShow={() => handleShow(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={[styles.fabStyle, { backgroundColor: theme.colors.primary }]} onPress={handleAddSprint}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>

      <BottomSheet
        index={-1}
        enablePanDownToClose={true}
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
      >
        <BottomSheetView style={styles.contentContainer}>
          <DaySelector
            refetchSprints={refetchAllSprints}
            days={daysResponse?.days || []}
            selectedSprint={selectedSprint}
            onClose={() => bottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>

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
            <Button mode="contained" onPress={() => handleDelete(selectedSprint?.id || "")} style={styles.modalButton}>
              Delete
            </Button>
            <Button mode="outlined" onPress={() => setDeleteModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 80,
  },
  fabStyle: {
    position: "absolute",
    bottom: 70,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  contentContainer: {
    padding: 16,
    height: 500,
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

