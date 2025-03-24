"use client"
import type { TruantWithRelations } from "@/db/schema"
import { MaterialIcons } from "@expo/vector-icons"
import { Linking, StyleSheet, View } from "react-native"
import { Card, Chip, Text, TouchableRipple, useTheme } from "react-native-paper"

interface TruantCardProps {
  truant: TruantWithRelations
  onDelete: () => void
  onUpdate: () => void
  onShow: () => void
}



export default function TruantCard({ truant, onDelete, onUpdate, onShow }: TruantCardProps) {
  console.log(truant.status, 'truant');
  const theme = useTheme()

  return (
    <Card style={styles.card}>
      <TouchableRipple onPress={onShow} style={styles.ripple}>
        <View>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>
              {truant.title}
            </Text>
            {truant.link && (
              <TouchableRipple onPress={() => Linking.openURL(truant.link ?? "")} style={styles.link}>
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  {truant.link}
                </Text>
              </TouchableRipple>
            )}
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              {truant.description}
            </Text>
            <View style={styles.chipContainer}>
              <Chip icon="folder" style={styles.chip}>
                {truant?.category?.title || ''}
              </Chip>
              <Chip icon="flag" style={styles.chip}>
                {truant?.priority?.value || ''}
              </Chip>
              <Chip icon="clock" style={styles.chip}>
                {truant?.status?.value || ''}
              </Chip>
            </View>
          </Card.Content>
          <Card.Actions>
            <TouchableRipple onPress={onDelete} style={styles.actionButton}>
              <MaterialIcons name="delete" size={24} color={theme.colors.error} />
            </TouchableRipple>
            <TouchableRipple onPress={onUpdate} style={styles.actionButton}>
              <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
            </TouchableRipple>
          </Card.Actions>
        </View>
      </TouchableRipple>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden", // This ensures the ripple effect doesn't overflow the card
  },
  ripple: {
    flex: 1, // This ensures the ripple covers the entire card
  },
  title: {
    fontWeight: "bold",
  },
  description: {
    marginTop: 8,
  },
  link: {
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
  },
})

