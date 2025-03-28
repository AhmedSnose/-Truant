"use client"
import * as schema from "@/db/schema";
import { addDay, updateDay } from "@/actions/notion/days"
import StatusDropdown from "@/components/truant/StatusDropdown"
import { Status } from "@/db/schema"
import { useRoute } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigation } from "expo-router"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { StyleSheet, View, Platform } from "react-native"
import {
  Button,
  HelperText,
  TextInput,
  Text,
  Switch,
  useTheme,
  Snackbar,
  Modal,
  Portal,
} from "react-native-paper"
import { DatePickerModal } from "react-native-paper-dates"

// Local DB day service functions
import { post as createDayLocal, update as updateDayLocal, show as showDayLocal } from "@/services/DayService"

type FormData = {
  title: string
  date: string
  totalTime: number
  report?: string
  status: Status
  // Notion page reference id (as string). If empty, treated as null.
  referenceId?: string
}

const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
}

export default function DayEditPage() {
  const theme = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const queryClient = useQueryClient()

  // Retrieve dayData from navigation parameters
  const { dayData } = route.params as { dayData?: schema.Day }

  // Default date is today's date if not provided
  const defaultDate = new Date().toISOString().split("T")[0]

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      title: dayData?.title,
      date: dayData?.date || defaultDate,
      totalTime: dayData?.totalTime || 0,
      report: dayData?.report || '',
      status: null,
      referenceId: dayData?.referenceId || '',
    },
  })

  const [datePickerVisible, setDatePickerVisible] = React.useState(false)
  const [useTodayDate, setUseTodayDate] = React.useState<boolean>(
    dayData?.date ? false : true
  )

  // Snackbar for toaster messages
  const [snackbarVisible, setSnackbarVisible] = React.useState(false)
  const [snackbarMsg, setSnackbarMsg] = React.useState("")

  // Error confirmation modal state (for reference removal)
  const [errorModalVisible, setErrorModalVisible] = React.useState(false)
  const [errorModalMessage, setErrorModalMessage] = React.useState("")

  // If user toggles "Use Today's Date," update the date value
  React.useEffect(() => {
    if (useTodayDate) {
      setValue("date", defaultDate)
    }
  }, [useTodayDate])

  const onSubmit = async (data: FormData) => {
    // If date is somehow blank, default to today
    if (!data.date) {
      data.date = defaultDate
    }
    try {
      // Prepare referenceId: if empty string then treat as null
      const referenceIdValue =
        data.referenceId && data.referenceId.trim() !== ""
          ? data.referenceId.trim()
          : null

      if (dayData) {
        // Update the local day and mark as unsynced (isSynced: 0)
        await updateDayLocal(dayData.id, { ...data, isSynced: 0, referenceId: referenceIdValue })
      } else {
        // Create new local day (new records unsynced by default)
        await createDayLocal({ ...data, isSynced: 0, referenceId: referenceIdValue })
      }
      queryClient.invalidateQueries(["fetchAllDays"] as never)
      navigation.goBack()
    } catch (error) {
      console.error("Error saving day:", error)
      setSnackbarMsg("Error saving day")
      setSnackbarVisible(true)
    }
  }

  // Sync function for day edit page – only applicable when editing an existing day
  const handleSync = async () => {
    if (!dayData) return
    try {
      // Retrieve the latest local day data
      const localDay = await showDayLocal(dayData.id)
      let updatedReferenceId = localDay.referenceId

      const payload = {
        title: localDay.title,
        totalTime: localDay.totalTime ? localDay.totalTime.toString() : "0",
        goalTime: localDay.goalTime ? localDay.goalTime.toString() : "0",
        date: localDay.date,
        report: localDay.report || "",
        status: localDay.status, // Adjust if you need to send more info about status
      }

      if (localDay.referenceId) {
        // Update existing Notion page using your Notion API update function
        console.log(localDay,'localDay');
        
        await updateDay(localDay.referenceId, payload)
      } else {
        // Create a new Notion page and get the new reference ID
        const result = await addDay(payload)
        updatedReferenceId = result?.id
      }

      // Update the local record: mark it as synced and store the Notion reference ID
      await updateDayLocal(dayData.id, { ...localDay, isSynced: 1, referenceId: updatedReferenceId })
      queryClient.invalidateQueries(["fetchAllDays"] as never)
      setSnackbarMsg("Day synced successfully")
      setSnackbarVisible(true)
      navigation.goBack()
    } catch (error: any) {
      console.error("Error syncing day:", error)
      if (error.code === "validation_error" && dayData.referenceId) {
        // For example, if the page is archived
        setErrorModalMessage(error.message || "Validation error occurred.")
        setErrorModalVisible(true)
      } else {
        setSnackbarMsg(error.message || "Sync failed")
        setSnackbarVisible(true)
      }
    }
  }

  // Called when the user confirms removal of the Notion reference link in the error modal
  const handleRemoveReference = async () => {
    if (!dayData) return
    try {
      await updateDayLocal(dayData.id, { ...dayData, isSynced: 0, referenceId: null })
      queryClient.invalidateQueries(["fetchAllDays"] as never)
      setSnackbarMsg("Reference removed. Please try syncing again.")
      setSnackbarVisible(true)
      navigation.goBack()
    } catch (error) {
      console.error("Error removing reference:", error)
      setSnackbarMsg("Error removing reference")
      setSnackbarVisible(true)
    } finally {
      setErrorModalVisible(false)
    }
  }

  // Watch current date to display in the UI button
  const selectedDate = watch("date")

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
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.title}>
              {errors.title?.message}
            </HelperText>
          </>
        )}
        name="title"
      />

      {/* DATE */}
      <View style={styles.dateRow}>
        <Text variant="labelLarge" style={styles.dateLabel}>
          Date
        </Text>
        <Switch
          value={useTodayDate}
          onValueChange={(val) => setUseTodayDate(val)}
          style={styles.switch}
        />
        <Text style={styles.switchText}>Use Today's Date</Text>
      </View>

      {!useTodayDate && (
        <>
          <Button
            mode="outlined"
            onPress={() => setDatePickerVisible(true)}
            style={styles.dateButton}
          >
            {selectedDate ? `Picked: ${selectedDate}` : "Pick a Date"}
          </Button>
          <HelperText type="error" visible={!!errors.date}>
            {errors.date?.message}
          </HelperText>

          <DatePickerModal
            locale="en"
            mode="single"
            visible={datePickerVisible}
            onDismiss={() => setDatePickerVisible(false)}
            date={selectedDate ? new Date(selectedDate) : new Date()}
            onConfirm={({ date }) => {
              setDatePickerVisible(false)
              if (date) {
                setValue("date", date.toISOString().split("T")[0])
              }
            }}
          />
        </>
      )}

      {/* TOTAL TIME */}
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
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.totalTime}>
              {errors.totalTime?.message}
            </HelperText>
          </>
        )}
        name="totalTime"
      />

      {/* REPORT (Optional) */}
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Report (Optional)"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={4}
              error={!!errors.report}
              style={[styles.input, styles.textArea]}
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.report}>
              {errors.report?.message}
            </HelperText>
          </>
        )}
        name="report"
      />

      {/* STATUS */}
      <Controller
        control={control}
        rules={{ required: { value: true, message: ERROR_MESSAGES.REQUIRED } }}
        render={({ field: { onChange, value } }) => (
          <View>
            <StatusDropdown
              mood="asLookup"
              value={value}
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

      {/* SUBMIT BUTTON */}
      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.submitButton}>
        {dayData ? "Update Day" : "Add Day"}
      </Button>

      {/* Sync button visible only in edit mode */}
      {dayData && (
        <Button mode="outlined" onPress={handleSync} style={styles.syncButton}>
          Sync With Notion
        </Button>
      )}

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
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    height: Platform.OS === "ios" ? 100 : 120,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateLabel: {
    marginRight: 8,
  },
  switch: {
    marginHorizontal: 8,
  },
  switchText: {
    fontSize: 14,
  },
  dateButton: {
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  submitButton: {
    marginTop: 16,
  },
  syncButton: {
    marginTop: 16,
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
});
