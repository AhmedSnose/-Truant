"use client"

import React from "react"
import { View, StyleSheet } from "react-native"
import { Dropdown } from "react-native-element-dropdown"
import { Text } from "react-native-paper"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery } from "@tanstack/react-query"
import * as schema from "@/db/schema"
import type { Truant } from "@/db/schema"

interface TruantDropdownProps {
  value: Truant | null
  onChange?: (value: schema.Truant) => void
  error?: string
}

export default function TruantDropdown({ value, onChange, error }: TruantDropdownProps) {
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb, { schema })

  const { data: truants = [] } = useQuery({
    queryKey: ["truants"],
    queryFn: async () => {
      const result = await db.query.truants.findMany({
        with: {
          category: true,
          priority: true,
          status: true,
        },
        columns: {
          categoryId: false,
          priorityId: false,
          statusId: false,
        }
      })
      return result.map((truant) => ({ label: truant.title, value: truant.title, id: truant.id }))
    },
  })

  return (
    <View>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={truants}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder="Select truant"
        searchPlaceholder="Search..."
        value={value?.title || ''}
        onChange={(item) => {
          if (onChange)
            onChange(item)
        }}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  icon: {
    marginRight: 5,
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
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
})
