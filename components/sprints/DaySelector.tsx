import { updateSprint } from "@/actions/notion"
import type { Day, Sprint } from "@/types/general"
import { useQueryClient } from "@tanstack/react-query"
import React, { useEffect, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { Button, Checkbox, Text, useTheme } from "react-native-paper"
import * as schema from "@/db/schema";

interface DaySelectorProps {
  days: Day[]
  selectedSprint: schema.Sprint | null
  onClose: () => void
  refetchSprints: () => void
}

export default function DaySelector({
  days,
  selectedSprint,
  onClose,
  refetchSprints,
}: DaySelectorProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const theme = useTheme()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (selectedSprint?.days) {
      setSelectedDays(selectedSprint.days.map((d) => d.id!))
    } else {
      setSelectedDays([])
    }
  }, [selectedSprint])

  const toggleDaySelection = (id: string) => {
    setSelectedDays((prev) =>
      prev.includes(id) ? prev.filter((dayId) => dayId !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!selectedSprint) return
    setIsSubmitting(true)

    try {
      const filteredSelectedDays = days
        .filter((day) => selectedDays.includes(day.id!))
        .map((day) => ({ id: day.id }))

      await updateSprint(selectedSprint.id, {
        ...selectedSprint,
        days: filteredSelectedDays,
      })
      refetchSprints()
      onClose()
      // @ts-ignore
      queryClient.invalidateQueries(["sprint", selectedSprint.id])
    } catch (error) {
      console.error("Error updating sprint:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Select Days for {selectedSprint?.title}
      </Text>

      {/* Scrollable list of days */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => (
          <View key={day.id} style={styles.checkboxContainer}>
            <Checkbox
              status={selectedDays.includes(day.id!) ? "checked" : "unchecked"}
              onPress={() => toggleDaySelection(day.id!)}
              color={theme.colors.primary}
            />
            <Text style={[styles.dayLabel, { color: theme.colors.onSurface }]}>
              {day.title}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Fixed buttons at the bottom */}
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
    marginBottom: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    // Enough bottom padding so you can scroll behind the fixed buttons
    paddingBottom: 120,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  buttonContainer: {
    position: "absolute",
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
