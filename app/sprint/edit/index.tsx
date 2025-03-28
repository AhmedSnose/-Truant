"use client"

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
  Snackbar,
  Modal,
  Portal,
} from "react-native-paper"
import { DatePickerModal } from "react-native-paper-dates"
import {
  post as createSprintLocal,
  update as updateSprintLocal,
  show as showSprintLocal,
} from "@/services/SprintService"
import { Sprint } from "@/db/schema"
import { createSprint, updateSprint } from "@/actions/notion/sprints"

type SprintFormData = {
  title: string
  startDate: string
  endDate: string
  totalTime: number
  description?: string
  referenceId?: string
}

export default function SprintEditPage() {
  const navigation = useNavigation()
  const expoRouter = useRouter()
  const theme = useTheme()
  const queryClient = useQueryClient()
  const route = useRoute()
  const { sprintData } = route.params as { sprintData?: Sprint }

  const today = new Date().toISOString().split("T")[0]

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SprintFormData>({
    defaultValues: {
      title: sprintData?.title || "",
      startDate: sprintData?.startDate || today,
      endDate: sprintData?.endDate || today,
      totalTime: sprintData?.totalTime || 0,
      description: sprintData?.description || "",
      referenceId: sprintData?.referenceId || "",
    },
  })

  const [useTodayStart, setUseTodayStart] = React.useState<boolean>(
    sprintData?.startDate ? false : true
  )
  const [useTodayEnd, setUseTodayEnd] = React.useState<boolean>(
    sprintData?.endDate ? false : true
  )

  const [startDatePickerVisible, setStartDatePickerVisible] =
    React.useState(false)
  const [endDatePickerVisible, setEndDatePickerVisible] =
    React.useState(false)

  const [snackbarVisible, setSnackbarVisible] = React.useState(false)
  const [snackbarMsg, setSnackbarMsg] = React.useState("")

  // New state for error confirmation modal
  const [errorModalVisible, setErrorModalVisible] = React.useState(false)
  const [errorModalMessage, setErrorModalMessage] = React.useState("")

  React.useEffect(() => {
    if (useTodayStart) {
      setValue("startDate", today)
    }
  }, [useTodayStart])

  React.useEffect(() => {
    if (useTodayEnd) {
      setValue("endDate", today)
    }
  }, [useTodayEnd])

  const onSubmit = async (data: SprintFormData) => {
    try {
      if (!data.startDate) data.startDate = today
      if (!data.endDate) data.endDate = today

      const referenceIdValue =
        data.referenceId && data.referenceId.trim() !== ""
          ? data.referenceId.trim()
          : null

      if (sprintData) {
        await updateSprintLocal(sprintData.id, {
          ...data,
          isSynced: 0,
          referenceId: referenceIdValue,
        })
      } else {
        await createSprintLocal({
          ...data,
          isSynced: 0,
          referenceId: referenceIdValue,
        })
      }
      queryClient.invalidateQueries(["fetchAllSprints"] as never)
      expoRouter.back()
    } catch (error) {
      console.error("Error saving sprint:", error)
      setSnackbarMsg("Error saving sprint")
      setSnackbarVisible(true)
    }
  }

  // Sync button handler – visible only in edit mode
  const handleSync = async () => {
    if (!sprintData) return
    try {
      let updatedReferenceId = sprintData?.referenceId

      if (sprintData?.referenceId) {
        // Update existing Notion page
        await updateSprint(sprintData.referenceId, {
          days: sprintData.days,
          description: sprintData.description,
          endDate: sprintData.endDate,
          goalTime: sprintData.goalTime || 0,
          startDate: sprintData.startDate,
          title: sprintData.title,
          totalTime: sprintData.totalTime,
        })
      } else {
        // Create a new Notion page
        const result = await createSprint({
          days: sprintData?.days,
          description: sprintData.description || "",
          endDate: sprintData.endDate,
          goalTime: sprintData.goalTime || 0,
          startDate: sprintData.startDate,
          title: sprintData.title,
          totalTime: sprintData.totalTime || 0,
        })
        updatedReferenceId = result?.id
      }

      // Mark the sprint as synced in local DB
      await updateSprintLocal(sprintData.id, {
        ...sprintData,
        isSynced: 1,
        referenceId: updatedReferenceId,
      })

      queryClient.invalidateQueries(["fetchAllSprints"] as never)
      setSnackbarMsg("Sprint synced successfully")
      setSnackbarVisible(true)
      expoRouter.back()
    } catch (error: any) {
      if (error.code === "validation_error") {
        // Show modal asking if user wants to remove the reference link
        setErrorModalMessage(error.message || "Validation error occurred.")
        setErrorModalVisible(true)
      } else {
        setSnackbarMsg(error.message || "Sync failed")
        setSnackbarVisible(true)
      }
    }
  }

  // Called when the user confirms removal of the reference link in the error modal
  const handleRemoveReference = async () => {
    if (!sprintData) return
    try {
      await updateSprintLocal(sprintData.id, {
        ...sprintData,
        isSynced: 0,
        referenceId: null,
      })
      queryClient.invalidateQueries(["fetchAllSprints"] as never)
      setSnackbarMsg("Reference link removed. Please try syncing again.");
      setSnackbarVisible(true)
      expoRouter.back();
    } catch (error) {
      console.error("Error removing reference:", error)
      setSnackbarMsg("Error removing reference")
      setSnackbarVisible(true)
    } finally {
      setErrorModalVisible(false)
    }
  }

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
                        <HelperText type="info" visible={!!value && !errors.startDate}>
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
                        <HelperText type="info" visible={!!value && !errors.endDate}>
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

            {/* DESCRIPTION */}
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

            {/* Sync button visible only in edit mode */}
            {sprintData && (
              <Button
                mode="outlined"
                onPress={handleSync}
                style={styles.syncButton}
              >
                Sync With Notion
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Snackbar for toaster messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ marginBottom: 70 }}
        action={{
          label: "Dismiss",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMsg}
      </Snackbar>

      {/* Error Confirmation Modal */}
      <Portal>
        <Modal
          visible={errorModalVisible}
          onDismiss={() => setErrorModalVisible(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.modalText, { color: theme.colors.onSurface }]}>
            {errorModalMessage}
          </Text>
          <Text style={[styles.modalText, { color: theme.colors.onSurface, marginVertical: 8 }]}>
            Do you want to remove the reference link?
          </Text>
          <View style={styles.modalActions}>
            <Button mode="contained" onPress={handleRemoveReference} style={styles.modalButton}>
              Remove Reference
            </Button>
            <Button mode="outlined" onPress={() => setErrorModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 8,
    paddingBottom: 16,
    marginBottom: 50,
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
  syncButton: {
    marginTop: 8,
  },
  modalContent: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  modalButton: {
    marginHorizontal: 10,
  },
})
