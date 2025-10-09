import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Chip,
  RadioButton,
  Snackbar,
  ActivityIndicator,
  Avatar,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import ProjectService from "../../services/ProjectService";
import { spacing, typography } from "../../constants/theme";
import { CreateProjectScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({
  route,
  navigation,
}) => {
  const { squadId } = route.params || {};
  const theme = useTheme();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "squad_only" | "private",
    difficulty_level: "beginner" as "beginner" | "intermediate" | "advanced",
    estimated_hours: "",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setThumbnail(result.assets[0].uri);
      // In a real app, you would upload this image to your server here
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Project title is required");
      return;
    }

    if (formData.title.length < 5 || formData.title.length > 100) {
      setError("Project title must be 5-100 characters");
      return;
    }

    if (!formData.description.trim()) {
      setError("Project description is required");
      return;
    }

    if (
      formData.description.length < 20 ||
      formData.description.length > 2000
    ) {
      setError("Description must be 20-2000 characters");
      return;
    }

    if (tags.length === 0) {
      setError("Please add at least one tag");
      return;
    }

    if (tags.length > 10) {
      setError("You can add up to 10 tags");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags,
        squad_id: squadId || undefined,
        visibility: formData.visibility,
        difficulty_level: formData.difficulty_level,
        estimated_hours: formData.estimated_hours
          ? parseInt(formData.estimated_hours)
          : undefined,
        thumbnail_url: thumbnail || undefined,
      };

      const response = await ProjectService.createProject(projectData);

      if (response.success) {
        setSuccess(true);
        // Navigate to the newly created project
        setTimeout(() => {
          // Now response.data should contain the project object
          if (response.data && response.data.id) {
            navigation.navigate("ProjectDetails", {
              projectId: response.data.id,
            });
          } else {
            // Fallback: go back to projects list
            navigation.goBack();
          }
        }, 1500);
      } else {
        setError(response.error || "Failed to create project");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Create New Project
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Share your hobby project with the community
            </Text>
          </View>

          <View style={styles.form}>
            {/* Thumbnail Upload */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Project Thumbnail
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Add an image to represent your project
              </Text>

              <TouchableOpacity
                onPress={pickImage}
                style={styles.thumbnailContainer}
              >
                {thumbnail ? (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.thumbnailPreview}
                  />
                ) : (
                  <View
                    style={[
                      styles.thumbnailPlaceholder,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <MaterialIcons
                      name="add-a-photo"
                      size={48}
                      color={theme.colors.onSurface}
                    />
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: theme.colors.onSurface,
                        marginTop: spacing.sm,
                      }}
                    >
                      Tap to add thumbnail
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Title */}
            <TextInput
              label="Project Title"
              value={formData.title}
              onChangeText={(value) => updateField("title", value)}
              mode="outlined"
              style={styles.input}
              maxLength={100}
              right={<TextInput.Affix text={`${formData.title.length}/100`} />}
            />

            {/* Description */}
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => updateField("description", value)}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, styles.textArea]}
              maxLength={2000}
              right={
                <TextInput.Affix text={`${formData.description.length}/2000`} />
              }
            />

            {/* Tags */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Tags
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Add tags to help people find your project
              </Text>

              <View style={styles.tagInputContainer}>
                <TextInput
                  label="Add a tag"
                  value={newTag}
                  onChangeText={setNewTag}
                  mode="outlined"
                  style={styles.tagInput}
                  onSubmitEditing={addTag}
                  right={
                    <TextInput.Icon
                      icon="plus"
                      onPress={addTag}
                      disabled={!newTag.trim()}
                    />
                  }
                />
              </View>

              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    mode="outlined"
                    onClose={() => removeTag(tag)}
                    style={styles.tagChip}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Difficulty Level */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Difficulty Level
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                How challenging is this project?
              </Text>

              <RadioButton.Group
                onValueChange={(value) =>
                  updateField("difficulty_level", value as any)
                }
                value={formData.difficulty_level}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="beginner" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Beginner
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Suitable for newcomers to this hobby
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="intermediate" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Intermediate
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Requires some experience
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="advanced" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Advanced
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      For experienced hobbyists
                    </Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {/* Estimated Hours */}
            <TextInput
              label="Estimated Hours (Optional)"
              value={formData.estimated_hours}
              onChangeText={(value) => updateField("estimated_hours", value)}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />

            {/* Visibility */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Visibility
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Who can see your project?
              </Text>

              <RadioButton.Group
                onValueChange={(value) =>
                  updateField("visibility", value as any)
                }
                value={formData.visibility}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="public" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Public
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Anyone can view this project
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="squad_only" disabled={!squadId} />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Squad Only
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {squadId
                        ? "Only members of this squad can view"
                        : "Only available when creating from a squad"}
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="private" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Private
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Only you can view this project
                    </Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? "Creating Project..." : "Create Project"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={success}
        onDismiss={() => setSuccess(false)}
        duration={2000}
        style={{ backgroundColor: theme.colors.primary }}
      >
        Project created successfully!
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body1,
    textAlign: "center",
    opacity: 0.7,
  },
  form: {
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.lg,
  },
  textArea: {
    height: 120,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h5,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.body2,
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  thumbnailContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  thumbnailPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tagInputContainer: {
    marginBottom: spacing.md,
  },
  tagInput: {
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});

export default CreateProjectScreen;
