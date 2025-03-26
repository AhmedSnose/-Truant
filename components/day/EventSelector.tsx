import React, { useState, useEffect } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { Text, Checkbox, Button, useTheme } from "react-native-paper"
import { useQueryClient } from "@tanstack/react-query"
import { updateDay } from "@/actions/notion"
import type { Day, Event } from "@/types/general"

interface EventSelectorProps {
  selectedDay: Day | null
  onClose: () => void
  refetchDays: () => void
  events: Event[]
}

export default function EventSelector({
  selectedDay,
  events,
  onClose,
  refetchDays,
}: EventSelectorProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      const filteredSelectedEvents = events
        .filter((ev) => selectedEvents.includes(ev.id!))
        .map((ev) => ({ id: ev.id }))

      await updateDay(selectedDay.id!, {
        ...selectedDay,
        events: filteredSelectedEvents,
      })

      refetchDays()
      // @ts-ignore
      queryClient.invalidateQueries(["fetchAllDays"])
      onClose()
    } catch (error) {
      console.error("Error updating day:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Select Events for {selectedDay?.title}
      </Text>

      {/* Scrollable checkboxes */}
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

      {/* Fixed buttons at bottom */}
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
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>
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
    // leave space at bottom so items aren't hidden behind the fixed buttons
    marginBottom: 60,
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
    position: "absolute",  // pin to bottom
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
