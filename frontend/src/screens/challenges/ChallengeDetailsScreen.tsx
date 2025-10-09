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
import { spacing, typography, colors, shadows } from "../../constants/theme";
import { ChallengeDetailsScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import ChallengeService from "../../services/ChallengeService";

const ChallengeDetailsScreen: React.FC<ChallengeDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { challengeId } = route.params;
  const theme = useTheme();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);

  useEffect(() => {
    fetchChallengeDetails();
  }, [challengeId]);

  const fetchChallengeDetails = async () => {
    try {
      setLoading(true);
      const response = await ChallengeService.getChallengeById(challengeId);

      if (response.success) {
        setChallenge(response.data);
        setIsParticipating(response.data.is_participating || false);
      } else {
        setError(response.error || "Failed to load challenge details");
      }
    } catch (err: any) {
      console.error("Error fetching challenge details:", err);
      setError(
        err.message || "An error occurred while fetching challenge details"
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChallengeDetails();
    setRefreshing(false);
  };

  const handleParticipate = async () => {
    if (isParticipating) {
      Alert.alert(
        "Leave Challenge",
        "Are you sure you want to leave this challenge?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: async () => {
              try {
                const response = await ChallengeService.leaveChallenge(
                  challengeId
                );
                if (response.success) {
                  setIsParticipating(false);
                  Alert.alert("Success", "You have left the challenge.");
                  fetchChallengeDetails(); // Refresh to get updated data
                } else {
                  Alert.alert(
                    "Error",
                    response.error || "Failed to leave challenge"
                  );
                }
              } catch (err: any) {
                Alert.alert(
                  "Error",
                  err.message || "An error occurred while leaving the challenge"
                );
              }
            },
          },
        ]
      );
    } else {
      Alert.alert("Join Challenge", "Are you ready to join this challenge?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: async () => {
            try {
              const response = await ChallengeService.joinChallenge(
                challengeId
              );
              if (response.success) {
                setIsParticipating(true);
                Alert.alert(
                  "Success",
                  "You have joined the challenge! Check your notifications for daily prompts."
                );
                fetchChallengeDetails(); // Refresh to get updated data
              } else {
                Alert.alert(
                  "Error",
                  response.error || "Failed to join challenge"
                );
              }
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message || "An error occurred while joining the challenge"
              );
            }
          },
        },
      ]);
    }
  };

  const handleSubmit = () => {
    // Navigate to the submission screen
    navigation.navigate("SubmitChallenge", { challengeId });
  };

  const handleViewSubmissions = () => {
    // Navigate to the submission review screen for challenge creators
    navigation.navigate("ChallengeSubmissionReview", { challengeId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success;
      case "upcoming":
        return colors.warning;
      case "completed":
        return colors.onSurfaceVariant;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "#4CAF50";
      case "intermediate":
        return "#FF9800";
      case "advanced":
        return "#F44336";
      default:
        return colors.onSurfaceVariant;
    }
  };

  const renderHeader = () => {
    if (!challenge) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Avatar.Icon
            size={80}
            icon="trophy"
            style={[
              styles.challengeIcon,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        </View>

        <Text
          variant="headlineSmall"
          style={[styles.challengeTitle, { color: theme.colors.onBackground }]}
        >
          {challenge.title || "Untitled Challenge"}
        </Text>

        <View style={styles.creatorContainer}>
          <Avatar.Image
            size={32}
            source={{
              uri:
                challenge.creator?.avatar_url ||
                "https://via.placeholder.com/32",
            }}
          />
          <Text
            variant="bodyMedium"
            style={[
              styles.creatorInfo,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            by {challenge.creator?.display_name || "Unknown User"}
          </Text>
        </View>

        <View style={styles.difficultyContainer}>
          <Chip
            compact
            style={[
              styles.difficultyChip,
              {
                backgroundColor:
                  getDifficultyColor(challenge.difficulty_level) + "20",
                borderColor: getDifficultyColor(challenge.difficulty_level),
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={{ color: getDifficultyColor(challenge.difficulty_level) }}
            >
              {challenge.difficulty_level || "beginner"}
            </Text>
          </Chip>
          <Chip
            compact
            style={[
              styles.statusChip,
              {
                backgroundColor: getStatusColor(challenge.status) + "20",
                borderColor: getStatusColor(challenge.status),
                borderWidth: 1,
              },
            ]}
          >
            <Text style={{ color: getStatusColor(challenge.status) }}>
              {challenge.status || "upcoming"}
            </Text>
          </Chip>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialIcons
              name="people"
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
              {challenge.current_participants || 0} participants
            </Text>
          </View>

          {challenge.days_remaining !== undefined ? (
            <View style={styles.statItem}>
              <MaterialIcons
                name="access-time"
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
                {challenge.days_remaining} days left
              </Text>
            </View>
          ) : null}

          <View style={styles.statItem}>
            <MaterialIcons
              name="emoji-events"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.primary,
                marginLeft: spacing.xs,
              }}
            >
              {challenge.points_reward || 0} pts
            </Text>
          </View>
        </View>

        <View style={styles.tagsContainer}>
          {Array.isArray(challenge.tags) &&
            challenge.tags.map((tag: string, index: number) => (
              <Chip key={index} mode="outlined" style={styles.tagChip}>
                {tag || "untagged"}
              </Chip>
            ))}
        </View>

        <View style={styles.actionButtons}>
          {challenge.status === "upcoming" ? (
            <View style={styles.statusMessageContainer}>
              <MaterialIcons name="schedule" size={24} color={colors.warning} />
              <Text variant="bodyLarge" style={styles.statusMessage}>
                This challenge starts soon!
              </Text>
              <Text variant="bodyMedium" style={styles.statusSubMessage}>
                You'll be able to join once the challenge begins
              </Text>
            </View>
          ) : challenge.status === "completed" ? (
            <View style={styles.statusMessageContainer}>
              <MaterialIcons
                name="flag"
                size={24}
                color={colors.onSurfaceVariant}
              />
              <Text variant="bodyLarge" style={styles.statusMessage}>
                This challenge has ended
              </Text>
              <Text variant="bodyMedium" style={styles.statusSubMessage}>
                Thanks for participating!
              </Text>
            </View>
          ) : (
            <>
              {isParticipating ? (
                <View style={styles.statusMessageContainer}>
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={colors.success}
                  />
                  <Text variant="bodyLarge" style={styles.statusMessage}>
                    You're participating in this challenge
                  </Text>
                  <Text variant="bodyMedium" style={styles.statusSubMessage}>
                    Good luck with your progress!
                  </Text>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleParticipate}
                  style={styles.actionButton}
                  buttonColor={theme.colors.primary}
                >
                  Join Challenge
                </Button>
              )}

              {isParticipating && challenge.status === "active" && (
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.actionButton}
                  buttonColor={colors.secondary}
                >
                  Submit Entry
                </Button>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderDescription = () => {
    if (!challenge?.description) return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Challenge Description
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, lineHeight: 22 }}
          >
            {challenge.description || "No description available"}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderRequirements = () => {
    if (
      !Array.isArray(challenge?.requirements) ||
      challenge.requirements.length === 0
    )
      return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Requirements
          </Text>
          {challenge.requirements.map((req: string, index: number) => (
            <View key={index} style={styles.requirementItem}>
              <MaterialIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurface,
                  marginLeft: spacing.sm,
                  flex: 1,
                  lineHeight: 22,
                }}
              >
                {req || "No requirement specified"}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderSubmissionGuidelines = () => {
    if (!challenge?.submission_guidelines) return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Submission Guidelines
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, lineHeight: 22 }}
          >
            {challenge.submission_guidelines ||
              "No submission guidelines available"}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderMySubmission = () => {
    if (!challenge?.user_submission) return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Your Submission
          </Text>

          <View style={styles.submissionItem}>
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.onSurface }}
            >
              {challenge.user_submission.title || "Untitled Submission"}
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurface,
                marginTop: spacing.sm,
                lineHeight: 20,
              }}
            >
              {challenge.user_submission.description ||
                "No description provided"}
            </Text>

            <View style={styles.submissionFiles}>
              {Array.isArray(challenge.user_submission.submission_files) &&
                challenge.user_submission.submission_files.map(
                  (file: string, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: file }}
                      style={styles.submissionImage}
                    />
                  )
                )}
            </View>

            <View style={styles.submissionStatus}>
              <Chip
                compact
                style={[
                  styles.statusChip,
                  challenge.user_submission.status === "approved" &&
                    styles.approvedChip,
                  challenge.user_submission.status === "under_review" &&
                    styles.reviewChip,
                  {
                    backgroundColor:
                      getStatusColor(challenge.user_submission.status) + "20",
                    borderColor: getStatusColor(
                      challenge.user_submission.status
                    ),
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: getStatusColor(challenge.user_submission.status),
                  }}
                >
                  {challenge.user_submission.status
                    ? challenge.user_submission.status.replace("_", " ")
                    : "submitted"}
                </Text>
              </Chip>
              {challenge.user_submission.points_awarded ? (
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.primary,
                    marginLeft: spacing.sm,
                  }}
                >
                  +{challenge.user_submission.points_awarded} pts
                </Text>
              ) : null}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderLeaderboard = () => {
    // For now, we'll use mock data for the leaderboard
    // In a real implementation, this would come from the API
    const topSubmissions = [
      {
        id: "1",
        user: {
          display_name: "Artist1",
          avatar_url: "https://via.placeholder.com/40",
        },
        points: 95,
      },
      {
        id: "2",
        user: {
          display_name: "Creator2",
          avatar_url: "https://via.placeholder.com/40",
        },
        points: 92,
      },
      {
        id: "3",
        user: {
          display_name: "Designer3",
          avatar_url: "https://via.placeholder.com/40",
        },
        points: 90,
      },
    ];

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Leaderboard
          </Text>

          {topSubmissions.map((submission, index) => (
            <View key={submission.id} style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text
                  variant="titleMedium"
                  style={{
                    color:
                      index === 0
                        ? "#FFD700"
                        : index === 1
                        ? "#C0C0C0"
                        : index === 2
                        ? "#CD7F32"
                        : theme.colors.onBackground,
                    fontWeight: "bold",
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              <Avatar.Image
                size={40}
                source={{
                  uri:
                    submission.user.avatar_url ||
                    "https://via.placeholder.com/40",
                }}
              />
              <View style={styles.leaderboardUserInfo}>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: index < 3 ? "600" : "normal",
                  }}
                >
                  {submission.user.display_name || "Unknown User"}
                </Text>
              </View>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "600",
                }}
              >
                {submission.points || 0} pts
              </Text>
            </View>
          ))}

          <Button
            mode="text"
            onPress={() => {}}
            style={{ marginTop: spacing.md }}
            textColor={theme.colors.primary}
          >
            View Full Leaderboard
          </Button>
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
            Loading challenge details...
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
            Error Loading Challenge
          </Text>
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: spacing.sm,
              maxWidth: 300,
            }}
          >
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={fetchChallengeDetails}
            style={{ marginTop: spacing.lg }}
            buttonColor={theme.colors.primary}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        <Divider style={styles.divider} />
        {renderDescription()}
        <Divider style={styles.divider} />
        {renderRequirements()}
        <Divider style={styles.divider} />
        {renderSubmissionGuidelines()}
        <Divider style={styles.divider} />
        {renderMySubmission()}
        <Divider style={styles.divider} />
        {renderLeaderboard()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {isParticipating && challenge?.status === "active" && (
        <FAB
          icon="upload"
          label="Submit Entry"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
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
    backgroundColor: colors.surface,
    ...shadows.small,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    marginBottom: spacing.md,
  },
  challengeIcon: {
    marginBottom: spacing.md,
  },
  challengeTitle: {
    ...typography.h3,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  creatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  creatorInfo: {
    marginLeft: spacing.sm,
  },
  difficultyContainer: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  difficultyChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  statusChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
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
    backgroundColor: colors.surfaceVariant,
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
    width: "100%",
  },
  actionButton: {
    marginVertical: spacing.sm,
    borderRadius: 8,
  },
  statusMessageContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    width: "100%",
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    marginVertical: spacing.sm,
  },
  statusMessage: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    color: colors.onBackground,
  },
  statusSubMessage: {
    textAlign: "center",
    opacity: 0.7,
    color: colors.onSurfaceVariant,
  },
  divider: {
    marginVertical: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.small,
    borderRadius: 16,
  },
  sectionTitle: {
    ...typography.h5,
    marginBottom: spacing.md,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  leaderboardRank: {
    width: 30,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  leaderboardUserInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  submissionItem: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
  },
  submissionFiles: {
    flexDirection: "row",
    marginVertical: spacing.md,
  },
  submissionImage: {
    width: 80,
    height: 80,
    marginRight: spacing.sm,
    borderRadius: 8,
  },
  submissionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  approvedChip: {
    // Add styles for approved chip if needed
  },
  reviewChip: {
    // Add styles for review chip if needed
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 28,
  },
});

export default ChallengeDetailsScreen;
