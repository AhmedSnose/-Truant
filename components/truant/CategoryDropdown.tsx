"use client"
import { View, StyleSheet } from "react-native"
import { Dropdown } from "react-native-element-dropdown"
import { Text } from "react-native-paper"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery } from "@tanstack/react-query"
import * as schema from "@/db/schema"

interface CategoryDropdownProps {
  value: number | null
  onChange: (value: number | null) => void
  error?: string
}

export default function CategoryDropdown({ value, onChange, error }: CategoryDropdownProps) {
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await db.select().from(schema.categories)
      return result.map((cat) => ({ label: cat.title, value: cat.id }))
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
        data={categories}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder="Select category"
        searchPlaceholder="Search..."
        value={value}
        onChange={(item) => {
          onChange(item.value)
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

