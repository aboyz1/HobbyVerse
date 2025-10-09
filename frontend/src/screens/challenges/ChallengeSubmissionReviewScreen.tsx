import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  Searchbar,
  Card,
  Avatar,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
  Menu,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, colors } from "../../constants/theme";
import { ChallengeSubmissionReviewScreenProps } from "../../types/navigation";
import ChallengeSubmissionService from "../../services/ChallengeSubmissionService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const ChallengeSubmissionReviewScreen: React.FC<
  ChallengeSubmissionReviewScreenProps
> = ({ route, navigation }) => {
  const { challengeId } = route.params;
  const { accessToken } = useAuth();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>(
    {}
  );

  const statusOptions = ["pending", "approved", "rejected"];

  // Initialize service with auth token
  useEffect(() => {
    ChallengeSubmissionService.setAuthToken(accessToken);
    fetchSubmissions();
  }, [challengeId, accessToken]);

  const fetchSubmissions = async (
    pageNum: number = 1,
    refresh: boolean = false
  ) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await ChallengeSubmissionService.getChallengeSubmissions(
        challengeId,
        {
          page: pageNum,
          limit: 10,
          status: statusFilter || undefined,
        }
      );

      if (response.success) {
        const submissionsData = Array.isArray(response.data)
          ? response.data
          : [];

        if (pageNum === 1) {
          setSubmissions(submissionsData);
        } else {
          setSubmissions((prev) => [...prev, ...submissionsData]);
        }

        setHasMore(submissionsData.length === 10);
        setPage(pageNum);
      } else {
        setError(response.error || "Failed to load submissions");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchSubmissions(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchSubmissions(page + 1);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real implementation, you would filter the submissions
    // For now, we'll just set the search query
  };

  const clearFilters = () => {
    setStatusFilter(null);
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

  const openMenu = (submissionId: string) => {
    setMenuVisible((prev) => ({ ...prev, [submissionId]: true }));
  };

  const closeMenu = (submissionId: string) => {
    setMenuVisible((prev) => ({ ...prev, [submissionId]: false }));
  };

  const handleReviewSubmission = async (
    submissionId: string,
    status: "approved" | "rejected",
    feedback?: string,
    pointsAwarded?: number
  ) => {
    try {
      const response =
        await ChallengeSubmissionService.reviewChallengeSubmission(
          challengeId,
          submissionId,
          {
            status,
            feedback,
            points_awarded: pointsAwarded,
          }
        );

      if (response.success) {
        // Update the submission in the list
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId
              ? { ...sub, status, feedback, points_awarded: pointsAwarded }
              : sub
          )
        );
        closeMenu(submissionId);
        Alert.alert(
          "Success",
          `Submission ${
            status === "approved" ? "approved" : "rejected"
          } successfully`
        );
      } else {
        Alert.alert("Error", response.error || "Failed to review submission");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to review submission");
    }
  };

  const renderSubmissionItem = ({ item }: { item: any }) => {
    // Filter by search query if needed
    if (
      searchQuery &&
      !item.user_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return null;
    }

    return (
      <Card style={styles.submissionCard}>
        <Card.Content>
          <View style={styles.submissionHeader}>
            <Avatar.Image
              size={40}
              source={{
                uri: item.user_avatar || "https://via.placeholder.com/40",
              }}
              style={styles.creatorAvatar}
            />
            <View style={styles.submissionInfo}>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.title || "Untitled Submission"}
              </Text>
              <Text variant="bodySmall" style={styles.creatorName}>
                by {item.user_name || "Unknown User"}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <Chip
                compact
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(item.status) + "20" },
                ]}
              >
                <Text style={{ color: getStatusColor(item.status) }}>
                  {item.status || "pending"}
                </Text>
              </Chip>
            </View>
          </View>

          {item.description && (
            <Text
              variant="bodyMedium"
              numberOfLines={3}
              style={styles.submissionDescription}
            >
              {item.description}
            </Text>
          )}

          <View style={styles.submissionMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="access-time"
                size={16}
                color={colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={styles.metaText}>
                {new Date(item.submitted_at).toLocaleDateString()}
              </Text>
            </View>
            {item.points_awarded && (
              <View style={styles.metaItem}>
                <MaterialIcons
                  name="emoji-events"
                  size={16}
                  color={colors.primary}
                />
                <Text
                  variant="bodySmall"
                  style={[styles.metaText, { color: colors.primary }]}
                >
                  {item.points_awarded} pts
                </Text>
              </View>
            )}
          </View>

          {item.feedback && (
            <View style={styles.feedbackContainer}>
              <Text variant="bodySmall" style={styles.feedbackLabel}>
                Feedback:
              </Text>
              <Text variant="bodyMedium">{item.feedback}</Text>
            </View>
          )}

          {item.submission_files && item.submission_files.length > 0 && (
            <View style={styles.filesContainer}>
              <Text variant="bodySmall" style={styles.filesLabel}>
                Files ({item.submission_files.length}):
              </Text>
              {item.submission_files.map((file: string, index: number) => (
                <Chip key={index} compact style={styles.fileChip}>
                  {file.split("/").pop()}
                </Chip>
              ))}
            </View>
          )}

          {item.github_url && (
            <View style={styles.linkContainer}>
              <MaterialIcons name="code" size={16} color={colors.primary} />
              <Text
                variant="bodySmall"
                style={[styles.linkText, { color: colors.primary }]}
              >
                GitHub Repository
              </Text>
            </View>
          )}

          {item.live_demo_url && (
            <View style={styles.linkContainer}>
              <MaterialIcons name="link" size={16} color={colors.primary} />
              <Text
                variant="bodySmall"
                style={[styles.linkText, { color: colors.primary }]}
              >
                Live Demo
              </Text>
            </View>
          )}

          {item.status === "pending" && (
            <View style={styles.actionContainer}>
              <Menu
                visible={menuVisible[item.id] || false}
                onDismiss={() => closeMenu(item.id)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => openMenu(item.id)}
                    style={styles.reviewButton}
                  >
                    Review
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    handleReviewSubmission(item.id, "approved");
                  }}
                  title="Approve"
                  leadingIcon="check"
                />
                <Menu.Item
                  onPress={() => {
                    handleReviewSubmission(item.id, "rejected");
                  }}
                  title="Reject"
                  leadingIcon="close"
                />
              </Menu>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating size="small" color={colors.primary} />
      </View>
    );
  };

  if (loading && submissions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search submissions..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterRow}>
          <FlatList
            horizontal
            data={statusOptions}
            renderItem={({ item }) => (
              <Chip
                key={item}
                selected={statusFilter === item}
                onPress={() =>
                  setStatusFilter(statusFilter === item ? null : item)
                }
                style={[
                  styles.filterChip,
                  statusFilter === item && {
                    backgroundColor: getStatusColor(item) + "20",
                    borderColor: getStatusColor(item),
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      statusFilter === item
                        ? getStatusColor(item)
                        : colors.onSurfaceVariant,
                  }}
                >
                  {item}
                </Text>
              </Chip>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          />

          {(statusFilter || searchQuery) && (
            <Button
              mode="text"
              onPress={clearFilters}
              style={styles.clearFiltersButton}
              textColor={colors.error}
            >
              Clear
            </Button>
          )}
        </View>
      </View>

      <Divider />

      {/* Submissions List */}
      {submissions.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="assignment"
            size={64}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No submissions found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || statusFilter
              ? "Try adjusting your filters"
              : "No submissions have been made yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmissionItem}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text variant="titleMedium" style={styles.listHeaderText}>
                {submissions.length} Submission
                {submissions.length === 1 ? "" : "s"}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchBar: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterScroll: {
    paddingVertical: spacing.xs,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  clearFiltersButton: {
    marginLeft: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  listHeaderText: {
    ...typography.h6,
    color: colors.onBackground,
  },
  submissionCard: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  submissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  creatorAvatar: {
    marginRight: spacing.sm,
  },
  submissionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  creatorName: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  statusContainer: {
    flexDirection: "row",
  },
  statusChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 6,
  },
  submissionDescription: {
    marginBottom: spacing.md,
    color: colors.onSurface,
    lineHeight: 20,
  },
  submissionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  metaText: {
    ...typography.body2,
    marginLeft: spacing.xs,
    color: colors.onSurfaceVariant,
  },
  feedbackContainer: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  feedbackLabel: {
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  filesContainer: {
    marginBottom: spacing.sm,
  },
  filesLabel: {
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  fileChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  linkText: {
    ...typography.body2,
    marginLeft: spacing.xs,
    textDecorationLine: "underline",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  reviewButton: {
    borderRadius: 8,
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: "center",
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
});

export default ChallengeSubmissionReviewScreen;
