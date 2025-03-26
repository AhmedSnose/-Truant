import { addDay, updateDay } from "@/actions/notion"
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
} from "react-native-paper"
import { DatePickerModal } from "react-native-paper-dates"

type FormData = {
  title: string
  date: string
  totalTime: number
  report?: string
  status: Status
}

const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
}

export default function DayEditPage() {
  const theme = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const queryClient = useQueryClient()

  const { dayData }: any = route.params

  // Default date is today's date if not provided
  const defaultDate = new Date().toISOString().split("T")[0]

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: dayData || {
      title: "",
      date: defaultDate, // automatically use today's date
      totalTime: 0,
      report: "",
      status: null as any,
    },
  })

  const [datePickerVisible, setDatePickerVisible] = React.useState(false)
  const [useTodayDate, setUseTodayDate] = React.useState<boolean>(
    // If dayData has a date, default to false. If no dayData, default to true.
    dayData?.date ? false : true
  )

  // If user toggles "Use Today’s Date," set the date in the form to today
  React.useEffect(() => {
    if (useTodayDate) {
      setValue("date", defaultDate)
    }
  }, [useTodayDate])

  const onSubmit = async (data: FormData) => {
    // If the user left the date blank for any reason, default to today
    if (!data.date) {
      data.date = defaultDate
    }

    try {
      if (dayData) {
        // Updating an existing day
        //@ts-ignore
        await updateDay(dayData.id, data)
      } else {
        // Creating a new day
        //@ts-ignore
        await addDay(data)
      }

      queryClient.invalidateQueries(["fetchAllDays"] as never)
      navigation.goBack()
    } catch (error) {
      console.error("Error saving day:", error)
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
        // "report" is optional → no "required" rule
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
      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
      >
        {dayData ? "Update Day" : "Add Day"}
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
})
