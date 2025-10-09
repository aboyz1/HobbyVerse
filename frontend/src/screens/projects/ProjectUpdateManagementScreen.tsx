import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  Searchbar,
  Card,
  Avatar,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  Menu,
  Modal,
  Portal,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, colors } from "../../constants/theme";
import { ProjectUpdateManagementScreenProps } from "../../types/navigation";
import ProjectService from "../../services/ProjectService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const ProjectUpdateManagementScreen: React.FC<
  ProjectUpdateManagementScreenProps
> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { accessToken } = useAuth();

  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    content: "",
    progress_percentage: "",
    hours_logged: "",
  });
  const [addingUpdate, setAddingUpdate] = useState(false);

  // Initialize service with auth token
  useEffect(() => {
    ProjectService.setAuthToken(accessToken);
    fetchProjectUpdates();
    fetchProjectDetails();
  }, [projectId, accessToken]);

  const fetchProjectDetails = async () => {
    try {
      const response = await ProjectService.getProjectById(projectId);
      if (response.success) {
        setProject(response.data);
      }
    } catch (err: any) {
      console.log("Error fetching project details:", err);
    }
  };

  const fetchProjectUpdates = async () => {
    try {
      setLoading(true);
      const response = await ProjectService.getProjectById(projectId);
      if (response.success && response.data) {
        setUpdates(response.data.updates || []);
      } else {
        setError(response.error || "Failed to load project updates");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project updates");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjectUpdates();
    setRefreshing(false);
  };

  const openMenu = (updateId: string) => {
    setMenuVisible((prev) => ({ ...prev, [updateId]: true }));
  };

  const closeMenu = (updateId: string) => {
    setMenuVisible((prev) => ({ ...prev, [updateId]: false }));
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.title.trim()) {
      Alert.alert("Error", "Please enter a title for the update");
      return;
    }

    if (!newUpdate.content.trim()) {
      Alert.alert("Error", "Please enter content for the update");
      return;
    }

    setAddingUpdate(true);
    try {
      const updateData: any = {
        title: newUpdate.title.trim(),
        content: newUpdate.content.trim(),
      };

      if (newUpdate.progress_percentage) {
        const progress = parseInt(newUpdate.progress_percentage);
        if (!isNaN(progress) && progress >= 0 && progress <= 100) {
          updateData.progress_percentage = progress;
        }
      }

      if (newUpdate.hours_logged) {
        const hours = parseInt(newUpdate.hours_logged);
        if (!isNaN(hours) && hours >= 0) {
          updateData.hours_logged = hours;
        }
      }

      const response = await ProjectService.addProjectUpdate(
        projectId,
        updateData
      );
      if (response.success) {
        // Add the new update to the list
        setUpdates((prev) => [response.data, ...prev]);
        setModalVisible(false);
        setNewUpdate({
          title: "",
          content: "",
          progress_percentage: "",
          hours_logged: "",
        });
        Alert.alert("Success", "Update added successfully");
      } else {
        Alert.alert("Error", response.error || "Failed to add update");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add update");
    } finally {
      setAddingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId: string, updateTitle: string) => {
    Alert.alert(
      "Delete Update",
      `Are you sure you want to delete "${updateTitle}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // In a real implementation, you would have a delete endpoint
            // For now, we'll just remove it from the local list
            setUpdates((prev) =>
              prev.filter((update) => update.id !== updateId)
            );
            Alert.alert("Success", "Update deleted successfully");
          },
        },
      ]
    );
    closeMenu(updateId);
  };

  const renderUpdateItem = ({ item }: { item: any }) => {
    // Filter by search query if needed
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return null;
    }

    return (
      <Card style={styles.updateCard}>
        <Card.Content>
          <View style={styles.updateHeader}>
            <View style={styles.updateInfo}>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.title}
              </Text>
              <Text variant="bodySmall" style={styles.updateMeta}>
                by {item.user_name || "Unknown User"} •{" "}
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Menu
              visible={menuVisible[item.id] || false}
              onDismiss={() => closeMenu(item.id)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => openMenu(item.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => handleDeleteUpdate(item.id, item.title)}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>

          <Text variant="bodyMedium" style={styles.updateContent}>
            {item.content}
          </Text>

          {(item.progress_percentage || item.hours_logged) && (
            <View style={styles.updateStats}>
              {item.progress_percentage !== undefined && (
                <View style={styles.statItem}>
                  <MaterialIcons
                    name="trending-up"
                    size={16}
                    color={colors.primary}
                  />
                  <Text variant="bodySmall" style={styles.statText}>
                    {item.progress_percentage}% complete
                  </Text>
                </View>
              )}
              {item.hours_logged !== undefined && (
                <View style={styles.statItem}>
                  <MaterialIcons
                    name="access-time"
                    size={16}
                    color={colors.primary}
                  />
                  <Text variant="bodySmall" style={styles.statText}>
                    {item.hours_logged} hours
                  </Text>
                </View>
              )}
            </View>
          )}

          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              <Text variant="bodySmall" style={styles.attachmentsLabel}>
                Attachments ({item.attachments.length}):
              </Text>
              {item.attachments.map((attachment: string, index: number) => (
                <Chip key={index} compact style={styles.attachmentChip}>
                  {attachment.split("/").pop()}
                </Chip>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating size="small" color={colors.primary} />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading updates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {project?.title || "Project Updates"}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Manage progress updates for your project
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={() => setModalVisible(true)}
          icon="plus"
          style={styles.addButton}
        >
          Add Update
        </Button>
      </View>

      <Divider />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search updates..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Updates List */}
      {updates.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="update"
            size={64}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No updates yet</Text>
          <Text style={styles.emptySubtext}>
            Add updates to track your project progress
          </Text>
          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            icon="plus"
            style={styles.addUpdateButton}
          >
            Add First Update
          </Button>
        </View>
      ) : (
        <FlatList
          data={updates}
          renderItem={renderUpdateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={renderFooter}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text variant="titleMedium" style={styles.listHeaderText}>
                {updates.length} Update{updates.length === 1 ? "" : "s"}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Update Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Add Project Update
            </Text>
            <TextInput
              label="Title"
              value={newUpdate.title}
              onChangeText={(text) =>
                setNewUpdate((prev) => ({ ...prev, title: text }))
              }
              style={styles.input}
              mode="outlined"
              maxLength={200}
            />
            <TextInput
              label="Content"
              value={newUpdate.content}
              onChangeText={(text) =>
                setNewUpdate((prev) => ({ ...prev, content: text }))
              }
              style={[styles.input, styles.textArea]}
              mode="outlined"
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
            <View style={styles.rowInputs}>
              <TextInput
                label="Progress %"
                value={newUpdate.progress_percentage}
                onChangeText={(text) =>
                  setNewUpdate((prev) => ({
                    ...prev,
                    progress_percentage: text,
                  }))
                }
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Hours Logged"
                value={newUpdate.hours_logged}
                onChangeText={(text) =>
                  setNewUpdate((prev) => ({ ...prev, hours_logged: text }))
                }
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalActions}>
              <Button
                onPress={() => setModalVisible(false)}
                mode="outlined"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleAddUpdate}
                mode="contained"
                loading={addingUpdate}
                disabled={addingUpdate}
                style={styles.modalButton}
              >
                {addingUpdate ? "Adding..." : "Add Update"}
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body1,
    color: colors.onSurfaceVariant,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  addButton: {
    borderRadius: 8,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  searchBar: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  listHeader: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  listHeaderText: {
    ...typography.h6,
    color: colors.onBackground,
  },
  updateCard: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  updateInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  updateMeta: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  updateContent: {
    marginBottom: spacing.md,
    color: colors.onSurface,
    lineHeight: 20,
  },
  updateStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  statText: {
    ...typography.body2,
    marginLeft: spacing.xs,
    color: colors.primary,
  },
  attachmentsContainer: {
    marginBottom: spacing.sm,
  },
  attachmentsLabel: {
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  attachmentChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: "center",
  },
  emptyText: {
    ...typography.h4,
    marginTop: spacing.md,
    textAlign: "center",
    color: colors.onBackground,
  },
  emptySubtext: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginVertical: spacing.md,
    maxWidth: 300,
  },
  addUpdateButton: {
    marginTop: spacing.md,
    borderRadius: 8,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
  },
  modalTitle: {
    ...typography.h5,
    color: colors.onBackground,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  input: {
    marginBottom: spacing.md,
  },
  textArea: {
    height: 100,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 0.48,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
  },
  modalButton: {
    marginLeft: spacing.md,
  },
});

export default ProjectUpdateManagementScreen;
