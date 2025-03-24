import TruantCard from "@/components/truant/TruantCard"
import * as schema from "@/db/schema"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useNavigation } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import { useCallback, useState } from "react"
import { FlatList, StyleSheet, View } from "react-native"
import { ActivityIndicator, Button, FAB, Modal, Portal, Text } from "react-native-paper"

export default function TruantScreen() {
  // const router = useRouter()
  const navigation = useNavigation()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb, { schema }) // Add schema configuration here
  const queryClient = useQueryClient()
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedTruant, setSelectedTruant] = useState<schema.TruantWithRelations | null>(null)


  // Updated query with relations
  const { data: truants = [], isLoading } = useQuery({
    queryKey: ["truants"],
    queryFn: async () => {
      const result = await db.query.truants.findMany({
        with: {
          category: true,
          priority: true,
          status: true,
        },
        columns: {
          categoryId: false,
          priorityId: false,
          statusId: false,
        }
      });
      return result as schema.TruantWithRelations[];
    },
  })
  
    
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await db.delete(schema.truants).where(eq(schema.truants.id, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["truants"] })
    },
  })

  const confirmDelete = (truant: schema.TruantWithRelations) => {
    setSelectedTruant(truant)
    setDeleteModalVisible(true)
  }

  const handleDelete = async () => {
    if (selectedTruant) {
      await deleteMutation.mutateAsync(selectedTruant.id)
      setDeleteModalVisible(false)
    }
  }

  const handleUpdate = useCallback(
    (id: number) => {
      // @ts-ignore
      navigation.navigate("edit/index" as never, { id: id.toString() } as never)
    },
    [navigation],
  )

  const handleShow = (id:number) => { }
  // const handleShow = useCallback(
  //   (id: number) => {
  //     // @ts-ignore
  //     navigation.navigate("edit/index/[id]" as never, { id: id.toString() } as never)
  //   },
  //   [navigation],
  // )

  const handleAddTruant = useCallback(() => {
    // @ts-ignore
    navigation.navigate("edit/index" as never, { id: "new" } as never)
  }, [navigation])


  if (isLoading) {
    return <ActivityIndicator size="large" />
  }

  return (
    <View style={styles.container}>
      {truants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No truants found. Add a new one to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={truants}
          renderItem={({ item }:{item:schema.TruantWithRelations}) => (
            <TruantCard
              truant={item}
              onDelete={() => confirmDelete(item)}
              onUpdate={() => handleUpdate(item.id)}
              onShow={() => handleShow(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
      <FAB icon="plus" style={styles.fab} onPress={handleAddTruant} />
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalText}>Are you sure you want to delete this truant?</Text>
          <View style={styles.modalActions}>
            <Button onPress={handleDelete} mode="contained">
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
  list: {
    paddingBottom: 80,
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
  },
})

