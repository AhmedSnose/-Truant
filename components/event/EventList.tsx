import React from "react"
import { FlatList, StyleSheet } from "react-native"
import { Card, Text, useTheme } from "react-native-paper"
import type { Event } from "@/types/general"

interface EventListProps {
  events: Event[]
}

export default function EventList({ events }: EventListProps) {
  const theme = useTheme()

  const renderEvent = ({ item }: { item: Event }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{item.title}</Text>
        <Text variant="bodySmall">Start: {item.startDate}</Text>
        {item.endDate && <Text variant="bodySmall">End: {item.endDate}</Text>}
        <Text variant="bodySmall">Weight: {item.weight}</Text>
        <Text variant="bodySmall" style={styles.description}>
          {item.description}
        </Text>
      </Card.Content>
    </Card>
  )

  return (
    <FlatList
      data={events}
      renderItem={renderEvent}
      keyExtractor={(item) => item.id!}
      contentContainerStyle={styles.listContainer}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 8,
  },
  description: {
    marginTop: 8,
  },
})

