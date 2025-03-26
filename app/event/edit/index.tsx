"use client"

import { addEvent, getEventById, updateEvent } from "@/actions/notion"
import TruantDropdown from "@/components/truant/TruantDropdown"
import type { Event } from "@/types/general"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocalSearchParams, useNavigation } from "expo-router"
import React, { useState, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import {
  Button,
  Card,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper"
import { TimePickerModal } from "react-native-paper-dates"

import StatusDropdown from "@/components/truant/StatusDropdown"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useSQLiteContext } from "expo-sqlite"

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
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false)
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false)

  // Fetch existing event data if `id` is present
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

  
  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>()

  // Populate the form if we have existing event data
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const eventToSave = {
        ...data,
        truantId: data.truant?.id,
        statusId: data.status?.id,
      }

      if (id) {
        // Updating existing event
        // @ts-ignore
        await updateEvent(id, eventToSave)
      } else {
        // Creating a new event
        // @ts-ignore
        await addEvent(eventToSave)
      }

      queryClient.invalidateQueries(["fetchAllEvents"] as never)
      navigation.goBack()
    } catch (error) {
      console.error("Error saving event:", error)
      // Show user-friendly error if needed
    } finally {
      setIsSubmitting(false)
    }
  }

  if (id && isLoading) {
    return <Text style={{ margin: 16 }}>Loading...</Text>
  }

  if (id && error) {
    return (
      <Text style={{ margin: 16, color: theme.colors.error }}>
        Error: {error.message}
      </Text>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title
            title={id ? "Update Event" : "Add Event"}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            {/* STATUS */}
            <Controller
              control={control}
              rules={{ required: ERROR_MESSAGES.REQUIRED }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <StatusDropdown
                    mood="asLookup"
                    value={value!}
                    onChange={onChange}
                    error={errors.status?.message}
                  />
                  <HelperText type="error" visible={!!errors.status}>
                    {errors.status?.message}
                  </HelperText>
                </View>
              )}
              name="status"
            />

            {/* TRUANT */}
            <Controller
              control={control}
              // If you want it required, add `rules={{ required: ERROR_MESSAGES.REQUIRED }}`
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <TruantDropdown
                    value={value!}
                    onChange={onChange}
                    error={errors.truant?.message}
                  />
                  <HelperText type="error" visible={!!errors.truant}>
                    {errors.truant?.message}
                  </HelperText>
                </View>
              )}
              name="truant"
            />

            {/* TITLE */}
            <Controller
              control={control}
              rules={{ required: "Title is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    label="Title"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.title}
                    mode="outlined"
                    style={styles.input}
                  />
                  <HelperText type="error" visible={!!errors.title}>
                    {errors.title?.message}
                  </HelperText>
                </View>
              )}
              name="title"
            />

            {/* START TIME */}
            <Controller
              control={control}
              // rules={{ required: "Start time is required" }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text variant="labelLarge" style={styles.label}>
                    Start Time
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setStartTimePickerVisible(true)}
                    style={styles.timeButton}
                  >
                    {value ? `Selected: ${value}` : "Pick a Start Time"}
                  </Button>
                  <HelperText type="error" visible={!!errors.start_time}>
                    {errors.start_time?.message}
                  </HelperText>

                  <TimePickerModal
                    visible={startTimePickerVisible}
                    onDismiss={() => setStartTimePickerVisible(false)}
                    onConfirm={({ hours, minutes }) => {
                      setStartTimePickerVisible(false)
                      const hh = hours.toString().padStart(2, "0")
                      const mm = minutes.toString().padStart(2, "0")
                      onChange(`${hh}:${mm}`)
                    }}
                  />
                </View>
              )}
              name="start_time"
            />

            {/* END TIME */}
            <Controller
              control={control}
              // rules={{ required: "End time is required" }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text variant="labelLarge" style={styles.label}>
                    End Time
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setEndTimePickerVisible(true)}
                    style={styles.timeButton}
                  >
                    {value ? `Selected: ${value}` : "Pick an End Time"}
                  </Button>
                  <HelperText type="error" visible={!!errors.end_time}>
                    {errors.end_time?.message}
                  </HelperText>

                  <TimePickerModal
                    visible={endTimePickerVisible}
                    onDismiss={() => setEndTimePickerVisible(false)}
                    onConfirm={({ hours, minutes }) => {
                      setEndTimePickerVisible(false)
                      const hh = hours.toString().padStart(2, "0")
                      const mm = minutes.toString().padStart(2, "0")
                      onChange(`${hh}:${mm}`)
                    }}
                  />
                </View>
              )}
              name="end_time"
            />

            {/* DESCRIPTION */}
            <Controller
              control={control}
              rules={{ required: "Description is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    label="Description"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={4}
                    error={!!errors.description}
                    mode="outlined"
                    style={[styles.input, styles.textArea]}
                  />
                  <HelperText type="error" visible={!!errors.description}>
                    {errors.description?.message}
                  </HelperText>
                </View>
              )}
              name="description"
            />

            {/* WEIGHT */}
            <Controller
              control={control}
              rules={{
                required: "Weight is required",
                validate: (value) => !isNaN(value) || "Weight must be a number",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    label="Weight"
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      const numValue = Number.parseFloat(text)
                      onChange(numValue)
                    }}
                    value={!!value ? String(value) : ''}
                    keyboardType="numeric"
                    error={!!errors.weight}
                    mode="outlined"
                    style={styles.input}
                  />
                  <HelperText type="error" visible={!!errors.weight}>
                    {errors.weight?.message}
                  </HelperText>
                </View>
              )}
              name="weight"
            />

            {/* REPORT (OPTIONAL) */}
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    label="Report (Optional)"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={4}
                    error={!!errors.report}
                    mode="outlined"
                    style={[styles.input, styles.textArea]}
                  />
                  <HelperText type="error" visible={!!errors.report}>
                    {errors.report?.message}
                  </HelperText>
                </View>
              )}
              name="report"
            />

            {/* SUBMIT BUTTON */}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : id ? "Update Event" : "Add Event"}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 8,
    paddingBottom: 16,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
  },
  timeButton: {
    marginTop: 4,
  },
  input: {
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    marginTop: 8,
  },
})
