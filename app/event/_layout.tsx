import { Stack } from "expo-router"
import { useTheme } from "react-native-paper"

export default function EventLayout() {
  const theme = useTheme()
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Events" }} />
      <Stack.Screen
        name="edit/index"
        options={{
          title: "Edit Event",
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: "Event Details",
        }}
      />
   
    </Stack>
  )
}

