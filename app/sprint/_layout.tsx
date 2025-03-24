import { Stack } from "expo-router"

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Sprints" }} />
      <Stack.Screen name="edit/index" options={{ title: "Edit Sprint" }} />
      <Stack.Screen name="show/index" options={{ title: "Sprint Details" }} />
    </Stack>
  )
}

