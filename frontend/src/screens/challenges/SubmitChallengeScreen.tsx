import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Image } from "react-native";
import {
  Text,
  Button,
  Card,
  TextInput,
  Chip,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import { spacing, typography } from "../../constants/theme";
import { SubmitChallengeScreenProps } from "../../types/navigation";
import ChallengeService from "../../services/ChallengeService";
import { MaterialIcons } from "@expo/vector-icons";
import { useTabNavigation } from "../../hooks/useNavigation";

const SubmitChallengeScreen: React.FC<SubmitChallengeScreenProps> = ({
  route,
  navigation,
}) => {
  const tabNavigation = useTabNavigation();
  const parentNavigation = tabNavigation.getParent();
  const { challengeId } = route.params;
  const theme = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddImage = () => {
    // For now, we'll show an alert
    // In a real implementation, this would open a file picker
    Alert.alert(
      "Add Image",
      "Image upload functionality will be implemented in the next update."
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your submission");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description for your submission");
      return;
    }

    try {
      setLoading(true);
      const submissionData = {
        title: title.trim(),
        description: description.trim(),
        submission_files: images,
        github_url: githubUrl.trim() || undefined,
        live_demo_url: liveDemoUrl.trim() || undefined,
      };

      const response = await ChallengeService.submitChallenge(
        challengeId,
        submissionData
      );

      if (response.success) {
        Alert.alert(
          "Success",
          "Your challenge submission has been sent for review!",
          [
            {
              text: "OK",
              onPress: () => parentNavigation?.goBack(),
            },
          ]
        );
      } else {
        setError(response.error || "Failed to submit challenge");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while submitting the challenge"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text
              variant="titleLarge"
              style={[styles.title, { color: theme.colors.onBackground }]}
            >
              Submit Challenge
            </Text>

            <TextInput
              label="Submission Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Images
              </Text>
              <Button
                mode="outlined"
                onPress={handleAddImage}
                style={styles.addButton}
                icon="plus"
              >
                Add Image
              </Button>

              {images.length > 0 && (
                <View style={styles.imagesContainer}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image
                        source={{ uri: image }}
                        style={styles.imagePreview}
                      />
                      <Button
                        mode="text"
                        onPress={() => {}}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          minWidth: 40,
                          minHeight: 40,
                        }}
                        icon="close"
                      >
                        {""}
                      </Button>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TextInput
              label="GitHub Repository URL (optional)"
              value={githubUrl}
              onChangeText={setGithubUrl}
              style={styles.input}
              mode="outlined"
              keyboardType="url"
            />

            <TextInput
              label="Live Demo URL (optional)"
              value={liveDemoUrl}
              onChangeText={setLiveDemoUrl}
              style={styles.input}
              mode="outlined"
              keyboardType="url"
            />

            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Challenge"}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  input: {
    marginBottom: spacing.md,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    marginBottom: spacing.sm,
  },
  addButton: {
    marginBottom: spacing.md,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  imageItem: {
    position: "relative",
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    minWidth: 30,
    minHeight: 30,
  },
  errorText: {
    ...typography.body1,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});

export default SubmitChallengeScreen;
