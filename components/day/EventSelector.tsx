import React, { useState, useEffect } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { Text, Checkbox, Button, useTheme } from "react-native-paper"
import type { Day, Event } from "@/types/general"
import { updateDay } from "@/actions/notion"
import { useQueryClient } from "@tanstack/react-query"

interface EventSelectorProps {
  selectedDay: Day | null
  onClose: () => void
  refetchDays: () => void,
  events: Event[]
}

export default function EventSelector({ selectedDay, events, onClose, refetchDays }: EventSelectorProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const theme = useTheme()
  const queryClient = useQueryClient();


  useEffect(() => {
    if (selectedDay && selectedDay.events) {
      setSelectedEvents(selectedDay.events.map((event) => event.id!))
    } else {
      setSelectedEvents([])
    }
  }, [selectedDay])

  const toggleEventSelection = (id: string) => {
    setSelectedEvents((prev) => (prev.includes(id) ? prev.filter((eventId) => eventId !== id) : [...prev, id]))
  }


  const handleSubmit = async () => {
    if (selectedDay) {
      setIsSubmitting(true);
      const filterdSelectedEvents = events.filter((event: Event) => selectedEvents.includes(event.id!)).flatMap((event: Event) => ({ id: event.id }));

      try {
        await updateDay(selectedDay.id!, {
          ...selectedDay,
          events: filterdSelectedEvents,
        })
        refetchDays()
        onClose();

        // @ts-ignore
        queryClient.invalidateQueries(["fetchAllDays"]);
      } catch (error) {
        console.error("Error updating day:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Select Events for {selectedDay?.title}</Text>
      <ScrollView style={styles.scrollView}>
        {events.map((event) => (
          <View key={event.id} style={styles.checkboxContainer}>
            <Checkbox
                status={selectedEvents.includes(event.id as string) ? "checked" : "unchecked"}
                onPress={() => toggleEventSelection(event.id!)}
              color={theme.colors.primary}
            />
            <Text style={[styles.eventLabel, { color: theme.colors.onSurface }]}>{event.title}</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
})

