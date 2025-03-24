"use client"

import { useState } from "react"
import { FlatList, StyleSheet, View } from "react-native"
import { ActivityIndicator, Button, Card, FAB, Modal, Portal, Text } from "react-native-paper"
import { useRouter } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"

export default function StatusesList() {
  const router = useRouter()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)
  const queryClient = useQueryClient()
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<schema.Status | null>(null)

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => {
      return db.select().from(schema.statuses)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await db.delete(schema.statuses).where(eq(schema.statuses.id, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] })
    },
    onError: (error) => {
      console.error("Error deleting status:", error)
    },
  })

  const confirmDelete = (status: schema.Status) => {
    setSelectedStatus(status)
    setDeleteModalVisible(true)
  }

  const handleDelete = async () => {
    if (selectedStatus) {
      try {
        await deleteMutation.mutateAsync(selectedStatus.id)
        setDeleteModalVisible(false)
        setSelectedStatus(null)
      } catch (error) {
        console.error("Error in handleDelete:", error)
      }
    }
  }

  if (isLoading) {
    return <ActivityIndicator size="large" />
  }

  return (
    <View style={styles.container}>
      {statuses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No statuses found. Add a new one to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={statuses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{item.value}</Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => router.push(`/truant/statuses/${item.id}`as never)}>Edit</Button>
                <Button onPress={() => confirmDelete(item as schema.Status)}>Delete</Button>
              </Card.Actions>
            </Card>
          )}
        />
      )}
      <FAB icon="plus" style={styles.fab} onPress={() => router.push("/truant/statuses/new" as never)} />
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalText}>Are you sure you want to delete this status?</Text>
          <View style={styles.modalActions}>
            <Button onPress={handleDelete} mode="contained" loading={deleteMutation.isPending}>
              Delete
            </Button>
            <Button onPress={() => setDeleteModalVisible(false)} mode="outlined">
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 4,
  },
  modalText: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
})

