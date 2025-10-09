import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import { spacing, typography } from "../../constants/theme";
import { CreateChallengeScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import ChallengeService from "../../services/ChallengeService";

const CreateChallengeScreen: React.FC<CreateChallengeScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty_level: "beginner" as "beginner" | "intermediate" | "advanced",
    points_reward: "",
    badge_reward: "",
    start_date: "",
    end_date: "",
    max_participants: "",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [submissionGuidelines, setSubmissionGuidelines] = useState("");
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

  const addRequirement = () => {
    setRequirements((prev) => [...prev, ""]);
  };

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      setRequirements((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Challenge title is required");
      return;
    }

    if (formData.title.length < 5 || formData.title.length > 100) {
      setError("Challenge title must be 5-100 characters");
      return;
    }

    if (!formData.description.trim()) {
      setError("Challenge description is required");
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

    if (!formData.points_reward) {
      setError("Points reward is required");
      return;
    }

    const points = parseInt(formData.points_reward);
    if (isNaN(points) || points <= 0 || points > 1000) {
      setError("Points reward must be between 1 and 1000");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError("Start and end dates are required");
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (startDate >= endDate) {
      setError("End date must be after start date");
      return;
    }

    if (endDate.getTime() - startDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
      setError("Challenge duration cannot exceed 1 year");
      return;
    }

    if (requirements.filter((req) => req.trim()).length === 0) {
      setError("Please add at least one requirement");
      return;
    }

    if (!submissionGuidelines.trim()) {
      setError("Submission guidelines are required");
      return;
    }

    if (
      submissionGuidelines.length < 20 ||
      submissionGuidelines.length > 1000
    ) {
      setError("Submission guidelines must be 20-1000 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const challengeData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags,
        difficulty_level: formData.difficulty_level,
        points_reward: points,
        badge_reward: formData.badge_reward || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants)
          : undefined,
        requirements: requirements.filter((req) => req.trim()),
        submission_guidelines: submissionGuidelines.trim(),
      };

      const response = await ChallengeService.createChallenge(challengeData);

      if (response.success) {
        setSuccess(true);
        // Navigate to the newly created challenge
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setError(response.error || "Failed to create challenge");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the challenge");
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
              Create New Challenge
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Inspire the community with a new challenge
            </Text>
          </View>

          <View style={styles.form}>
            {/* Title */}
            <TextInput
              label="Challenge Title"
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
                Add tags to help people find your challenge
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
                How challenging is this challenge?
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

            {/* Rewards */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Rewards
              </Text>

              <TextInput
                label="Points Reward"
                value={formData.points_reward}
                onChangeText={(value) => updateField("points_reward", value)}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                placeholder="100"
              />

              <TextInput
                label="Badge Reward (Optional)"
                value={formData.badge_reward}
                onChangeText={(value) => updateField("badge_reward", value)}
                mode="outlined"
                style={styles.input}
                placeholder="challenge_master"
              />
            </View>

            {/* Dates */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Challenge Duration
              </Text>

              <View style={styles.dateRow}>
                <TextInput
                  label="Start Date"
                  value={formData.start_date}
                  onChangeText={(value) => updateField("start_date", value)}
                  mode="outlined"
                  style={[styles.input, styles.dateInput]}
                  placeholder="YYYY-MM-DD"
                />

                <TextInput
                  label="End Date"
                  value={formData.end_date}
                  onChangeText={(value) => updateField("end_date", value)}
                  mode="outlined"
                  style={[styles.input, styles.dateInput]}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            {/* Max Participants */}
            <TextInput
              label="Maximum Participants (Optional)"
              value={formData.max_participants}
              onChangeText={(value) => updateField("max_participants", value)}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="No limit"
            />

            {/* Requirements */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Requirements
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                What do participants need to complete this challenge?
              </Text>

              {requirements.map((requirement, index) => (
                <View key={index} style={styles.requirementRow}>
                  <TextInput
                    value={requirement}
                    onChangeText={(value) => updateRequirement(index, value)}
                    mode="outlined"
                    style={[styles.input, styles.flexInput]}
                    placeholder={`Requirement ${index + 1}`}
                  />
                  {requirements.length > 1 && (
                    <Button
                      mode="outlined"
                      onPress={() => removeRequirement(index)}
                      style={styles.removeButton}
                    >
                      Remove
                    </Button>
                  )}
                </View>
              ))}

              <Button
                mode="outlined"
                onPress={addRequirement}
                style={styles.addButton}
                icon="plus"
              >
                Add Requirement
              </Button>
            </View>

            {/* Submission Guidelines */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Submission Guidelines
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                How should participants submit their work?
              </Text>

              <TextInput
                value={submissionGuidelines}
                onChangeText={setSubmissionGuidelines}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
                maxLength={1000}
                right={
                  <TextInput.Affix
                    text={`${submissionGuidelines.length}/1000`}
                  />
                }
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? "Creating Challenge..." : "Create Challenge"}
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
        Challenge created successfully!
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
  dateRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  flexInput: {
    flex: 1,
    marginRight: spacing.sm,
    marginBottom: 0,
  },
  removeButton: {
    height: 56,
  },
  addButton: {
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});

export default CreateChallengeScreen;
