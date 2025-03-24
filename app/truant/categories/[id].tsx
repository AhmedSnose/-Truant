"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { Button, TextInput, HelperText } from "react-native-paper"
import { Dropdown } from "react-native-element-dropdown"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"

type CategoryFormData = {
  id?: number
  title: string
  parentId: number | null
}

export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CategoryFormData>({
    title: "",
    parentId: null,
  })

  const { data: category, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (id === "new") return null
      return db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, Number.parseInt(id)))
        .get()
    },
    enabled: id !== "new",
  })

  const { data: parentCategories = [], isLoading: isParentCategoriesLoading } = useQuery({
    queryKey: ["parentCategories"],
    queryFn: async () => {
      return db.select().from(schema.categories)
    },
  })

  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id,
        title: category.title,
        parentId: category.parentId,
      })
    }
  }, [category])

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (id === "new") {
        await db.insert(schema.categories).values({
          title: data.title,
          parentId: data.parentId,
        })
      } else {
        await db
          .update(schema.categories)
          .set({
            title: data.title,
            parentId: data.parentId,
          })
          .where(eq(schema.categories.id, Number.parseInt(id)))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["category", id] })
      router.back()
    },
  })

  const handleSave = async () => {
    mutation.mutate(formData)
  }

  if (isCategoryLoading || isParentCategoriesLoading) {
    return <ActivityIndicator size="large" />
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Category Title"
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
        style={styles.input}
      />
      <HelperText type="error" visible={!!mutation.error}>
        {mutation.error ? "Error saving category" : ""}
      </HelperText>

      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={parentCategories.map((cat) => ({ label: cat.title, value: cat.id.toString() }))}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder="Select parent category"
        searchPlaceholder="Search..."
        value={formData.parentId?.toString()}
        onChange={(item) => {
          setFormData({ ...formData, parentId: item.value ? Number.parseInt(item.value) : null })
        }}
      />

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
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  button: {
    marginTop: 16,
  },
})

