import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Linking, Alert } from "react-native";
import {
  Text,
  Card,
  Avatar,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, colors } from "../../constants/theme";
import { ChallengeSubmissionDetailsScreenProps } from "../../types/navigation";
import ChallengeSubmissionService from "../../services/ChallengeSubmissionService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const ChallengeSubmissionDetailsScreen: React.FC<
  ChallengeSubmissionDetailsScreenProps
> = ({ route, navigation }) => {
  const { challengeId, submissionId } = route.params;
  const { accessToken } = useAuth();

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service with auth token
  useEffect(() => {
    ChallengeSubmissionService.setAuthToken(accessToken);
    fetchSubmissionDetails();
  }, [challengeId, submissionId, accessToken]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const response = await ChallengeSubmissionService.getSubmissionDetails(
        challengeId,
        submissionId
      );
      if (response.success) {
        setSubmission(response.data);
      } else {
        setError(response.error || "Failed to load submission details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load submission details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return colors.success;
      case "rejected":
        return colors.error;
      case "pending":
        return colors.warning;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open link");
    });
  };

  const handleReviewSubmission = () => {
    // Navigate to the review screen
    navigation.navigate("ChallengeSubmissionReview", { challengeId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading submission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={fetchSubmissionDetails}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!submission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="info"
            size={48}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.errorText}>Submission not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Submission Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              {submission.title || "Untitled Submission"}
            </Text>
            <View style={styles.statusContainer}>
              <Chip
                compact
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(submission.status) + "20" },
                ]}
              >
                <Text style={{ color: getStatusColor(submission.status) }}>
                  {submission.status || "pending"}
                </Text>
              </Chip>
            </View>
          </View>
        </View>

        <Divider />

        {/* Submitter Info */}
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.submitterHeader}>
              <Avatar.Image
                size={48}
                source={{
                  uri:
                    submission.user_avatar || "https://via.placeholder.com/48",
                }}
                style={styles.submitterAvatar}
              />
              <View style={styles.submitterInfo}>
                <Text variant="titleMedium">{submission.user_name}</Text>
                <Text variant="bodySmall" style={styles.submissionDate}>
                  Submitted on{" "}
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Submission Description */}
        {submission.description && (
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Description
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                {submission.description}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Submission Files */}
        {submission.submission_files &&
          submission.submission_files.length > 0 && (
            <Card style={styles.section}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Files ({submission.submission_files.length})
                </Text>
                <View style={styles.filesContainer}>
                  {submission.submission_files.map(
                    (file: string, index: number) => (
                      <Chip
                        key={index}
                        onPress={() => handleOpenLink(file)}
                        style={styles.fileChip}
                      >
                        {file.split("/").pop()}
                      </Chip>
                    )
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

        {/* Links */}
        {(submission.github_url || submission.live_demo_url) && (
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Links
              </Text>
              {submission.github_url && (
                <Button
                  mode="outlined"
                  onPress={() => handleOpenLink(submission.github_url)}
                  icon="github"
                  style={styles.linkButton}
                >
                  GitHub Repository
                </Button>
              )}
              {submission.live_demo_url && (
                <Button
                  mode="outlined"
                  onPress={() => handleOpenLink(submission.live_demo_url)}
                  icon="link"
                  style={[styles.linkButton, styles.liveDemoButton]}
                >
                  Live Demo
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Feedback */}
        {submission.feedback && (
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Feedback
              </Text>
              <View style={styles.feedbackContainer}>
                <Text variant="bodyMedium">{submission.feedback}</Text>
                {submission.points_awarded && (
                  <View style={styles.pointsContainer}>
                    <MaterialIcons
                      name="emoji-events"
                      size={20}
                      color={colors.primary}
                    />
                    <Text variant="bodyMedium" style={styles.pointsText}>
                      {submission.points_awarded} points awarded
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Review Actions (for challenge creators) */}
        {submission.is_creator && submission.status === "pending" && (
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Review Submission
              </Text>
              <Text variant="bodyMedium" style={styles.reviewText}>
                As the challenge creator, you can review and approve/reject this
                submission.
              </Text>
              <Button
                mode="contained"
                onPress={handleReviewSubmission}
                style={styles.reviewButton}
              >
                Review Submission
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
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
  errorText: {
    ...typography.body1,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.h5,
    color: colors.onBackground,
    flex: 1,
  },
  statusContainer: {
    marginLeft: spacing.md,
  },
  statusChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 6,
  },
  section: {
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 12,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  submitterHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitterAvatar: {
    marginRight: spacing.md,
  },
  submitterInfo: {
    flex: 1,
  },
  submissionDate: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  description: {
    color: colors.onSurface,
    lineHeight: 22,
  },
  filesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fileChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceVariant,
  },
  linkButton: {
    marginBottom: spacing.sm,
  },
  liveDemoButton: {
    marginTop: spacing.sm,
  },
  feedbackContainer: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: 8,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  pointsText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontWeight: "600",
  },
  reviewText: {
    marginBottom: spacing.md,
    color: colors.onSurface,
  },
  reviewButton: {
    borderRadius: 8,
  },
});

export default ChallengeSubmissionDetailsScreen;
