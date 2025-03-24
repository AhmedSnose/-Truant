import { Stack } from 'expo-router';
import { useTheme } from "react-native-paper";

export default function Layout() {
    const theme = useTheme();
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: "Days" }} />
            <Stack.Screen name="edit/index" options={{
                title: "Edit Days"
            }} />
            <Stack.Screen name="[id]/index" options={{
                title: "Day ..."
            }} />
        </Stack>
    )
}