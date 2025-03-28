import * as schema from "@/db/schema";
import BottomSheet from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ActivityIndicator,
  Button,
  FAB,
  Modal,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";

import SprintCard from "@/components/sprints/SprintCard";

// Local DB sprint service functions
import * as DayService from "@/services/DayService";
import * as localSprintService from "@/services/SprintService";

// Notion actions
import { removeSprint } from "@/actions/notion/sprints";

export default function SprintsPage() {
  const theme = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<schema.Sprint | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  // Fetch local sprints only
  const {
    data: localSprints,
    isLoading: fetchLocalLoading,
    error: fetchLocalError,
    refetch: refetchLocalSprints,
  } = useQuery<schema.Sprint[]>({
    queryKey: ["localSprints"],
    queryFn: async () => localSprintService.index(),
  });

  // Fetch days (used by DaySelector)
  const {
    data: days,
    isLoading: fetchDaysLoading,
    error: fetchDaysError,
  } = useQuery<schema.Day[]>({
    queryKey: ["fetchAllDays"],
    queryFn: () => DayService.index(),
  });

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Bottom sheet index:", index);
  }, []);

  const confirmDelete = (sprint: schema.Sprint) => {
    setSelectedSprint(sprint);
    setDeleteModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      // Since we're dealing only with local data, remove from local DB.
      await localSprintService.remove(id);

      refetchLocalSprints();
      setDeleteModalVisible(false);
      setSnackbarMsg("Sprint deleted successfully");
      setSnackbarVisible(true);
    } catch (error) {
      console.error("Delete error:", error);
      setSnackbarMsg("Delete failed");
      setSnackbarVisible(true);
    }
  };

  const handleDeleteViaAPI = async (sprint: schema.Sprint) => {
    try {
      await removeSprint(sprint.referenceId ?? '');
      await localSprintService.update(sprint.id,{
        ...sprint,
        isSynced:0,
        referenceId:null
      })

      refetchLocalSprints();
      setDeleteModalVisible(false);
      setSnackbarMsg("Sprint deleted successfully");
      setSnackbarVisible(true);
    } catch (error) {
      console.error("Delete error:", error);
      setSnackbarMsg("Delete failed");
      setSnackbarVisible(true);
    }


  }

  const handleUpdate = async (id: number) => {
    const sprint = await localSprintService.show(id);
    if (sprint) {
      //@ts-ignore
      navigation.navigate("edit/index", { sprintData: sprint });
      console.log(sprint, "sprint");
    }
  };

  const handleLinkSprintWithDays = async (id: number) => {
    const sprint = await localSprintService.show(id);
    if (sprint) {
      setSelectedSprint(sprint);
      bottomSheetRef.current?.expand(); // open the sheet
    }
  };

  const handleShow = (id: number) => {
    //@ts-ignore
    navigation.navigate("sprint", { screen: "show/index", params: { id } });
  };

  const handleAddSprint = () => {
    //@ts-ignore
    navigation.navigate("edit/index", { sprintData: null });
  };

  const [state, setState] = React.useState({ open: false });
  const onStateChange = ({ open }: { open: boolean }) => setState({ open });
  const { open } = state;

  const syncAPIWithLocalDb = async () => {
    try {
      setSyncLoading(true);
      await localSprintService.syncSprintsAPIWithLocalDb();
      // Invalidate the localSprints query so that the list refreshes
      //@ts-ignore
      await queryClient.invalidateQueries(["localSprints"]);
      setSnackbarMsg("Sync completed successfully");
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error("Error syncing API with local DB:", error);
      setSnackbarMsg("Sync failed: " + error.message);
      setSnackbarVisible(true);
    } finally {
      setSyncLoading(false);
    }
  };

  if (fetchDaysLoading || fetchLocalLoading || syncLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading sprints...
        </Text>
      </View>
    );
  }

  if (fetchDaysError || fetchLocalError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {String(fetchDaysError || fetchLocalError)}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* List of local sprints */}
      {localSprints && (
        <FlatList
          data={localSprints}
          renderItem={({ item }) => (
            <SprintCard
              sprint={item}
              onDelete={() => confirmDelete(item)}
              onUpdate={() => handleUpdate(item.id)}
              onLink={() => handleLinkSprintWithDays(item.id)}
              onShow={() => handleShow(item.id)}
              // Convert isSynced from number to boolean
              syncStatus={Boolean(item.isSynced)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Floating Action Buttons */}
      <FAB.Group
        onStateChange={onStateChange}
        open={open}
        visible
        icon={open ? "close" : "menu"}
        actions={[
          { icon: "plus", label: "Add Sprint", onPress: handleAddSprint },
          {
            icon: syncLoading ? "progress-clock" : "cloud-download",
            label: "Sync API With Local Database",
            onPress: syncAPIWithLocalDb,
          },
        ]}
      />

      {/* Bottom Sheet for linking days */}
      {/* <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <DaySelector
            refetchSprints={refetchLocalSprints}
            days={days || []}
            selectedSprint={selectedSprint}
            onClose={() => bottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet> */}

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalText, { color: theme.colors.onSurface }]}>
            Are you sure you want to delete this sprint?
          </Text>
          <View style={styles.modalActions}>
            <Button
              mode="contained"
              onPress={() => handleDelete(selectedSprint?.id!)}
              style={styles.modalButton}
            >
              Storage Deletion
            </Button>
            <Button
              mode="elevated"
              onPress={() => handleDeleteViaAPI(selectedSprint!)}
              style={styles.modalButton}
            >
              API Deletion
            </Button>
            {/* <Button
              mode="outlined"
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button> */}
          </View>
        </Modal>
      </Portal>

      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMsg}
      </Snackbar>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 80,
  },
  modalContent: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    marginHorizontal: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});
