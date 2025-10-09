import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Chip,
  RadioButton,
  Snackbar,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import SquadService from "../../services/SquadService";
import { spacing, typography } from "../../constants/theme";
import { CreateSquadScreenProps } from "../../types/navigation";

const CreateSquadScreen: React.FC<CreateSquadScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    privacy: "public" as "public" | "private" | "invite_only",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Squad name is required");
      return;
    }

    if (formData.name.length < 3 || formData.name.length > 100) {
      setError("Squad name must be 3-100 characters");
      return;
    }

    if (tags.length === 0) {
      setError("Please add at least one tag");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      SquadService.setAuthToken(accessToken);

      const response = await SquadService.createSquad({
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags,
        privacy: formData.privacy,
      });

      if (response.success) {
        setSuccess(true);
        // Navigate to the newly created squad
        setTimeout(() => {
          if (response.data?.squad.id) {
            navigation.navigate("SquadDetails", {
              squadId: response.data.squad.id,
            });
          }
        }, 1500);
      } else {
        setError(response.error || "Failed to create squad");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the squad");
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
              style={[styles.title, { color: theme.colors.onBackground }]}
            >
              Create New Squad
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Start a new community for your hobby interests
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Squad Name"
              value={formData.name}
              onChangeText={(value) => updateField("name", value)}
              mode="outlined"
              style={styles.input}
              maxLength={100}
              right={<TextInput.Affix text={`${formData.name.length}/100`} />}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => updateField("description", value)}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
              maxLength={1000}
              right={
                <TextInput.Affix text={`${formData.description.length}/1000`} />
              }
            />

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
                Add tags to help people find your squad
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

            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Privacy
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Who can join your squad?
              </Text>

              <RadioButton.Group
                onValueChange={(value) => updateField("privacy", value as any)}
                value={formData.privacy}
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
                      Anyone can join and view content
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
                      Only invited members can join and view content
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="invite_only" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Invite Only
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Members must be invited to join
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
              {loading ? "Creating Squad..." : "Create Squad"}
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
        Squad created successfully!
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
    height: 100,
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

export default CreateSquadScreen;
