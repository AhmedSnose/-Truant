import React from "react"
import { StyleSheet, View } from "react-native"
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import * as schema from "@/db/schema"

interface SprintCardProps {
  sprint: schema.Sprint
  onDelete: () => void
  onUpdate: () => void
  onLink: () => void
  onShow: () => void
  // New prop to indicate sync status (true if synced, false otherwise)
  syncStatus: boolean
}

export default function SprintCard({
  sprint,
  onDelete,
  onUpdate,
  onLink,
  onShow,
  syncStatus,
}: SprintCardProps) {
  const theme = useTheme()

  return (
    <TouchableRipple onPress={onShow} style={styles.ripple}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>
              {sprint.title}
            </Text>
            {/* Sync flag indicator */}
            <View style={styles.syncContainer}>
              <View
                style={[
                  styles.syncDot,
                  { backgroundColor: syncStatus ? "green" : "red" },
                ]}
              />
              <Text style={[styles.syncLabel, { color: theme.colors.onSurfaceVariant }]}>
                {syncStatus ? "Synced" : "Not Synced"}
              </Text>
            </View>
          </View>
          <Text variant="bodyMedium" style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
            {sprint.startDate} - {sprint.endDate}
          </Text>
          <View style={styles.statsContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Total Hours: {sprint.totalTime}H
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 16 }}>
              Goal: {sprint.goalTime}H
            </Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <TouchableRipple onPress={onDelete} style={styles.actionButton}>
            <MaterialIcons name="delete" size={24} color={theme.colors.error} />
          </TouchableRipple>
          <TouchableRipple onPress={onUpdate} style={styles.actionButton}>
            <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
          </TouchableRipple>
          {/* <TouchableRipple onPress={onLink} style={styles.actionButton}>
            <MaterialIcons name="link" size={24} color={theme.colors.secondary} />
          </TouchableRipple> */}
        </Card.Actions>
      </Card>
    </TouchableRipple>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden", // ensures ripple doesn't overflow
  },
  ripple: {
    flex: 1, // covers the entire card
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    flex: 1,
  },
  syncContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  syncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncLabel: {
    fontSize: 10,
    marginLeft: 4,
  },
  date: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
  },
})
