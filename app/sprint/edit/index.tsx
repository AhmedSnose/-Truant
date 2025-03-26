"use client"

import { createSprint, updateSprint } from "@/actions/notion"
import { FormData } from "@/types/general"
import { useRoute } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigation, useRouter } from "expo-router"
import React from "react"
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
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper"
import { DatePickerModal } from "react-native-paper-dates"
import { post as createSprintLocal, update as updateSprintLocal } from "@/services/SprintService"; // Import local DB functions

type SprintFormData = {
  title: string
  startDate: string
  endDate: string
  totalTime: number
  // goalTime removed
  description?: string // now optional
}

export default function SprintEditPage() {
  const navigation = useNavigation()
  const expoRouter = useRouter()
  const theme = useTheme()
  const queryClient = useQueryClient()
  const route = useRoute()
  const { sprintData }: any = route.params

  // We'll default to today's date if none is provided
  const today = new Date().toISOString().split("T")[0]

  // React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SprintFormData>({
    defaultValues: sprintData || {
      title: "",
      startDate: today,
      endDate: today,
      totalTime: 0,
      description: "",
    },
  })

  // Switches to auto-set start/end date to "today"
  const [useTodayStart, setUseTodayStart] = React.useState<boolean>(
    sprintData?.startDate ? false : true
  )
  const [useTodayEnd, setUseTodayEnd] = React.useState<boolean>(
    sprintData?.endDate ? false : true
  )

  // Date pickers visibility
  const [startDatePickerVisible, setStartDatePickerVisible] =
    React.useState(false)
  const [endDatePickerVisible, setEndDatePickerVisible] = React.useState(false)

  // Whenever user toggles "Use today's date" for start, set or clear the date
  React.useEffect(() => {
    if (useTodayStart) {
      setValue("startDate", today)
    }
  }, [useTodayStart])

  // Same for end date
  React.useEffect(() => {
    if (useTodayEnd) {
      setValue("endDate", today)
    }
  }, [useTodayEnd])

  // const onSubmit = async (data: SprintFormData) => {
  //   try {
  //     if (!data.startDate) data.startDate = today
  //     if (!data.endDate) data.endDate = today

  //     if (sprintData) {
  //       // Updating existing sprint
  //       // @ts-ignore
  //       await updateSprint(sprintData.id, data)
  //     } else {
  //       // Creating new sprint
  //       //@ts-ignore
  //       await createSprint(data)
  //     }
  //     queryClient.invalidateQueries(["fetchAllSprints"] as never)
  //     expoRouter.back()
  //   } catch (error) {
  //     console.error("Error saving sprint:", error)
  //     // Optionally show an alert or message
  //   }
  // }

  const onSubmit = async (data: SprintFormData) => {
    try {
      if (!data.startDate) data.startDate = today;
      if (!data.endDate) data.endDate = today;

      if (sprintData) {
        // **Updating existing sprint**
        // @ts-ignore
        // await updateSprint(sprintData.id, data); // Update in Notion API
        await updateSprintLocal(sprintData.id, data); // Update in Local DB
      } else {
        // **Creating new sprint**
        // @ts-ignore
        // const notionSprint = await createSprint(data); // Save in Notion API
        // @ts-ignore

        await createSprintLocal(data); // Save in SQLite (Local DB)
      }

      queryClient.invalidateQueries(["fetchAllSprints"] as never);
      expoRouter.back();
    } catch (error) {
      console.error("Error saving sprint:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title
            title={sprintData ? "Update Sprint" : "Add Sprint"}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            {/* TITLE */}
            <Controller
              control={control}
              rules={{ required: "Title is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Title"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.title}
                  />
                  <HelperText type="error" visible={!!errors.title}>
                    {errors.title?.message}
                  </HelperText>
                </View>
              )}
              name="title"
            />

            {/* START DATE */}
            <View style={styles.field}>
              <Text variant="labelLarge">Start Date</Text>
              <View style={styles.switchRow}>
                <Switch
                  value={useTodayStart}
                  onValueChange={setUseTodayStart}
                  style={styles.switch}
                />
                <Text style={styles.switchText}>Use Today's Date</Text>
              </View>

              {!useTodayStart && (
                <>
                  <Button
                    mode="outlined"
                    onPress={() => setStartDatePickerVisible(true)}
                    style={styles.dateButton}
                  >
                    Pick Start Date
                  </Button>
                  <Controller
                    control={control}
                    rules={{ required: "Start date is required" }}
                    render={({ field: { onChange, value } }) => (
                      <>
                        <HelperText
                          type="info"
                          visible={!!value && !errors.startDate}
                        >
                          Current: {value}
                        </HelperText>
                        <HelperText type="error" visible={!!errors.startDate}>
                          {errors.startDate?.message}
                        </HelperText>
                        <DatePickerModal
                          locale="en"
                          mode="single"
                          visible={startDatePickerVisible}
                          onDismiss={() => setStartDatePickerVisible(false)}
                          date={value ? new Date(value) : new Date()}
                          onConfirm={({ date }) => {
                            setStartDatePickerVisible(false)
                            if (date) {
                              onChange(date.toISOString().split("T")[0])
                            }
                          }}
                        />
                      </>
                    )}
                    name="startDate"
                  />
                </>
              )}
            </View>

            {/* END DATE */}
            <View style={styles.field}>
              <Text variant="labelLarge">End Date</Text>
              <View style={styles.switchRow}>
                <Switch
                  value={useTodayEnd}
                  onValueChange={setUseTodayEnd}
                  style={styles.switch}
                />
                <Text style={styles.switchText}>Use Today's Date</Text>
              </View>

              {!useTodayEnd && (
                <>
                  <Button
                    mode="outlined"
                    onPress={() => setEndDatePickerVisible(true)}
                    style={styles.dateButton}
                  >
                    Pick End Date
                  </Button>
                  <Controller
                    control={control}
                    rules={{ required: "End date is required" }}
                    render={({ field: { onChange, value } }) => (
                      <>
                        <HelperText
                          type="info"
                          visible={!!value && !errors.endDate}
                        >
                          Current: {value}
                        </HelperText>
                        <HelperText type="error" visible={!!errors.endDate}>
                          {errors.endDate?.message}
                        </HelperText>
                        <DatePickerModal
                          locale="en"
                          mode="single"
                          visible={endDatePickerVisible}
                          onDismiss={() => setEndDatePickerVisible(false)}
                          date={value ? new Date(value) : new Date()}
                          onConfirm={({ date }) => {
                            setEndDatePickerVisible(false)
                            if (date) {
                              onChange(date.toISOString().split("T")[0])
                            }
                          }}
                        />
                      </>
                    )}
                    name="endDate"
                  />
                </>
              )}
            </View>

            {/* TOTAL TIME */}
            <Controller
              control={control}
              rules={{ required: "Total time is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Total Time (hours)"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value)}
                    keyboardType="numeric"
                    error={!!errors.totalTime}
                  />
                  <HelperText type="error" visible={!!errors.totalTime}>
                    {errors.totalTime?.message}
                  </HelperText>
                </View>
              )}
              name="totalTime"
            />

            {/* DESCRIPTION (Optional) */}
            <Controller
              control={control}
              rules={{ required: "Description is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Description"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={4}
                    error={!!errors.description}
                    style={styles.textArea}
                  />
                  <HelperText type="error" visible={!!errors.description}>
                    {errors.description?.message}
                  </HelperText>
                </View>
              )}
              name="description"
            />

            {/* SUBMIT BUTTON */}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.submitButton}
            >
              {sprintData ? "Update Sprint" : "Add Sprint"}
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
  dateButton: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  switch: {
    marginRight: 8,
  },
  switchText: {
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    marginTop: 8,
  },
})
