import MainContainer from "@/components/shared/MainContainer"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"
import { useEffect } from "react"
import { Dimensions, ScrollView, StyleSheet, View } from "react-native"
import { Card, Text, useTheme } from "react-native-paper"

// Configure the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
const cards = [
  { id: 1, title: "Sprint", icon: "run", navigateTo: "sprint" },
  { id: 2, title: "Days", icon: "calendar-today", navigateTo: "day" },
  { id: 3, title: "Event", icon: "calendar-event", navigateTo: "event" },
  { id: 5, title: "Truant", icon: "bookshelf", navigateTo: "truant" },
  { id: 6, title: "Categories", icon: "tag-multiple", navigateTo: "truant/categories" },
  { id: 7, title: "Priorities", icon: "flag", navigateTo: "truant/priorities" },
  { id: 8, title: "Statuses", icon: "list-status", navigateTo: "truant/statuses" },
]

export default function ToolsScreen() {
  const theme = useTheme()
  const router = useRouter()
  const windowWidth = Dimensions.get("window").width
  const cardWidth = windowWidth < 600 ? windowWidth / 2 - 24 : windowWidth / 3 - 32


  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission for notifications was denied!");
      }
    }
    requestPermissions();
  }, []);

  function scheduleNotificationHandler() {
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Look at that notification",
        body: "I'm so proud of myself!",
      },
      // @ts-ignore
      trigger: { seconds: 5 }, // Triggers after 5 seconds
    });
  }


  return (
    <MainContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* <Text style={[styles.header, { color: theme.colors.primary }]}>Tools</Text> */}
        <View style={styles.container}>
          {cards.map((card) => (
            <Card
              key={card.id}
              style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface }]}
              onPress={() => router.push(card.navigateTo as any)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                  <MaterialCommunityIcons name={card.icon as any} size={32} color={theme.colors.onPrimary} />
                </View>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>{card.title}</Text>
              </Card.Content>
            </Card>
          ))}

          <Card
            key={2222}
            style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface }]}
            onPress={scheduleNotificationHandler}
          >
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name={'bell'} size={32} color={theme.colors.onPrimary} />
              </View>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>{'Schedule Notification'}</Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </MainContainer>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    marginVertical: 20
  },
  scrollViewContent: {
    padding: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 20,
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 4,
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
})

