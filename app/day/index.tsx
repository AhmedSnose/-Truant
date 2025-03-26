import React, { useCallback, useMemo, useRef, useState } from "react"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { router, useNavigation } from "expo-router"

import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useSQLiteContext } from "expo-sqlite"

import { getAllDays, getAllEvents, removeDay } from "@/actions/notion"
import * as schema from "@/db/schema"
import type { Day, Event } from "@/types/general"

import CustomBackdrop from "@/components/day/CustomBackdrop" // your dim overlay
import DayCard from "@/components/day/DayCard"
import EventSelector from "@/components/day/EventSelector"

export default function DayPage() {
  const theme = useTheme()
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const navigation = useNavigation()

  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ["50%", "80%"], [])

  const queryClient = useQueryClient()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb, { schema })

  // -- Fetch days --
  const {
    data,
    isLoading: fetchDaysLoading,
    error: fetchDayError,
    refetch: refetchAllDays,
  } = useQuery<{ days: Day[]; nextCursor: string | null }>({
    queryKey: ["fetchAllDays"],
    queryFn: async () => await getAllDays(true),
  })

  // -- Fetch events --
  const {
    data: eventsData,
    isLoading: fetchEventsLoading,
    error: fetchEventError,
    refetch: refetchAllEvents,
  } = useQuery<{ events: Event[]; nextCursor: string | null }>({
    queryKey: ["fetchAllEvents"],
    queryFn: async () => await getAllEvents(),
  })

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Bottom sheet index:", index)
  }, [])

  // -- Delete a Day --
  const handleDelete = async (id: string) => {
    await removeDay(id)
    queryClient.invalidateQueries(["fetchAllDays"] as never)
    setDeleteModalVisible(false)
  }
  const confirmDelete = (day: Day) => {
    setSelectedDay(day)
    setDeleteModalVisible(true)
  }

  // -- Update a Day --
  const handleUpdate = async (day: Day) => {
    // If you need day.status from DB, you can fetch it here
    const status = db.select().from(schema.statuses).where(eq(schema.statuses.id, Number(day?.statusId))).get()
    day.status = status

    // Navigate to your Edit page
    // @ts-ignore
    navigation.navigate("edit/index", { dayData: day })
  }

  // -- Link day with events -> open bottom sheet --
  const handleLinkDayWithEvents = (day: Day) => {
    setSelectedDay(day)
    bottomSheetRef.current?.expand()
  }

  // -- Show a day details (if you have a details page) --
  const handleShow = (id: string) => {
    router.push(`./day/${id}`)
  }

  // -- Add a new day -> open edit page with no data --
  const handleAddDay = () => {
    // @ts-ignore
    navigation.navigate("edit/index", { dayData: null })
  }

  // -- Handle loading or error states --
  if (fetchDaysLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading days...
        </Text>
      </View>
    )
  }
  if (fetchDayError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {String(fetchDayError)}
        </Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* List of Days */}
      {data?.days?.length ? (
        <FlatList
          data={data?.days}
          renderItem={({ item }) => (
            <DayCard
              day={item}
              onDelete={() => confirmDelete(item)}
              onUpdate={() => handleUpdate(item)}
              onLink={() => handleLinkDayWithEvents(item)}
              onShow={() => handleShow(item.id!)}
            />
          )}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text>No truants found. Add a new one to get started!</Text>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fabStyle, { backgroundColor: theme.colors.primary }]} onPress={handleAddDay}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Bottom Sheet with custom backdrop */}
      <BottomSheet
        index={-1} // initially closed
        ref={bottomSheetRef}
        // snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        backdropComponent={CustomBackdrop} // blocks background clicks + dim overlay
        handleIndicatorStyle={styles.handleIndicator} // optional styling
      >
        {/* Use BottomSheetScrollView for smooth scrolling inside the sheet */}
        <BottomSheetView style={styles.sheetContainer}>
          <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent}>
            <EventSelector
              events={eventsData?.events || []}
              refetchDays={refetchAllDays}
              selectedDay={selectedDay}
              onClose={() => bottomSheetRef.current?.close()}
            />
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
              onPress={() => handleDelete(selectedDay?.id || "")}
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
})
