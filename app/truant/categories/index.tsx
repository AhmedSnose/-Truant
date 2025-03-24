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

export default function CategoriesList() {
  const router = useRouter()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)
  const queryClient = useQueryClient()
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<schema.Category | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return db.select().from(schema.categories)
    },
  })

  console.log(categories, 'categories');
  

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await db.delete(schema.categories).where(eq(schema.categories.id, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (error) => {
      console.error("Error deleting category:", error)
    },
  })

  const confirmDelete = (category: schema.Category) => {
    setSelectedCategory(category)
    setDeleteModalVisible(true)
  }

  const handleDelete = async () => {
    if (selectedCategory) {
      try {
        await deleteMutation.mutateAsync(selectedCategory.id)
        setDeleteModalVisible(false)
        setSelectedCategory(null)
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
      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No categories found. Add a new one to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{item.title}</Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => router.push(`/truant/categories/${item.id}`)}>Edit</Button>
                <Button onPress={() => confirmDelete(item as schema.Category)}>Delete</Button>
              </Card.Actions>
            </Card>
          )}
        />
      )}
      <FAB icon="plus" style={styles.fab} onPress={() => router.push("/truant/categories/new")} />
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalText}>Are you sure you want to delete this category?</Text>
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

