import { StyleSheet } from "react-native"
import { HelperText } from "react-native-paper"
import { Dropdown } from "react-native-element-dropdown"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery } from "@tanstack/react-query"
import * as schema from "@/db/schema"

type PriorityDropdownProps = {
  value: number | null
  onChange: (value: number | null) => void
  error?: string
}

export default function PriorityDropdown({ value, onChange, error }: PriorityDropdownProps) {
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)

  const { data: priorities = [] } = useQuery({
    queryKey: ["priorities"],
    queryFn: async () => {
      return db.select().from(schema.priorities)
    },
  })

  return (
    <>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={priorities.map((priority) => ({ label: priority.value, value: priority.id.toString() }))}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder="Select priority"
        searchPlaceholder="Search..."
        value={value?.toString()}
        onChange={(item) => {
          onChange(item.value ? Number.parseInt(item.value) : null)
        }}
      />
      {error && <HelperText type="error">{error}</HelperText>}
    </>
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
})

