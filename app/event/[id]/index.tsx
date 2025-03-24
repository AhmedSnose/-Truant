"use client"

import { getEventById } from "@/actions/notion"
import type { Event } from "@/types/general"
import { useRoute } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useNavigation } from "expo-router"
import { useLayoutEffect } from "react"
import { StyleSheet, View } from "react-native"
import { ActivityIndicator, Card, Text, useTheme } from "react-native-paper"

export default function EventShowPage() {
  const route = useRoute()
  const { id }: any = route.params
  const theme = useTheme()
  const navigation = useNavigation()

  const {
    data: event,
    isLoading,
    error,
  } = useQuery<Event | null>({
    queryKey: ["fetchEvent", id],
    queryFn: async () => await getEventById(id),
  })

  

  useLayoutEffect(() => {
    if (event) {
      navigation.setOptions({
        title: `Event: ${event?.title ?? "..."}`,
      })
    }
  }, [event, navigation]) // Added navigation to dependencies

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error }}>Error: {(error as Error).message}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            {event?.title}
          </Text>
          <Text variant="bodyMedium">Start: {new Date(event?.startDate!).toLocaleString()}</Text>
          <Text variant="bodyMedium">End: {new Date(event?.endDate!).toLocaleString()}</Text>
          <Text variant="bodyMedium">Weight: {event?.weight}</Text>
          <Text variant="bodyMedium" style={styles.description}>
            Description: {event?.description}
          </Text>
          <Text variant="bodyMedium" style={styles.report}>
            Report: {event?.report}
          </Text>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginTop: 8,
  },
  report: {
    marginTop: 8,
  },
})

