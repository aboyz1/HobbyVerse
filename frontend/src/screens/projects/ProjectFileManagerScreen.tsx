import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
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
import { ProjectFileManagerScreenProps } from "../../types/navigation";
import ProjectFileService from "../../services/ProjectFileService";
import ProjectService from "../../services/ProjectService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

const ProjectFileManagerScreen: React.FC<ProjectFileManagerScreenProps> = ({
  route,
  navigation,
}) => {
  const { projectId } = route.params;
  const { accessToken } = useAuth();

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [newFile, setNewFile] = useState({
    filename: "",
    description: "",
  });
  const [uploading, setUploading] = useState(false);

  // Initialize services with auth token
  useEffect(() => {
    ProjectFileService.setAuthToken(accessToken);
    ProjectService.setAuthToken(accessToken);
    fetchProjectFiles();
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

  const fetchProjectFiles = async () => {
    try {
      setLoading(true);
      const response = await ProjectFileService.getProjectFiles(projectId);
      if (response.success) {
        setFiles(response.data || []);
      } else {
        setError(response.error || "Failed to load project files");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project files");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjectFiles();
    setRefreshing(false);
  };

  const openMenu = (fileId: string) => {
    setMenuVisible((prev) => ({ ...prev, [fileId]: true }));
  };

  const closeMenu = (fileId: string) => {
    setMenuVisible((prev) => ({ ...prev, [fileId]: false }));
  };

  const handleDeleteFile = async (fileId: string, filename: string) => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${filename}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await ProjectFileService.deleteProjectFile(
                projectId,
                fileId
              );
              if (response.success) {
                setFiles((prev) => prev.filter((file) => file.id !== fileId));
                Alert.alert("Success", "File deleted successfully");
              } else {
                Alert.alert("Error", response.error || "Failed to delete file");
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete file");
            }
          },
        },
      ]
    );
    closeMenu(fileId);
  };

  const handleDownloadFile = (fileUrl: string, filename: string) => {
    // In a real implementation, you would download the file
    // For now, we'll just show an alert
    Alert.alert(
      "Download File",
      `In a real app, this would download "${filename}" to your device.`,
      [{ text: "OK" }]
    );
    closeMenu(filename);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setNewFile({
          filename: asset.name || asset.uri.split("/").pop() || "Untitled",
          description: "",
        });
        setModalVisible(true);
        // In a real implementation, you would upload the file to your server here
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to pick document");
    }
  };

  const handleUploadFile = async () => {
    if (!newFile.filename.trim()) {
      Alert.alert("Error", "Please enter a filename");
      return;
    }

    setUploading(true);
    try {
      // In a real implementation, you would upload the file to your server here
      // For now, we'll simulate a successful upload
      const mockFile = {
        id: Math.random().toString(),
        filename: newFile.filename,
        file_url: "https://example.com/file.pdf",
        file_type: "pdf",
        file_size: 1024000,
        description: newFile.description,
        uploaded_by: "current_user_id",
        uploaded_at: new Date().toISOString(),
      };

      // Add the file to the list
      setFiles((prev) => [mockFile, ...prev]);
      setModalVisible(false);
      setNewFile({ filename: "", description: "" });
      Alert.alert("Success", "File uploaded successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return "image";
    if (fileType.includes("pdf")) return "picture-as-pdf";
    if (fileType.includes("video")) return "video-file";
    if (fileType.includes("audio")) return "audiotrack";
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return "archive";
    if (fileType.includes("text") || fileType.includes("document"))
      return "description";
    return "insert-drive-file";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderFileItem = ({ item }: { item: any }) => (
    <Card style={styles.fileCard}>
      <Card.Content>
        <View style={styles.fileHeader}>
          <Avatar.Icon
            size={40}
            icon={getFileIcon(item.file_type)}
            style={styles.fileIcon}
          />
          <View style={styles.fileInfo}>
            <Text variant="titleMedium" numberOfLines={1}>
              {item.filename}
            </Text>
            <Text variant="bodySmall" style={styles.fileMeta}>
              {formatFileSize(item.file_size)} •{" "}
              {new Date(item.uploaded_at).toLocaleDateString()}
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
              onPress={() => handleDownloadFile(item.file_url, item.filename)}
              title="Download"
              leadingIcon="download"
            />
            <Menu.Item
              onPress={() => handleDeleteFile(item.id, item.filename)}
              title="Delete"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        {item.description && (
          <Text variant="bodyMedium" style={styles.fileDescription}>
            {item.description}
          </Text>
        )}

        <View style={styles.fileTags}>
          <Chip compact style={styles.fileTypeChip}>
            {item.file_type}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading files...</Text>
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
            {project?.title || "Project Files"}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Manage your project files and documents
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={pickDocument}
          icon="plus"
          style={styles.addButton}
        >
          Add File
        </Button>
      </View>

      <Divider />

      {/* Files List */}
      {files.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="folder-open"
            size={64}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No files yet</Text>
          <Text style={styles.emptySubtext}>
            Upload files to share with your collaborators
          </Text>
          <Button
            mode="contained"
            onPress={pickDocument}
            icon="upload"
            style={styles.uploadButton}
          >
            Upload File
          </Button>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileItem}
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
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text variant="titleMedium" style={styles.listHeaderText}>
                {files.length} File{files.length === 1 ? "" : "s"}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add File Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Upload File
            </Text>
            <TextInput
              label="Filename"
              value={newFile.filename}
              onChangeText={(text) =>
                setNewFile((prev) => ({ ...prev, filename: text }))
              }
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Description (Optional)"
              value={newFile.description}
              onChangeText={(text) =>
                setNewFile((prev) => ({ ...prev, description: text }))
              }
              style={[styles.input, styles.textArea]}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Button
                onPress={() => setModalVisible(false)}
                mode="outlined"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleUploadFile}
                mode="contained"
                loading={uploading}
                disabled={uploading}
                style={styles.modalButton}
              >
                {uploading ? "Uploading..." : "Upload"}
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
  fileCard: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIcon: {
    marginRight: spacing.sm,
    backgroundColor: colors.primary + "20",
  },
  fileInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fileMeta: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  fileDescription: {
    marginTop: spacing.sm,
    color: colors.onSurface,
    lineHeight: 20,
  },
  fileTags: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  fileTypeChip: {
    backgroundColor: colors.surfaceVariant,
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
  uploadButton: {
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
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
  },
  modalButton: {
    marginLeft: spacing.md,
  },
});

export default ProjectFileManagerScreen;
