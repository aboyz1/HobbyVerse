import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import {
  Text,
  Button,
  Card,
  Chip,
  Avatar,
  Divider,
  IconButton,
  ActivityIndicator,
  FAB,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import ProjectService from "../../services/ProjectService";
import { spacing, typography, colors } from "../../constants/theme";
import { ProjectDetailsScreenProps } from "../../types/navigation";
import { Project, ProjectUpdate, ProjectFile } from "../../types/project";
import { MaterialIcons } from "@expo/vector-icons";
import WebSocketService from "../../services/WebSocketService";

const ProjectDetailsScreen: React.FC<ProjectDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { projectId } = route.params;
  const theme = useTheme();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchProjectDetails();

    // Subscribe to project updates
    WebSocketService.subscribeToProject(projectId);

    // Listen for real-time like updates
    const handleProjectUpdate = (update: any) => {
      if (update.type === "LIKE_UPDATE" && update.projectId === projectId) {
        setLikeCount(update.likeCount);
        // Update the isLiked state if the current user liked/unliked
        if (update.likedBy === user?.id) {
          setIsLiked(update.liked);
        }
      }
    };

    WebSocketService.on("project_update", handleProjectUpdate);

    // Cleanup
    return () => {
      WebSocketService.unsubscribeFromProject(projectId);
      WebSocketService.off("project_update", handleProjectUpdate);
    };
  }, [projectId, user?.id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await ProjectService.getProjectById(projectId);

      if (response.success) {
        setProject(response.data);
        setIsLiked(response.data.is_liked || false);
        setLikeCount(response.data.like_count || 0);
      } else {
        setError(response.error || "Failed to load project details");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while fetching project details"
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjectDetails();
    setRefreshing(false);
  };

  const handleLikeProject = async () => {
    try {
      const response = await ProjectService.likeProject(projectId);

      if (response.success) {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      } else {
        Alert.alert("Error", response.error || "Failed to like project");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred while liking the project"
      );
    }
  };

  const handleAddUpdate = async () => {
    // For now, we'll show an alert with a simple input
    // In a real implementation, this would open a modal or navigate to a create update screen
    Alert.prompt(
      "Add Project Update",
      "Enter your project update:",
      async (text) => {
        if (text && text.trim()) {
          try {
            const response = await ProjectService.addProjectUpdate(projectId, {
              content: text.trim(),
            });

            if (response.success) {
              Alert.alert("Success", "Project update added successfully!");
              fetchProjectDetails(); // Refresh to show the new update
            } else {
              Alert.alert(
                "Error",
                response.error || "Failed to add project update"
              );
            }
          } catch (err: any) {
            Alert.alert(
              "Error",
              err.message || "An error occurred while adding the project update"
            );
          }
        }
      },
      "plain-text"
    );
  };

  const handleAddFile = async () => {
    // Navigate to the file manager screen
    navigation.navigate("ProjectFileManager", { projectId });
  };

  const handleManageUpdates = async () => {
    // Navigate to the update management screen
    navigation.navigate("ProjectUpdateManagement", { projectId });
  };

  const renderHeader = () => {
    if (!project) return null;

    return (
      <View style={styles.header}>
        {project.thumbnail_url ? (
          <Image
            source={{ uri: project.thumbnail_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <Avatar.Icon
            size={80}
            icon="folder"
            style={[
              styles.thumbnail,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        )}

        <Text
          variant="headlineSmall"
          style={[styles.projectTitle, { color: theme.colors.onBackground }]}
        >
          {project.title}
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.creatorInfo, { color: theme.colors.onSurfaceVariant }]}
        >
          by {project.creator?.display_name || "Unknown"} •{" "}
          {project.difficulty_level}
        </Text>

        <View style={styles.tagsContainer}>
          {project.tags?.map((tag, index) => (
            <Chip key={index} mode="outlined" style={styles.tagChip}>
              {tag}
            </Chip>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialIcons
              name="visibility"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginLeft: spacing.xs,
              }}
            >
              {project.view_count || 0} views
            </Text>
          </View>

          <TouchableOpacity onPress={handleLikeProject} style={styles.statItem}>
            <MaterialIcons
              name={isLiked ? "favorite" : "favorite-outline"}
              size={20}
              color={isLiked ? colors.like : theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginLeft: spacing.xs,
              }}
            >
              {likeCount} likes
            </Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <MaterialIcons
              name="chat"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginLeft: spacing.xs,
              }}
            >
              0 comments
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {project.is_collaborator && (
            <>
              <Button
                mode="outlined"
                onPress={handleManageUpdates}
                style={styles.actionButton}
              >
                Manage Updates
              </Button>
              <Button
                mode="outlined"
                onPress={handleAddFile}
                style={styles.actionButton}
              >
                Manage Files
              </Button>
            </>
          )}

          <Button
            mode="contained"
            onPress={() => {}}
            style={styles.actionButton}
          >
            Collaborate
          </Button>
        </View>
      </View>
    );
  };

  const renderDescription = () => {
    if (!project?.description) return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Description
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {project.description}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderFiles = () => {
    if (!project?.files || project.files.length === 0) return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text
              variant="titleMedium"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              Files ({project.files.length})
            </Text>
            {project.is_collaborator && (
              <IconButton icon="plus" size={20} onPress={handleAddFile} />
            )}
          </View>

          {project.files.map((file: ProjectFile) => (
            <TouchableOpacity key={file.id} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <MaterialIcons
                  name="insert-drive-file"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.fileText}>
                  <Text
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={{ color: theme.colors.onSurface }}
                  >
                    {file.filename}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {file.file_type} • {(file.file_size / 1024).toFixed(1)} KB
                  </Text>
                </View>
              </View>
              <IconButton icon="download" size={20} />
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderUpdates = () => {
    if (!project?.updates || project.updates.length === 0) return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text
              variant="titleMedium"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              Updates ({project.updates.length})
            </Text>
            {project.is_collaborator && (
              <IconButton icon="plus" size={20} onPress={handleAddUpdate} />
            )}
          </View>

          {project.updates.map((update: ProjectUpdate) => (
            <View key={update.id} style={styles.updateItem}>
              <View style={styles.updateHeader}>
                <Avatar.Text
                  size={32}
                  label={update.user?.display_name.charAt(0) || "U"}
                />
                <View style={styles.updateUserInfo}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface }}
                  >
                    {update.user?.display_name || "Unknown"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {new Date(update.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, marginTop: spacing.sm }}
              >
                {update.content}
              </Text>

              {update.progress_percentage !== undefined && (
                <View style={styles.progressContainer}>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Progress: {update.progress_percentage}%
                  </Text>
                </View>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderCollaborators = () => {
    if (
      !project?.collaborator_details ||
      project.collaborator_details.length === 0
    )
      return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Collaborators ({project.collaborator_details.length})
          </Text>

          <View style={styles.collaboratorsContainer}>
            {project.collaborator_details.map((collaborator) => (
              <View key={collaborator.id} style={styles.collaboratorItem}>
                <Avatar.Image
                  size={40}
                  source={{
                    uri:
                      collaborator.avatar_url ||
                      "https://via.placeholder.com/40",
                  }}
                />
                <Text
                  variant="bodySmall"
                  numberOfLines={1}
                  style={{
                    color: theme.colors.onSurface,
                    marginTop: spacing.xs,
                  }}
                >
                  {collaborator.display_name}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyLarge"
            style={{
              marginTop: spacing.md,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Loading project details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centered}>
          <IconButton
            icon="alert-circle"
            size={48}
            iconColor={theme.colors.error}
          />
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground, textAlign: "center" }}
          >
            Error Loading Project
          </Text>
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: spacing.sm,
            }}
          >
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={fetchProjectDetails}
            style={{ marginTop: spacing.lg }}
          >
            Try Again
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        <Divider style={styles.divider} />
        {renderDescription()}
        <Divider style={styles.divider} />
        {renderFiles()}
        <Divider style={styles.divider} />
        {renderUpdates()}
        <Divider style={styles.divider} />
        {renderCollaborators()}
        <View style={{ height: 80 }} />
      </ScrollView>

      {project?.is_collaborator && (
        <FAB
          icon="plus"
          label="Add Update"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddUpdate}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  header: {
    padding: spacing.lg,
    alignItems: "center",
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  projectTitle: {
    ...typography.h3,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  creatorInfo: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tagChip: {
    margin: 0,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  actionButton: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  updateItem: {
    paddingVertical: spacing.sm,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateUserInfo: {
    marginLeft: spacing.md,
  },
  progressContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  collaboratorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  collaboratorItem: {
    alignItems: "center",
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
  },
});

export default ProjectDetailsScreen;
