import { getSprintById } from "@/actions/notion"
import { Sprint } from "@/types/general"
import { useRoute, type RouteProp } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useLocalSearchParams } from "expo-router"
import { ScrollView, StyleSheet, View } from "react-native"
import { ActivityIndicator, Card, Text, useTheme } from "react-native-paper"


export default function SprintShowPage() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()

  const {
    data: sprint,
    isLoading,
    error,
  } = useQuery<Sprint | null>({
    queryKey: ["sprint", id],
    queryFn: async () => await getSprintById(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error }}>Error loading sprint details</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            {sprint?.title || "Untitled Sprint"}
          </Text>
          <Text variant="bodyMedium">Start Date: {sprint?.startDate || "N/A"}</Text>
          <Text variant="bodyMedium">End Date: {sprint?.endDate || "N/A"}</Text>
          <Text variant="bodyMedium">Total Time: {sprint?.totalTime || 0} hours</Text>
          <Text variant="bodyMedium">Goal Time: {sprint?.goalTime || 0} hours</Text>
          <Text variant="bodyMedium" style={styles.description}>
            {sprint?.description || "No description available"}
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Linked Days
      </Text>
      {sprint?.days?.map((day) => (
        <Card key={day.id} style={styles.dayCard}>
          <Card.Content>
            <Text variant="titleMedium">{day.title}</Text>
            <Text variant="bodyMedium">Date: {day.date}</Text>
            <Text variant="bodyMedium">Total Time: {day.totalTime} hours</Text>
            <Text variant="bodyMedium">Goal Time: {day.goalTime} hours</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    marginTop: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  dayCard: {
    marginBottom: 8,
  },
})

