import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Text,
  Searchbar,
  Chip,
  Card,
  Avatar,
  ActivityIndicator,
  Button,
  IconButton,
} from "react-native-paper";
import { View as SafeAreaView } from "react-native";
import { spacing, typography, colors, shadows } from "../../constants/theme";
import { ChallengesScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import { useTabNavigation } from "../../hooks/useNavigation";
import ChallengeService from "../../services/ChallengeService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const tabNavigation = useTabNavigation();
  const parentNavigation = tabNavigation.getParent();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const difficultyOptions = ["beginner", "intermediate", "advanced"];
  const statusOptions = ["upcoming", "active", "completed"];

  // Mock data for challenges (fallback only)
  const mockChallenges = [
    {
      id: "123e4567-e89b-12d3-a456-426614174000", // Valid UUID
      title: "30-Day Drawing Challenge",
      description: "Improve your drawing skills with daily prompts for 30 days",
      tags: ["drawing", "art", "daily"],
      difficulty_level: "beginner",
      points_reward: 100,
      badge_reward: "artist",
      start_date: "2023-06-01",
      end_date: "2023-06-30",
      current_participants: 1245,
      status: "active",
      creator: {
        display_name: "ArtMaster",
        avatar_url: "https://via.placeholder.com/40",
      },
      is_participating: true,
      days_remaining: 15,
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174001", // Valid UUID
      title: "Advanced Woodworking Project",
      description:
        "Build a complex piece of furniture using traditional techniques",
      tags: ["woodworking", "furniture", "advanced"],
      difficulty_level: "advanced",
      points_reward: 500,
      badge_reward: "craftsman",
      start_date: "2023-07-01",
      end_date: "2023-08-31",
      current_participants: 89,
      status: "upcoming",
      creator: {
        display_name: "WoodWorker",
        avatar_url: "https://via.placeholder.com/40",
      },
      is_participating: false,
      days_remaining: 22,
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174002", // Valid UUID
      title: "Beginner Photography Challenge",
      description: "Learn the basics of photography with weekly assignments",
      tags: ["photography", "beginner", "learning"],
      difficulty_level: "beginner",
      points_reward: 75,
      start_date: "2023-05-01",
      end_date: "2023-05-31",
      current_participants: 2103,
      status: "completed",
      creator: {
        display_name: "PhotoPro",
        avatar_url: "https://via.placeholder.com/40",
      },
      is_participating: false,
    },
  ];

  const fetchChallenges = async (
    pageNum: number = 1,
    refresh: boolean = false
  ) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      // Actual API call
      const response = await ChallengeService.getChallenges({
        page: pageNum,
        limit: 10,
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        difficulty: difficultyFilter || undefined,
        status: statusFilter || undefined,
      });

      if (response.success) {
        // Ensure data is an array
        const challengesData = Array.isArray(response.data)
          ? response.data
          : [];

        if (pageNum === 1) {
          setChallenges(challengesData);
        } else {
          setChallenges((prev) => [...prev, ...challengesData]);
        }

        // Check if there are more challenges to load
        setHasMore(challengesData.length === 10); // Assuming 10 items per page
        setPage(pageNum);
      } else {
        setError(response.error || "Failed to load challenges");
        // Fallback to mock data on error
        if (pageNum === 1) {
          setChallenges(mockChallenges);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load challenges");
      // Fallback to mock data on error
      if (pageNum === 1) {
        setChallenges(mockChallenges);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchChallenges(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchChallenges(page + 1);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setDifficultyFilter(null);
    setStatusFilter(null);
    setSearchQuery("");
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

  const renderChallengeItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.challengeItem}
      onPress={() =>
        parentNavigation?.navigate("ChallengeDetails", { challengeId: item.id })
      }
    >
      <Card style={styles.challengeCard}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.challengeHeader}>
            <Avatar.Image
              size={40}
              source={{
                uri:
                  item.creator?.avatar_url || "https://via.placeholder.com/40",
              }}
              style={styles.creatorAvatar}
            />
            <View style={styles.challengeInfo}>
              <Text
                variant="titleMedium"
                numberOfLines={1}
                style={styles.challengeTitle}
              >
                {item.title || "Untitled Challenge"}
              </Text>
              <Text variant="bodySmall" style={styles.creatorName}>
                by {item.creator?.display_name || "Unknown User"}
              </Text>
            </View>
            {item.is_participating && (
              <Chip compact style={styles.participatingChip}>
                Participating
              </Chip>
            )}
          </View>

          <Text
            variant="bodyMedium"
            numberOfLines={2}
            style={styles.challengeDescription}
          >
            {item.description || "No description available"}
          </Text>

          <View style={styles.challengeMeta}>
            <View style={[styles.metaItem, styles.difficultyMeta]}>
              <MaterialIcons
                name="signal-cellular-alt"
                size={16}
                color={getDifficultyColor(item.difficulty_level)}
              />
              <Text
                variant="bodySmall"
                style={[
                  styles.metaText,
                  { color: getDifficultyColor(item.difficulty_level) },
                ]}
              >
                {item.difficulty_level || "beginner"}
              </Text>
            </View>
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
                {item.points_reward || 0} pts
              </Text>
            </View>
            {item.days_remaining !== undefined && (
              <View style={styles.metaItem}>
                <MaterialIcons
                  name="access-time"
                  size={16}
                  color={colors.onSurfaceVariant}
                />
                <Text variant="bodySmall" style={styles.metaText}>
                  {item.days_remaining} days
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <MaterialIcons
                name="people"
                size={16}
                color={colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={styles.metaText}>
                {item.current_participants || 0}
              </Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {Array.isArray(item.tags) &&
              item.tags.slice(0, 3).map((tag: string, index: number) => (
                <Chip key={index} compact style={styles.tagChip}>
                  {tag}
                </Chip>
              ))}
            {Array.isArray(item.tags) && item.tags.length > 3 && (
              <Chip compact style={styles.tagChip}>
                +{item.tags.length - 3}
              </Chip>
            )}
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
                {item.status || "upcoming"}
              </Text>
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating size="small" color={colors.primary} />
      </View>
    );
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchChallenges(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedTags, difficultyFilter, statusFilter]);

  if (loading && challenges.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading challenges...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={[styles.searchContainer, { paddingTop: insets.top }]}>
        <Searchbar
          placeholder="Search challenges..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {difficultyOptions.map((difficulty) => (
              <Chip
                key={difficulty}
                selected={difficultyFilter === difficulty}
                onPress={() =>
                  setDifficultyFilter(
                    difficultyFilter === difficulty ? null : difficulty
                  )
                }
                style={[
                  styles.filterChip,
                  difficultyFilter === difficulty && {
                    backgroundColor: getDifficultyColor(difficulty) + "20",
                    borderColor: getDifficultyColor(difficulty),
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      difficultyFilter === difficulty
                        ? getDifficultyColor(difficulty)
                        : colors.onSurfaceVariant,
                  }}
                >
                  {difficulty}
                </Text>
              </Chip>
            ))}

            {statusOptions.map((status) => (
              <Chip
                key={status}
                selected={statusFilter === status}
                onPress={() =>
                  setStatusFilter(statusFilter === status ? null : status)
                }
                style={[
                  styles.filterChip,
                  statusFilter === status && {
                    backgroundColor: getStatusColor(status) + "20",
                    borderColor: getStatusColor(status),
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      statusFilter === status
                        ? getStatusColor(status)
                        : colors.onSurfaceVariant,
                  }}
                >
                  {status}
                </Text>
              </Chip>
            ))}
          </ScrollView>

          {(selectedTags.length > 0 ||
            difficultyFilter ||
            statusFilter ||
            searchQuery) && (
            <Button
              mode="text"
              onPress={clearFilters}
              style={styles.clearFiltersButton}
              textColor={colors.error}
            >
              Clear All
            </Button>
          )}
        </View>
      </View>

      {/* Challenges List */}
      {challenges.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="sports-esports"
            size={64}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No challenges found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ||
            selectedTags.length > 0 ||
            difficultyFilter ||
            statusFilter
              ? "Try adjusting your filters"
              : "Check back later for new challenges!"}
          </Text>
          <Button
            mode="contained"
            onPress={() => parentNavigation?.navigate("CreateChallenge")}
            style={styles.createButton}
            buttonColor={colors.primary}
            textColor={colors.onPrimary} // Changed to onPrimary color from theme
          >
            Suggest Challenge
          </Button>
        </View>
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderChallengeItem}
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
                {challenges.length}{" "}
                {challenges.length === 1 ? "Challenge" : "Challenges"}
              </Text>
              <Button
                mode="outlined"
                onPress={() => parentNavigation?.navigate("CreateChallenge")}
                icon="plus"
                style={styles.createChallengeButton}
                textColor={colors.primary}
                buttonColor="#FFFFFF"
              >
                Create
              </Button>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    ...shadows.small,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  searchBar: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
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
  createChallengeButton: {
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  challengeItem: {
    marginBottom: spacing.md,
  },
  challengeCard: {
    ...shadows.small,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  cardContent: {
    padding: spacing.lg,
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  creatorAvatar: {
    marginRight: spacing.sm,
  },
  challengeInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  challengeTitle: {
    ...typography.h6,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  creatorName: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  participatingChip: {
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
    borderWidth: 1,
  },
  challengeDescription: {
    marginBottom: spacing.md,
    color: colors.onSurface,
    lineHeight: 20,
  },
  challengeMeta: {
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
  difficultyMeta: {
    minWidth: 80,
  },
  metaText: {
    ...typography.body2,
    marginLeft: spacing.xs,
    color: colors.onSurfaceVariant,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: spacing.sm,
  },
  tagChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceVariant,
  },
  statusContainer: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  statusChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 6,
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
  createButton: {
    marginTop: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
});

export default ChallengesScreen;
