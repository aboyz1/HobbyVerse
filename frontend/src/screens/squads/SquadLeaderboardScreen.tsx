import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import {
  Text,
  Searchbar,
  Avatar,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, colors } from "../../constants/theme";
import { SquadLeaderboardScreenProps } from "../../types/navigation";
import LeaderboardService from "../../services/LeaderboardService";
import SquadService from "../../services/SquadService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const SquadLeaderboardScreen: React.FC<SquadLeaderboardScreenProps> = ({
  route,
  navigation,
}) => {
  const { squadId } = route.params;
  const { accessToken } = useAuth();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState<
    "week" | "month" | "year" | "all"
  >("all");
  const [error, setError] = useState<string | null>(null);
  const [squad, setSquad] = useState<any>(null);

  const timeframeOptions = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
  ];

  // Initialize services with auth token
  useEffect(() => {
    LeaderboardService.setAuthToken(accessToken);
    SquadService.setAuthToken(accessToken);
    fetchSquadDetails();
    fetchLeaderboard();
  }, [squadId, accessToken]);

  const fetchSquadDetails = async () => {
    try {
      const response = await SquadService.getSquadById(squadId);
      if (response.success) {
        setSquad(response.data);
      }
    } catch (err: any) {
      console.log("Error fetching squad details:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await LeaderboardService.getSquadLeaderboard(squadId, {
        timeframe: timeframeFilter,
      });
      if (response.success) {
        setLeaderboard(response.data || []);
      } else {
        setError(response.error || "Failed to load leaderboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  // Refresh leaderboard when timeframe filter changes
  useEffect(() => {
    fetchLeaderboard();
  }, [timeframeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTimeframeFilter("all");
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "emoji-events";
      case 2:
        return "looks-two";
      case 3:
        return "looks-3";
      default:
        return "military-tech";
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#FFD700"; // Gold
      case 2:
        return "#C0C0C0"; // Silver
      case 3:
        return "#CD7F32"; // Bronze
      default:
        return colors.onSurfaceVariant;
    }
  };

  const renderLeaderboardItem = ({ item }: { item: any }) => {
    // Filter by search query if needed
    if (
      searchQuery &&
      !item.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return null;
    }

    return (
      <View style={styles.leaderboardItem}>
        <View style={styles.rankContainer}>
          {item.rank <= 3 ? (
            <MaterialIcons
              name={getRankIcon(item.rank)}
              size={24}
              color={getRankColor(item.rank)}
            />
          ) : (
            <Text variant="titleMedium" style={styles.rankText}>
              {item.rank}
            </Text>
          )}
        </View>
        <Avatar.Image
          size={48}
          source={{
            uri: item.avatar_url || "https://via.placeholder.com/48",
          }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text variant="titleMedium" numberOfLines={1} style={styles.userName}>
            {item.display_name}
          </Text>
          <View style={styles.userStats}>
            <Text variant="bodySmall" style={styles.statText}>
              {item.contribution_points || 0} points
            </Text>
            <Text variant="bodySmall" style={styles.statText}>
              {item.activities_count || 0} activities
            </Text>
          </View>
        </View>
      </View>
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

  if (loading && leaderboard.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {squad?.name || "Squad Leaderboard"}
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Top contributors in the squad
        </Text>
      </View>

      <Divider />

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search members..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterRow}>
          <FlatList
            horizontal
            data={timeframeOptions}
            renderItem={({ item }) => (
              <Chip
                key={item.value}
                selected={timeframeFilter === item.value}
                onPress={() =>
                  setTimeframeFilter(
                    timeframeFilter === item.value ? "all" : (item.value as any)
                  )
                }
                style={[
                  styles.filterChip,
                  timeframeFilter === item.value && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      timeframeFilter === item.value
                        ? colors.primary
                        : colors.onSurfaceVariant,
                  }}
                >
                  {item.label}
                </Text>
              </Chip>
            )}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          />

          {(timeframeFilter !== "all" || searchQuery) && (
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

      {/* Leaderboard List */}
      {leaderboard.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="leaderboard"
            size={64}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No leaderboard data</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Try adjusting your search"
              : "No activity data available for this squad"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
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
          ListFooterComponent={renderFooter}
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
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
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
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  rankContainer: {
    width: 30,
    alignItems: "center",
    marginRight: spacing.md,
  },
  rankText: {
    ...typography.h6,
    color: colors.onSurface,
  },
  userAvatar: {
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h6,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  userStats: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statText: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    marginRight: spacing.md,
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

export default SquadLeaderboardScreen;
