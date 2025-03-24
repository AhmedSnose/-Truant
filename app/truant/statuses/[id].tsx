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

type StatusFormData = {
  id?: number
  value: string
}

export default function EditStatus() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<StatusFormData>({
    value: "",
  })

  const { data: status, isLoading } = useQuery({
    queryKey: ["status", id],
    queryFn: async () => {
      if (id === "new") return null
      return db
        .select()
        .from(schema.statuses)
        .where(eq(schema.statuses.id, Number.parseInt(id)))
        .get()
    },
    enabled: id !== "new",
  })

  useEffect(() => {
    if (status) {
      setFormData({
        id: status.id,
        value: status.value,
      })
    }
  }, [status])

  const mutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      if (id === "new") {
        await db.insert(schema.statuses).values({
          value: data.value,
        })
      } else {
        await db
          .update(schema.statuses)
          .set({
            value: data.value,
          })
          .where(eq(schema.statuses.id, Number.parseInt(id)))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] })
      queryClient.invalidateQueries({ queryKey: ["status", id] })
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
        label="Status Value"
        value={formData.value}
        onChangeText={(text) => setFormData({ ...formData, value: text })}
        style={styles.input}
      />
      <HelperText type="error" visible={!!mutation.error}>
        {mutation.error ? "Error saving status" : ""}
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

