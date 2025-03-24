import { getDayById } from "@/actions/notion"
import EventList from "@/components/event/EventList"
import * as schema from "@/db/schema"
import { Day } from "@/types/general"
import { useRoute } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useNavigation } from "expo-router"
import React, { useLayoutEffect } from "react"
import { StyleSheet, View } from "react-native"
import { ActivityIndicator, Card, Text, useTheme } from "react-native-paper"

import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useSQLiteContext } from "expo-sqlite"

export default function DayShowPage() {
    const route = useRoute();

    const { id }: any = route.params;
    const theme = useTheme();
    const navigation = useNavigation();
    const expoDb = useSQLiteContext()
    const db = drizzle(expoDb, { schema })

    const {
        data: day,
        isLoading,
        error,
        refetch,
    } = useQuery<Day>({
        queryKey: ["fetchDay", id],
        queryFn: async () => {
            const day = await getDayById(id);
            const status = db.select().from(schema.statuses).where(eq(schema.statuses.id, Number(day?.statusId))).get()
            day.status = status;
            return day;
        },
    })

    console.log(day, 'day');
    

    useLayoutEffect(() => {
        if (day) {
            navigation.setOptions({
                title: `Day ${day?.title ?? '...'}`
            })
        }
    }, [day])

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        )
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.error }}>Error: {(error as Error).message}</Text>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>
                        {day?.title}
                    </Text>
                    <Text variant="bodyMedium">Date: {day?.date}</Text>
                    <Text variant="bodyMedium">Goal Time: {day?.goalTime} hours</Text>
                    <Text variant="bodyMedium">Total Time: {day?.totalTime} hours</Text>
                    <Text variant="bodyMedium" style={styles.report}>
                        Report: {day?.report}
                    </Text>
                    <Text variant="bodyMedium" style={styles.report}>
                        Status: {day?.status?.value}
                    </Text>
                </Card.Content>
            </Card>

            {day?.events?.length ? <>

                <Text variant="titleMedium" style={styles.eventsTitle}>
                    Events
                </Text>
                <EventList events={day?.events} />
            </> : <></>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    title: {
        marginBottom: 8,
    },
    report: {
        marginTop: 8,
    },
    eventsTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
})

