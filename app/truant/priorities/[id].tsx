"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { Button, TextInput, HelperText } from "react-native-paper"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"

type PriorityFormData = {
  id?: number
  value: string
}

export default function EditPriority() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<PriorityFormData>({
    value: "",
  })

  const { data: priority, isLoading } = useQuery({
    queryKey: ["priority", id],
    queryFn: async () => {
      if (id === "new") return null
      return db
        .select()
        .from(schema.priorities)
        .where(eq(schema.priorities.id, Number.parseInt(id)))
        .get()
    },
    enabled: id !== "new",
  })

  useEffect(() => {
    if (priority) {
      setFormData({
        id: priority.id,
        value: priority.value,
      })
    }
  }, [priority])

  const mutation = useMutation({
    mutationFn: async (data: PriorityFormData) => {
      if (id === "new") {
        await db.insert(schema.priorities).values({
          value: data.value,
        })
      } else {
        await db
          .update(schema.priorities)
          .set({
            value: data.value,
          })
          .where(eq(schema.priorities.id, Number.parseInt(id)))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priorities"] })
      queryClient.invalidateQueries({ queryKey: ["priority", id] })
      router.back()
    },
  })

  const handleSave = async () => {
    mutation.mutate(formData)
  }

  if (isLoading) {
    return <ActivityIndicator size="large" />
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Priority Value"
        value={formData.value}
        onChangeText={(text) => setFormData({ ...formData, value: text })}
        style={styles.input}
      />
      <HelperText type="error" visible={!!mutation.error}>
        {mutation.error ? "Error saving priority" : ""}
      </HelperText>

      <Button mode="contained" onPress={handleSave} disabled={mutation.isPending} style={styles.button}>
        {mutation.isPending ? "Saving..." : "Save"}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
})

