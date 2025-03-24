import { DarkTheme, DefaultTheme as oldTheme, ThemeProvider } from "@react-navigation/native"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { Suspense, useEffect, useState } from "react"
import "react-native-reanimated"
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { lightTheme } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useDrizzleStudio } from "expo-drizzle-studio-plugin"
import { openDatabaseSync, SQLiteProvider } from "expo-sqlite"
import { ActivityIndicator, MD3DarkTheme, PaperProvider, Text } from "react-native-paper"
import { drizzle } from "drizzle-orm/expo-sqlite"
import migrations from '@/drizzle/migrations';
import { View } from "react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const DATABASE_NAME = 'db';
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
SplashScreen.preventAutoHideAsync()
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "tomato",
    secondary: "yellow",
  },
}

function RootLayout() {
  const [theme, setTheme] = useState(lightTheme)
  const [loaded, setLoaded] = useState(false)
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  })

  useEffect(() => {
    const loadColorScheme = async () => {
      const colorScheme = await useColorScheme()
      setTheme(colorScheme === "dark" ? darkTheme : lightTheme)
    }
    loadColorScheme()
  }, [])

  useEffect(() => {
    if (fontsLoaded && theme) {
      SplashScreen.hideAsync()
      setLoaded(true)
    }
  }, [fontsLoaded, theme])

  if (!loaded) {
    return null
  }

  return (
    <PaperProvider theme={theme}>
      <ThemeProvider value={theme === darkTheme ? DarkTheme : oldTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  )
}

export default () => {
  useDrizzleStudio(expoDb)
  const { success, error } = useMigrations(drizzle(expoDb), migrations);
  const queryClient = new QueryClient();

  if (error) {
    return (
      <View>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View>
        <Text>Migration is in progress...</Text>
      </View>
    );
  }
  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider databaseName={DATABASE_NAME} options={{ enableChangeListener: true }} useSuspense>
        <QueryClientProvider client={queryClient}>
          <RootLayout />
        </QueryClientProvider>
      </SQLiteProvider>
    </Suspense>
  )
}