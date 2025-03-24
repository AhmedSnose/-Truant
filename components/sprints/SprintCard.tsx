import React from "react"
import { StyleSheet, View } from "react-native"
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import type { Sprint } from "@/types/general"

interface SprintCardProps {
  sprint: Sprint
  onDelete: () => void
  onUpdate: () => void
  onLink: () => void
  onShow: () => void
}

export default function SprintCard({ sprint, onDelete, onUpdate, onLink, onShow }: SprintCardProps) {
  const theme = useTheme()

  return (
    <TouchableRipple onPress={onShow} style={styles.ripple}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>
            {sprint.title}
          </Text>
          <Text variant="bodyMedium" style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
            {sprint.startDate} - {sprint.endDate}
          </Text>
          <View style={styles.statsContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Total Hours: {sprint.totalTime}H
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Goal: {sprint.goalTime}H
            </Text>
          </View>
          {/* <Text variant="bodySmall" style={[styles.daysInfo, { color: theme.colors.onSurfaceVariant }]}>
            Linked Days: {sprint.days ? sprint.days.length : 0}
          </Text> */}
        </Card.Content>
        <Card.Actions>
          <TouchableRipple onPress={onDelete} style={styles.actionButton}>
            <MaterialIcons name="delete" size={24} color={theme.colors.error} />
          </TouchableRipple>
          <TouchableRipple onPress={onUpdate} style={styles.actionButton}>
            <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
          </TouchableRipple>
          <TouchableRipple onPress={onLink} style={styles.actionButton}>
            <MaterialIcons name="link" size={24} color={theme.colors.secondary} />
          </TouchableRipple>
        </Card.Actions>
      </Card>
    </TouchableRipple>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden", // This ensures the ripple effect doesn't overflow the card
  },
  ripple: {
    flex: 1, // This ensures the ripple covers the entire card
  },
  title: {
    fontWeight: "bold",
  },
  date: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  daysInfo: {
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
  },
})

