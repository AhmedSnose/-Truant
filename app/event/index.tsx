import { getAllEvents, removeEvent } from "@/actions/notion"
import EventCard from "@/components/event/EventCard"
import type { Event } from "@/types/general"
import { MaterialIcons } from "@expo/vector-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { router, useNavigation } from "expo-router"
import { useState } from "react"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from "react-native-paper"

export default function EventPage() {
  const theme = useTheme()
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const navigation = useNavigation()
  const queryClient = useQueryClient()

  const {
    data,
    isLoading: fetchEventsLoading,
    error: fetchEventError,
    refetch: refetchAllEvents,
  } = useQuery<{ events: Event[]; nextCursor: string | null }>({
    queryKey: ["fetchAllEvents"],
    queryFn: async () => await getAllEvents(),
  })

  const handleDelete = async (id: string) => {
    await removeEvent(id)
    queryClient.invalidateQueries(["fetchAllEvents"] as never)
    setDeleteModalVisible(false)
  }

  const confirmDelete = (event: Event) => {
    setSelectedEvent(event)
    setDeleteModalVisible(true)
  }

  const handleUpdate = (event: Event) => {
    // @ts-ignore
    navigation.navigate("edit/index", { id: event.id })
  }

  const handleShow = (id: string) => {
    router.navigate(`./event/${id}` as never)
  }

  const handleAddEvent = () => {
    // @ts-ignore
    navigation.navigate("edit/index", { eventData: null })
  }

  if (fetchEventsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Loading events...</Text>
      </View>
    )
  }

  if (fetchEventError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Error: {String(fetchEventError)}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={data?.events}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onDelete={() => confirmDelete(item)}
            onUpdate={() => handleUpdate(item)}
            onShow={() => handleShow(item.id!)}
          />
        )}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={[styles.fabStyle, { backgroundColor: theme.colors.primary }]} onPress={handleAddEvent}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalText, { color: theme.colors.onSurface }]}>
            Are you sure you want to delete this event?
          </Text>
          <View style={styles.modalActions}>
            <Button mode="contained" onPress={() => handleDelete(selectedEvent?.id || "")} style={styles.modalButton}>
              Delete
            </Button>
            <Button mode="outlined" onPress={() => setDeleteModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
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

