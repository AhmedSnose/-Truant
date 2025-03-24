import { StyleSheet } from "react-native"
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import type { Event } from "@/types/general"

interface EventCardProps {
  event: Event
  onDelete: () => void
  onUpdate: () => void
  onShow: () => void
}

export default function EventCard({ event, onDelete, onUpdate, onShow }: EventCardProps) {
  const theme = useTheme()

  return (
    <TouchableRipple onPress={onShow}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>
            {event.title}
          </Text>
          <Text variant="bodyMedium" style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
            {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            Weight: {event.weight}
          </Text>
          <Text variant="bodySmall" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {event.description}
          </Text>
        </Card.Content>
        <Card.Actions>
          <TouchableRipple onPress={onDelete} style={styles.actionButton}>
            <MaterialIcons name="delete" size={24} color={theme.colors.error} />
          </TouchableRipple>
          <TouchableRipple onPress={onUpdate} style={styles.actionButton}>
            <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
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
  description: {
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
  },
})

