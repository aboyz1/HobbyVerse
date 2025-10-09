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
  Snackbar,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import SquadService from "../../services/SquadService";
import { spacing, typography } from "../../constants/theme";
import { CreatePostScreenProps } from "../../types/navigation";

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  route,
  navigation,
}) => {
  const { squadId, threadId } = route.params;
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Post content is required");
      return;
    }

    if (content.length < 5 || content.length > 2000) {
      setError("Post content must be 5-2000 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      SquadService.setAuthToken(accessToken);

      const response = await SquadService.createPost(squadId, {
        content: content.trim(),
        thread_id: threadId || undefined,
      });

      if (response.success) {
        setSuccess(true);
        // Navigate back to squad details or thread
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setError(response.error || "Failed to create post");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the post");
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
              Create New Post
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Share your thoughts with the squad
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Post Content"
              value={content}
              onChangeText={setContent}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.textArea}
              maxLength={2000}
              right={<TextInput.Affix text={`${content.length}/2000`} />}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? "Creating Post..." : "Create Post"}
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
        Post created successfully!
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
  textArea: {
    height: 150,
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});

export default CreatePostScreen;
