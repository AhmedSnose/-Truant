"use client"

import { addEvent, getEventById, updateEvent } from "@/actions/notion"
import TruantDropdown from "@/components/truant/TruantDropdown"
import type { Event } from "@/types/general"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocalSearchParams, useNavigation } from "expo-router"
import React, { useState, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { ScrollView, StyleSheet, View } from "react-native"
import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper"
import { TimePickerModal } from "react-native-paper-dates"
import * as schema from "@/db/schema"

import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useSQLiteContext } from "expo-sqlite"
import StatusDropdown from "@/components/truant/StatusDropdown"

const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
}

type FormData = {
  title: string
  start_time: string
  end_time: string
  description: string
  weight: number
  report: string
  truantId?: string
  statusId?: string
  status?: schema.Status
  truant?: schema.Truant
}

export default function EventEditPage() {
  const navigation = useNavigation()
  const theme = useTheme()
  const queryClient = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb, { schema })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: event,
    isLoading,
    error,
  } = useQuery<Event | null>({
    queryKey: ["fetchEvent", id],
    queryFn: async () => {
      if (!id) return null
      const event = await getEventById(id)
      if (event && (event.statusId || event.truantId)) {
        const status = db
          .select()
          .from(schema.statuses)
          .where(eq(schema.statuses.id, Number(event?.statusId)))
          .get()
        const truant = db
          .select()
          .from(schema.truants)
          .where(eq(schema.truants.id, Number(event?.truantId)))
          .get()
        event.status = status
        event.truant = truant
      }
      return event
    },
    enabled: !!id,
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>()

  useEffect(() => {
    if (event) {
      reset({
        title: event.title || "",
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        description: event.description || "",
        weight: event.weight || 0,
        report: event.report || "",
        statusId: event.statusId || "",
        truantId: event.truantId || "",
        status: event.status || {},
        truant: event.truant || {},
      })
    }
  }, [event, reset])

  const [startTimePickerVisible, setStartTimePickerVisible] = React.useState(false)
  const [endTimePickerVisible, setEndTimePickerVisible] = React.useState(false)

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const eventToSave = {
        ...data,
        truantId: data.truant?.id,
        statusId: data.status?.id,
      }

      if (id) {
        // @ts-ignore
        await updateEvent(id, eventToSave)
      } else {
        // @ts-ignore
        await addEvent(eventToSave)
      }
      queryClient.invalidateQueries(["fetchAllEvents"] as never)
      navigation.goBack()
    } catch (error) {
      console.error("Error saving event:", error)
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false)
    }
  }

  if (id && isLoading) {
    return <Text>Loading...</Text>
  }

  if (id && error) {
    return <Text>Error: {error.message}</Text>
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Controller
        control={control}
        rules={{ required: { value: true, message: ERROR_MESSAGES.REQUIRED } }}
        render={({ field: { onChange, value } }) => (
          <View>
            <StatusDropdown mood="asLookup" value={value!} onChange={onChange} error={errors.status?.message} />
            <HelperText type="error" visible={!!errors.status}>
              {errors.status?.message}
            </HelperText>
          </View>
        )}
        name="status"
      />
      <Controller
        control={control}
        // rules={{ required: "Truant is required" }}
        render={({ field: { onChange, value } }) => (
          <TruantDropdown value={value!} onChange={onChange} error={errors.truant?.message} />
        )}
        name="truant"
      />

      <Controller
        control={control}
        rules={{ required: "Title is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
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
          </>
        )}
        name="title"
      />

      <Controller
        control={control}
        rules={{ required: "Start time is required" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Start Time"
              value={value}
              onFocus={() => setStartTimePickerVisible(true)}
              error={!!errors.start_time}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.start_time}>
              {errors.start_time?.message}
            </HelperText>
            <TimePickerModal
              visible={startTimePickerVisible}
              onDismiss={() => setStartTimePickerVisible(false)}
              onConfirm={({ hours, minutes }) => {
                setStartTimePickerVisible(false)
                onChange(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
              }}
            />
          </>
        )}
        name="start_time"
      />

      <Controller
        control={control}
        rules={{ required: "End time is required" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="End Time"
              value={value}
              onFocus={() => setEndTimePickerVisible(true)}
              error={!!errors.end_time}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.end_time}>
              {errors.end_time?.message}
            </HelperText>
            <TimePickerModal
              visible={endTimePickerVisible}
              onDismiss={() => setEndTimePickerVisible(false)}
              onConfirm={({ hours, minutes }) => {
                setEndTimePickerVisible(false)
                onChange(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
              }}
            />
          </>
        )}
        name="end_time"
      />

      <Controller
        control={control}
        rules={{ required: "Description is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Description"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={4}
              error={!!errors.description}
              style={[styles.input, styles.textArea]}
            />
            <HelperText type="error" visible={!!errors.description}>
              {errors.description?.message}
            </HelperText>
          </>
        )}
        name="description"
      />

      <Controller
        control={control}
        rules={{
          required: "Weight is required",
          validate: (value) => !isNaN(value) || "Weight must be a number",
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Weight"
              onBlur={onBlur}
              onChangeText={(text) => {
                const numValue = Number.parseFloat(text)
                onChange(isNaN(numValue) ? text : numValue)
              }}
              value={String(value)}
              keyboardType="numeric"
              error={!!errors.weight}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.weight}>
              {errors.weight?.message}
            </HelperText>
          </>
        )}
        name="weight"
      />

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Report"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={4}
              error={!!errors.report}
              style={[styles.input, styles.textArea]}
            />
            <HelperText type="error" visible={!!errors.report}>
              {errors.report?.message}
            </HelperText>
          </>
        )}
        name="report"
      />

      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : id ? "Update Event" : "Add Event"}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 30,
  },
})

