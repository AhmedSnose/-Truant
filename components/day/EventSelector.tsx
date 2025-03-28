import React, { useState, useEffect } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { Text, Checkbox, Button, Snackbar, useTheme } from "react-native-paper"
import { useQueryClient } from "@tanstack/react-query"
import { updateDay } from "@/actions/notion"
import type { Day, Event } from "@/types/general"
import * as schema from "@/db/schema"

interface EventSelectorProps {
  selectedDay: schema.Day | null
  onClose: () => void
  refetchDays: () => void
  events: schema.Event[]
}

export default function EventSelector({
  selectedDay,
  events,
  onClose,
  refetchDays,
}: EventSelectorProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const theme = useTheme()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (selectedDay?.events) {
      setSelectedEvents(selectedDay.events.map((ev) => ev.id!))
    } else {
      setSelectedEvents([])
    }
  }, [selectedDay])

  const toggleEventSelection = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id)
        ? prev.filter((eventId) => eventId !== id)
        : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!selectedDay) return
    setIsSubmitting(true)
    try {
      // Build the new events relation array (bulk update)
      const relationEvents = events
        .filter((ev) => selectedEvents.includes(ev.id!))
        .map((ev) => ({ id: ev.id }))

      // Instead of spreading all of selectedDay (which may include outdated events),
      // pass only the required fields along with the new events array.
      await updateDay(selectedDay.id!, {
        title: selectedDay.title,
        report: selectedDay.report,
        goalTime: selectedDay.goalTime || 0,
        totalTime: selectedDay.totalTime || 0,
        date: selectedDay.date,
        events: relationEvents,
        status: selectedDay.status,
      })

      setSnackbarMessage("Day updated successfully! ✅")
      refetchDays()
      queryClient.invalidateQueries(["fetchAllDays"])
      onClose()
    } catch (error: any) {
      console.error("Error updating day:", error)
      setSnackbarMessage("Error updating day: " + (error.message || ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Select Events for {selectedDay?.title}
      </Text>

      <ScrollView style={styles.scrollArea}>
        {events.map((event) => (
          <View key={event.id} style={styles.checkboxContainer}>
            <Checkbox
              status={selectedEvents.includes(event.id!) ? "checked" : "unchecked"}
              onPress={() => toggleEventSelection(event.id!)}
              color={theme.colors.primary}
            />
            <Text style={[styles.eventLabel, { color: theme.colors.onSurface }]}>
              {event.title}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Save
        </Button>
        <Button mode="outlined" onPress={onClose} style={styles.button}>
          Cancel
        </Button>
      </View>

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage("")}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setSnackbarMessage(""),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // let the bottom sheet control total height
  },
  title: {
    marginHorizontal: 16,
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollArea: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 60, // leave space at bottom so items aren't hidden
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    position: "absolute", // pin to bottom
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
})
