import { updateSprint } from "@/actions/notion"
import type { Day, Sprint } from "@/types/general"
import { useQueryClient } from "@tanstack/react-query"
import React, { useEffect, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { Button, Checkbox, Text, useTheme } from "react-native-paper"

interface DaySelectorProps {
  days: Day[]
  selectedSprint: Sprint | null
  onClose: () => void
  refetchSprints: () => void
}

export default function DaySelector({ days, selectedSprint, onClose, refetchSprints }: DaySelectorProps) {  
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const theme = useTheme()
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedSprint && selectedSprint.days) {
      setSelectedDays(selectedSprint?.days.map((day) => day.id!))
    } else {
      setSelectedDays([])
    }
  }, [selectedSprint])


  const toggleDaySelection = (id: string) => {
    setSelectedDays((prev) => (prev.includes(id) ? prev.filter((dayId) => dayId !== id) : [...prev, id]))
  }

  const handleSubmit = async () => {
    if (selectedSprint) {
      setIsSubmitting(true);
      const filterdSelectedDays = days.filter((day) => selectedDays.includes(day.id as string)).flatMap(day => ({id:day.id}));
      
      try {
        const updatedSprint = {
          ...selectedSprint,
          days: filterdSelectedDays,
        }
        await updateSprint(selectedSprint.id, updatedSprint)
        refetchSprints()
        onClose();
        
    // @ts-ignore
    queryClient.invalidateQueries(["sprint" , selectedSprint.id]); 
      } catch (error) {
        console.error("Error updating sprint:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
  <>
    {!!selectedSprint == false ? (<Text>Loading</Text>)
      : <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Select Days for {selectedSprint?.title}</Text>
        <ScrollView style={styles.scrollView}>
          {days.map((day) => (
            <View key={day.id} style={styles.checkboxContainer}>
              <Checkbox
                status={selectedDays.includes(day.id as string) ? "checked" : "unchecked"}
                onPress={() => toggleDaySelection(day.id as string)}
                color={theme.colors.primary}
              />
              <Text style={[styles.dayLabel, { color: theme.colors.onSurface }]}>{day.title}</Text>
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
    }
  </>
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
  dayLabel: {
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
