import { QueryClient } from "@tanstack/react-query"
import { Stack } from "expo-router"

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Truants" }} />
      <Stack.Screen name="edit/index" options={{ title: "Edit Truant" }} />

      <Stack.Screen name="categories/index" options={{ title: "Categories" }} />
      <Stack.Screen name="categories/[id]" options={{ title: "Edit Category" }} />

      <Stack.Screen name="priorities/index" options={{ title: "Priorities" }} />
      <Stack.Screen name="priorities/[id]" options={{ title: "Edit Priority" }} />
    </Stack>
  )
}

