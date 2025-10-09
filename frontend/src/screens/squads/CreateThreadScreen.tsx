import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  RadioButton,
  Snackbar,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import SquadService from "../../services/SquadService";
import { spacing, typography } from "../../constants/theme";
import { CreateThreadScreenProps } from "../../types/navigation";

const CreateThreadScreen: React.FC<CreateThreadScreenProps> = ({
  route,
  navigation,
}) => {
  const { squadId } = route.params;
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "general" as "projects" | "tutorials" | "tools" | "general",
    is_pinned: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Thread title is required");
      return;
    }

    if (formData.title.length < 5 || formData.title.length > 200) {
      setError("Thread title must be 5-200 characters");
      return;
    }

    if (
      formData.description &&
      (formData.description.length < 10 || formData.description.length > 1000)
    ) {
      setError("Description must be 10-1000 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      SquadService.setAuthToken(accessToken);

      const response = await SquadService.createThread(squadId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        is_pinned: formData.is_pinned,
      });

      if (response.success) {
        setSuccess(true);
        // Navigate back to squad details
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setError(response.error || "Failed to create thread");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the thread");
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
              Create New Thread
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Start a new discussion in the squad
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Thread Title"
              value={formData.title}
              onChangeText={(value) => updateField("title", value)}
              mode="outlined"
              style={styles.input}
              maxLength={200}
              right={<TextInput.Affix text={`${formData.title.length}/200`} />}
            />

            <TextInput
              label="Description (Optional)"
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
                Thread Type
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                What kind of discussion is this?
              </Text>

              <RadioButton.Group
                onValueChange={(value) => updateField("type", value as any)}
                value={formData.type}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="general" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      General Discussion
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      For general topics and conversations
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="projects" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Projects
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      For discussing projects and collaborations
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="tutorials" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Tutorials
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      For sharing tutorials and guides
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="tools" />
                  <View>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onBackground }}
                    >
                      Tools & Resources
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      For discussing tools and resources
                    </Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            <View style={styles.checkboxContainer}>
              <RadioButton
                value="pinned"
                status={formData.is_pinned ? "checked" : "unchecked"}
                onPress={() => updateField("is_pinned", !formData.is_pinned)}
              />
              <Text
                variant="bodyLarge"
                style={{
                  color: theme.colors.onBackground,
                  marginLeft: spacing.sm,
                }}
              >
                Pin this thread to the top
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? "Creating Thread..." : "Create Thread"}
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
        Thread created successfully!
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
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});

export default CreateThreadScreen;
