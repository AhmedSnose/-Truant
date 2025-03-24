import { getAllDays, getAllEvents, removeDay } from "@/actions/notion"
import DayCard from "@/components/day/DayCard"
import EventSelector from "@/components/day/EventSelector"
import * as schema from "@/db/schema"
import type { Day, Event } from "@/types/general"
import { MaterialIcons } from "@expo/vector-icons"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { router, useNavigation } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import React, { useCallback, useRef, useState } from "react"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from "react-native-paper"

export default function DayPage() {
  const theme = useTheme()
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const navigation = useNavigation()
  const bottomSheetRef = useRef<BottomSheet>(null);

  const queryClient = useQueryClient();
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb, { schema })


  const {
    data,
    isLoading: fetchDaysLoading,
    error: fetchDayError,
    refetch: refetchAllDays,
  } = useQuery<{ days: Day[]; nextCursor: string | null }>({
    queryKey: ["fetchAllDays"],
    queryFn: async () => await getAllDays(true),
  })

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
    if (index === 0) {
      console.log("Bottom sheet closed")
    }
  }, [])

  const handleDelete = async (id: string) => {
    await removeDay(id);
    queryClient.invalidateQueries(["fetchAllDays"] as never);

    // refetchAllDays()
    setDeleteModalVisible(false)
  }

  const confirmDelete = (day: Day) => {
    setSelectedDay(day)
    setDeleteModalVisible(true)
  }

  const handleUpdate = async (day: Day) => {
    // const day = await getDayById(id)    
    const status = db.select().from(schema.statuses).where(eq(schema.statuses.id, Number(day?.statusId))).get()
    day.status = status;
    if (day) {
      // @ts-ignore
      navigation.navigate("edit/index", { dayData: day })
      // router.push("edit/index")
    }
  }

  const handleLinkDayWithEvents = async (day: Day) => {
    setSelectedDay(day)
    bottomSheetRef.current?.expand()
  }

  const handleShow = (id: string) => {
    router.navigate("./day/" + id as never, { relativeToDirectory: false })
  }

  const handleAddDay = () => {
    // @ts-ignore
    navigation.navigate("edit/index", { dayData: null })
  }

  if (fetchDaysLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Loading days...</Text>
      </View>
    )
  }

  if (fetchDayError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Error: {String(fetchDayError)}</Text>
      </View>
    )
  }

  // return (
  //   <Text onPress={()=>handleShow('1884da79-8fb7-8126-89b5-e864aa64e99d')}>HI</Text>
  // )


  return (
    <>

      <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {data?.days.length ?
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
          : <View style={styles.emptyState}>
            <Text>No truants found. Add a new one to get started!</Text>
          </View>}
        <TouchableOpacity style={[styles.fabStyle, { backgroundColor: theme.colors.primary }]} onPress={handleAddDay}>
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
            <EventSelector
              events={eventsData?.events!}
              refetchDays={refetchAllDays}
              selectedDay={selectedDay}
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
              Are you sure you want to delete this day?
            </Text>
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={() => handleDelete(selectedDay?.id || "")} style={styles.modalButton}>
                Delete
              </Button>
              <Button mode="outlined" onPress={() => setDeleteModalVisible(false)} style={styles.modalButton}>
                Cancel
              </Button>
            </View>
          </Modal>
        </Portal>
      </GestureHandlerRootView>

    </>
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

