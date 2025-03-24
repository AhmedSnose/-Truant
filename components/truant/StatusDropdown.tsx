import { StyleSheet } from "react-native"
import { HelperText } from "react-native-paper"
import { Dropdown } from "react-native-element-dropdown"
import { useSQLiteContext } from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useQuery } from "@tanstack/react-query"
import * as schema from "@/db/schema"

type StatusDropdownProps = {
  // value: schema.Status | number
  value: any
  onChange?: (value: schema.Status) => void
  error?: string
  mood: 'asLookup' | 'default'
}

export default function StatusDropdown({ value, onChange, error, mood }: StatusDropdownProps) {
  const expoDb = useSQLiteContext()
  const db = drizzle(expoDb)

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => {
      return db.select().from(schema.statuses)
    },
  })

  console.log(value, 'value');


  return (
    <>

      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={statuses.map((status) => ({ label: status.value, value: status.id.toString(), id: status.id }))}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder="Select status"
        searchPlaceholder="Search..."
        value={mood == 'default' ? value?.toString() : String(value?.id)}
        onChange={(item) => {
          if (onChange) {
            onChange(mood == 'default' ? Number.parseInt(item.value) : item)
          }
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

