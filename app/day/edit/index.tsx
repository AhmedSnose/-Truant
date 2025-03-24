import { addDay, updateDay } from "@/actions/notion"
import StatusDropdown from "@/components/truant/StatusDropdown"
import { Status } from "@/db/schema"
import { useRoute } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigation } from "expo-router"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { StyleSheet, View } from "react-native"
import { Button, HelperText, TextInput, useTheme } from "react-native-paper"
import { DatePickerModal } from "react-native-paper-dates"

type FormData = {
  title: string
  date: string
  totalTime: number
  goalTime: number
  report: string
  status: Status
}
const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
}

export default function DayEditPage() {
  const navigation = useNavigation()

  const theme = useTheme()
  const route = useRoute();
  const queryClient = useQueryClient();
  const { dayData }: any = route.params;


  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    defaultValues: dayData || {
      title: "",
      date: "",
      totalTime: 0,
      goalTime: 0,
      report: "",
      status: null,
    },
  })

  const [datePickerVisible, setDatePickerVisible] = React.useState(false)

  const onSubmit = async (data: FormData) => {
    console.log(data, 'data');
    
    if (dayData) {
      // @ts-ignore
      await updateDay(dayData.id, data)
    } else {
      // @ts-ignore
      await addDay(data)
    }
    queryClient.invalidateQueries(["fetchAllDays"] as never);
    navigation.goBack()
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
        rules={{ required: "Date is required" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Date"
              value={value}
              onFocus={() => setDatePickerVisible(true)}
              error={!!errors.date}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.date}>
              {errors.date?.message}
            </HelperText>
            <DatePickerModal
              locale="en"
              mode="single"
              visible={datePickerVisible}
              onDismiss={() => setDatePickerVisible(false)}
              date={value ? new Date(value) : undefined}
              onConfirm={({ date }) => {
                setDatePickerVisible(false)
                onChange(date?.toISOString().split("T")[0])
              }}
            />
          </>
        )}
        name="date"
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
        rules={{ required: "Report is required" }}
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

      <Controller
        control={control}
        rules={{ required: { value: true, message: ERROR_MESSAGES.REQUIRED } }}
        render={({ field: { onChange, value } }) => (
          <View>
            <StatusDropdown mood="asLookup" value={value} onChange={onChange} error={errors.status?.message} />
            <HelperText type="error" visible={!!errors.status}>
              {errors.status?.message}
            </HelperText>
          </View>
        )}
        name="status"
      />

      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.submitButton}>
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
    marginBottom: 8,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    marginTop: 16,
  },
})

