import React from "react"
import { StyleSheet, View } from "react-native"
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import type { Day } from "@/types/general"
import * as schema from "@/db/schema"


interface DayCardProps {
  day: schema.Day
  onDelete: () => void
  onUpdate: () => void
  onLink: () => void
  onShow: () => void
  syncStatus: number
}

export default function DayCard({ day, onDelete, onUpdate, onLink, onShow, syncStatus }: DayCardProps) {
  const theme = useTheme()


  return (
    <TouchableRipple onPress={onShow}>
      <Card style={styles.card}>
        <Card.Content>
       <View style={styles.headerContainer}>
            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>
              {day.title}
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
            {day.date}
          </Text>
          <View style={styles.statsContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Total Hours: {day.totalTime}H
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Goal: {day.goalTime}H
            </Text>
            {/* <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Status
            </Text> */}
          </View>
          {/* <Text variant="bodySmall" style={[styles.eventsInfo, { color: theme.colors.onSurfaceVariant }]}>
            Linked Events: {day.events ? day.events.length : 0}
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
  },
  title: {
    fontWeight: "bold",
  },
  date: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  eventsInfo: {
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})

