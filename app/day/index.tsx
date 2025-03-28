import { MaterialIcons } from "@expo/vector-icons"
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { router, useNavigation } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import React, { useCallback, useMemo, useRef, useState } from "react"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import {
  ActivityIndicator,
  Button,
  FAB,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper"

import * as schema from "@/db/schema"

import DayCard from "@/components/day/DayCard"
import EventSelector from "@/components/day/EventSelector"
import * as dayService from "@/services/DayService"
import * as eventService from "@/services/EventService"
import CustomBackdrop from "@/components/day/CustomBackdrop"

export default function DayPage() {
  const theme = useTheme()
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedDay, setSelectedDay] = useState<schema.Day | null>(null)
  const navigation = useNavigation()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ["50%", "80%"], [])
  const queryClient = useQueryClient()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb, { schema })
  const [state, setState] = React.useState({ open: false });
  const onStateChange = ({ open }: { open: boolean }) => setState({ open });
  const { open } = state;
  const [syncLoading, setSyncLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");



  // -- Fetch days --
  const {
    data: days,
    isLoading: fetchDaysLoading,
    error: fetchDayError,
    refetch: refetchAllDays,
  } = useQuery<schema.Day[]>({
    queryKey: ["fetchAllDays"],
    queryFn: async () => await dayService.index(),
  })

  // -- Fetch events --
  const {
    data: eventsData,
    isLoading: fetchEventsLoading,
    error: fetchEventError,
    refetch: refetchAllEvents,
  } = useQuery<schema.Event[]>({
    queryKey: ["fetchAllEvents"],
    queryFn: async () => await eventService.index(),
  })

  const syncAPIWithLocalDb = async () => {
    try {
      setSyncLoading(true);
      await dayService.syncDaysAPIWithLocalDb();
      // Invalidate the localSprints query so that the list refreshes
      //@ts-ignore
      await queryClient.invalidateQueries(["localSprints"]);
      setSnackbarMsg("Sync completed successfully");
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error("Error syncing API with local DB:", error);
      setSnackbarMsg("Sync failed: " + error.message);
      setSnackbarVisible(true);
    } finally {
      setSyncLoading(false);
    }
  };


  const handleSheetChanges = useCallback((index: number) => {
    console.log("Bottom sheet index:", index)
  }, [])

  // -- Delete a Day --
  const handleDelete = async (id: number) => {
    await dayService.remove(id)
    queryClient.invalidateQueries(["fetchAllDays"] as never)
    setDeleteModalVisible(false)
  }
  const confirmDelete = (day: schema.Day) => {
    setSelectedDay(day)
    setDeleteModalVisible(true)
  }

  // -- Update a Day --
  const handleUpdate = async (day: schema.Day) => {
    // Optionally fetch related status if needed
    const status = db.select().from(schema.statuses).where(eq(schema.statuses.id, Number(day?.statusId))).get()
    day.status = status
    //@ts-ignore
    navigation.navigate("edit/index", { dayData: day })
  }

  // -- Link day with events -> open bottom sheet --
  const handleLinkDayWithEvents = (day: schema.Day) => {
    setSelectedDay(day)
    bottomSheetRef.current?.expand()
  }

  // -- Show a day details --
  const handleShow = (id: number) => {
    router.push(`./day/${id}`)
  }

  // -- Add a new day --
  const handleAddDay = () => {
    //@ts-ignore
    navigation.navigate("edit/index", { dayData: null })
  }

  if (fetchDaysLoading || fetchEventsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading days...
        </Text>
      </View>
    )
  }
  if (fetchDayError || fetchEventError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {String(fetchDayError || fetchEventError)}
        </Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* List of Days */}
      {days?.length ? (
        <FlatList
          data={days}
          renderItem={({ item }) => (
            <DayCard
              syncStatus={item.isSynced}
              day={item}
              onDelete={() => confirmDelete(item)}
              onUpdate={() => handleUpdate(item)}
              onLink={() => handleLinkDayWithEvents(item)}
              onShow={() => handleShow(item.id!)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text>No days found. Add a new one to get started!</Text>
        </View>
      )}


      <FAB.Group
        onStateChange={onStateChange}
        open={open}
        visible
        icon={open ? "close" : "menu"}
        actions={[
          { icon: "plus", label: "Add Day", onPress: handleAddDay },
          {
            icon: syncLoading ? "progress-clock" : "cloud-download",
            label: "Sync API With Local Database",
            onPress: syncAPIWithLocalDb,
          },
        ]}
      />

      {/* Bottom Sheet with custom backdrop */}
      <BottomSheet
        index={-1} // initially closed
        ref={bottomSheetRef}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        backdropComponent={CustomBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent}>
            {eventsData && (
              <EventSelector
                events={eventsData}
                refetchDays={refetchAllDays}
                selectedDay={selectedDay}
                onClose={() => bottomSheetRef.current?.close()}
              />
            )}
          </BottomSheetScrollView>
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
            Are you sure you want to delete this day?
          </Text>
          <View style={styles.modalActions}>
            <Button
              mode="contained"
              onPress={() => handleDelete(selectedDay?.id!)}
              style={styles.modalButton}
            >
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  // Bottom Sheet styling
  sheetContainer: {
    flex: 1,
  },
  sheetScrollContent: {
    padding: 16,
  },
  handleIndicator: {
    backgroundColor: "#ccc",
    width: 50,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 8,
  },
  // Modal styling
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
});
