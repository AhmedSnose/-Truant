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

export default function PrioritiesList() {
    const router = useRouter()
    const expoDb = useSQLiteContext()
    const db = drizzle(expoDb)
    const queryClient = useQueryClient()
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [selectedPriority, setSelectedPriority] = useState<schema.Priority | null>(null)

    const { data: priorities = [], isLoading } = useQuery({
        queryKey: ["priorities"],
        queryFn: async () => {
            return db.select().from(schema.priorities)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await db.delete(schema.priorities).where(eq(schema.priorities.id, id))
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["priorities"] })
        },
        onError: (error) => {
            console.error("Error deleting priority:", error)
        },
    })

    const confirmDelete = (priority: schema.Priority) => {
        setSelectedPriority(priority)
        setDeleteModalVisible(true)
    }

    const handleDelete = async () => {
        if (selectedPriority) {
            try {
                await deleteMutation.mutateAsync(selectedPriority.id)
                setDeleteModalVisible(false)
                setSelectedPriority(null)
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
            {priorities.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text>No priorities found. Add a new one to get started!</Text>
                </View>
            ) : (
                <FlatList
                    data={priorities}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text variant="titleMedium">{item.value}</Text>
                            </Card.Content>
                            <Card.Actions>
                                <Button onPress={() => router.push(`/truant/priorities/${item.id}` as never)}>Edit</Button>
                                <Button onPress={() => confirmDelete(item as schema.Priority)}>Delete</Button>
                            </Card.Actions>
                        </Card>
                    )}
                />
            )}
            <FAB icon="plus" style={styles.fab} onPress={() => router.push("/truant/priorities/new" as never)} />
            <Portal>
                <Modal
                    visible={deleteModalVisible}
                    onDismiss={() => setDeleteModalVisible(false)}
                    contentContainerStyle={styles.modalContent}
                >
                    <Text style={styles.modalText}>Are you sure you want to delete this priority?</Text>
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

