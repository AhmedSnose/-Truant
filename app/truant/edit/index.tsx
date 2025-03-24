"use client"

import { useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import { Button, TextInput, HelperText, ActivityIndicator } from "react-native-paper"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Controller, useForm } from "react-hook-form"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { eq } from "drizzle-orm"
import * as schema from "@/db/schema"
import CategoryDropdown from "@/components/truant/CategoryDropdown"
import PriorityDropdown from "@/components/truant/PriorityDropdown"
import StatusDropdown from "@/components/truant/StatusDropdown"

type FormData = {
  title: string
  description: string
  link: string
  categoryId: number | null
  priorityId: number | null
  statusId: number | null
}

type TruantData = {
  title: string
  description: string | null
  link: string | null
  categoryId: number
  priorityId: number
  statusId: number
}

const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
}

export default function EditTruant() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      link: "",
      categoryId: null,
      priorityId: null,
      statusId: null,
    },
  })

  const { data: truant, isLoading: isFetching } = useQuery({
    queryKey: ["truant", id],
    queryFn: async () => {
      if (id === "new") return null
      const result = db
        .select()
        .from(schema.truants)
        .where(eq(schema.truants.id, Number.parseInt(id)))
        .get()
      return result as TruantData | null
    },
    enabled: id !== "new",
  })

  useEffect(() => {
    if (truant) {
      reset({
        title: truant.title,
        description: truant.description || "",
        link: truant.link || "",
        categoryId: truant.categoryId,
        priorityId: truant.priorityId,
        statusId: truant.statusId,
      })
    }
  }, [truant, reset])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const truantData: TruantData = {
          title: data.title,
          description: data.description || null,
          link: data.link || null,
          categoryId: data.categoryId || 0, // Assuming 0 is a valid default or handle this case as needed
          priorityId: data.priorityId || 0,
          statusId: data.statusId || 0,
        }
        if (id === "new") {
          await db.insert(schema.truants).values(truantData)
        } else {
          await db
            .update(schema.truants)
            .set(truantData)
            .where(eq(schema.truants.id, Number.parseInt(id)))
        }
      } catch (error) {
        console.error("Error saving truant:", error)
        setErrorMessage("Error saving truant. Please try again.")
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["truants"] })
      router.back()
    },
  })

  const onSubmit = (data: FormData) => {
    console.log(data, 'sss');

    mutation.mutate(data)
  }

  if (isFetching) {
    return <ActivityIndicator size="large" />
  }

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        rules={{ required: { value: true, message: ERROR_MESSAGES.REQUIRED } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              label="Title"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.title}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.title}>
              {errors.title?.message}
            </HelperText>
          </View>
        )}
        name="title"
      />

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Description"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />
        )}
        name="description"
      />

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Link" onBlur={onBlur} onChangeText={onChange} value={value} style={styles.input} />
        )}
        name="link"
      />

      <Controller
        control={control}
        rules={{ required: { value: true, message: ERROR_MESSAGES.REQUIRED } }}
        render={({ field: { onChange, value } }) => (
          <View>
            <CategoryDropdown value={value} onChange={onChange} error={errors.categoryId?.message} />
            <HelperText type="error" visible={!!errors.categoryId}>
              {errors.categoryId?.message}
            </HelperText>
          </View>
        )}
        name="categoryId"
      />


      <Controller
        control={control}
        rules={{ required: { value: true, message: ERROR_MESSAGES.REQUIRED } }}
        render={({ field: { onChange, value } }) => (
          <View>
            <StatusDropdown mood="default" value={value!} onChange={onChange} error={errors.statusId?.message} />
            <HelperText type="error" visible={!!errors.statusId}>
              {errors.statusId?.message}
            </HelperText>
          </View>
        )}
        name="statusId"
      />

      <Controller
        control={control}
        rules={{ required: { value: true, message: ERROR_MESSAGES.REQUIRED } }}
        render={({ field: { onChange, value } }) => (
          <View>
            <PriorityDropdown value={value} onChange={onChange} error={errors.priorityId?.message} />
            <HelperText type="error" visible={!!errors.priorityId}>
              {errors.priorityId?.message}
            </HelperText>
          </View>
        )}
        name="priorityId"
      />

      {errorMessage && (
        <HelperText type="error" visible={true}>
          {errorMessage}
        </HelperText>
      )}

      <Button mode="contained" onPress={handleSubmit(onSubmit)} disabled={isLoading || !isValid} style={styles.button}>
        {isLoading
          ? id === "new"
            ? "Creating Truant..."
            : "Updating Truant..."
          : id === "new"
            ? "Create Truant"
            : "Update Truant"}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 10,
  },
  textArea: {
    textAlignVertical: "top",
  },
  button: {
    marginTop: 20,
  },
})

