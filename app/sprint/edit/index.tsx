"use client"

import { createSprint, updateSprint } from "@/actions/notion"
import { FormData } from "@/types/general"
import { useRoute } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigation, useRouter } from "expo-router"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { StyleSheet, View } from "react-native"
import { Button, HelperText, TextInput, useTheme } from "react-native-paper"
import { DatePickerModal } from "react-native-paper-dates"

// type FormData = {
//   title: string
//   startDate: string
//   endDate: string
//   totalTime: number
//   goalTime: number
//   description: string
// }

export default function SprintEditPage() {
  const navigation = useNavigation()
  const theme = useTheme()
  const route = useRoute();
  const expoRouter = useRouter();
  const queryClient = useQueryClient()
  const { sprintData }: any = route.params
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    defaultValues: sprintData || {
      title: "",
      startDate: "",
      endDate: "",
      totalTime: 0,
      goalTime: 0,
      description: "",
    },
  })

  const [startDatePickerVisible, setStartDatePickerVisible] = React.useState(false)
  const [endDatePickerVisible, setEndDatePickerVisible] = React.useState(false)

  const onSubmit = async (data: FormData) => {
    if (sprintData) {
      // @ts-ignore
      await updateSprint(sprintData.id, data)
    } else {
      await createSprint(data)
    }
    queryClient.invalidateQueries(["fetchAllSprints"] as never)
    expoRouter.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        rules={{ required: "Start date is required" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Start Date"
              value={value}
              onFocus={() => setStartDatePickerVisible(true)}
              error={!!errors.startDate}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.startDate}>
              {errors.startDate?.message}
            </HelperText>
            <DatePickerModal
              locale="en"
              mode="single"
              visible={startDatePickerVisible}
              onDismiss={() => setStartDatePickerVisible(false)}
              date={value ? new Date(value) : undefined}
              onConfirm={({ date }) => {
                setStartDatePickerVisible(false)
                onChange(date?.toISOString().split("T")[0])
              }}
            />
          </>
        )}
        name="startDate"
      />

      <Controller
        control={control}
        rules={{ required: "End date is required" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="End Date"
              value={value}
              onFocus={() => setEndDatePickerVisible(true)}
              error={!!errors.endDate}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.endDate}>
              {errors.endDate?.message}
            </HelperText>
            <DatePickerModal
              locale="en"
              mode="single"
              visible={endDatePickerVisible}
              onDismiss={() => setEndDatePickerVisible(false)}
              date={value ? new Date(value) : undefined}
              onConfirm={({ date }) => {
                setEndDatePickerVisible(false)
                onChange(date?.toISOString().split("T")[0])
              }}
            />
          </>
        )}
        name="endDate"
      />

      <Controller
        control={control}
        rules={{ required: "Total time is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Total Time (hours)"
              onBlur={onBlur}
              onChangeText={onChange}
              value={String(value)}
              keyboardType="numeric"
              error={!!errors.totalTime}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.totalTime}>
              {errors.totalTime?.message}
            </HelperText>
          </>
        )}
        name="totalTime"
      />

      <Controller
        control={control}
        rules={{ required: "Goal time is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Goal Time (hours)"
              onBlur={onBlur}
              onChangeText={onChange}
              value={String(value)}
              keyboardType="numeric"
              error={!!errors.goalTime}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.goalTime}>
              {errors.goalTime?.message}
            </HelperText>
          </>
        )}
        name="goalTime"
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

      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.submitButton}>
        {sprintData ? "Update Sprint" : "Add Sprint"}
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
    marginBottom: 8,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    marginTop: 16,
  },
})

