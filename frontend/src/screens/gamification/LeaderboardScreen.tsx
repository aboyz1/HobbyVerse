import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Avatar,
  Card,
  Chip,
  IconButton,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../../constants/theme";
import { LeaderboardScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import GamificationService from "../../services/GamificationService";

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme() as typeof import("../../constants/theme").theme;
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"global" | "weekly" | "monthly">(
    "global"
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await GamificationService.getLeaderboard(filter, 50);

      if (response.success) {
        // Handle the response structure properly
        const leaderboardData =
          (response as any).leaderboard || response.data || [];
        const dataArray = Array.isArray(leaderboardData) ? leaderboardData : [];

        // Log the data structure for debugging
        console.log("Leaderboard data structure:", dataArray);

        setLeaderboard(dataArray);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const renderLeaderboardItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.leaderboardItem}
      onPress={() => {
        // Debug log to see what item data we have
        console.log("Navigating to user profile with item:", item);
        if (item.id) {
          navigation.navigate("UserProfile", { userId: item.id });
        } else {
          console.log(
            "User ID not found in item. Available properties:",
            Object.keys(item)
          );
        }
      }}
    >
      <View style={styles.rankContainer}>
        <Text variant="titleLarge" style={styles.rankText}>
          {item.rank || 0}.
        </Text>
      </View>

      <Avatar.Image
        size={50}
        source={{ uri: item.avatar_url || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />

      <View style={styles.userInfo}>
        <Text variant="titleMedium" style={styles.displayName}>
          {item.display_name || "Unknown User"}
        </Text>
        <View style={styles.levelContainer}>
          <MaterialIcons name="star" size={16} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.levelText}>
            Level {item.level || 1}
          </Text>
        </View>
      </View>

      <View style={styles.pointsContainer}>
        <Text variant="titleMedium" style={styles.pointsText}>
          {(item.total_points || 0).toLocaleString()}
        </Text>
        {/* Remove change container as it's not in the API response */}
      </View>
    </TouchableOpacity>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        mode="outlined"
        selected={filter === "global"}
        onPress={() => setFilter("global")}
        style={styles.filterChip}
      >
        Global
      </Chip>
      <Chip
        mode="outlined"
        selected={filter === "weekly"}
        onPress={() => setFilter("weekly")}
        style={styles.filterChip}
      >
        Weekly
      </Chip>
      <Chip
        mode="outlined"
        selected={filter === "monthly"}
        onPress={() => setFilter("monthly")}
        style={styles.filterChip}
      >
        Monthly
      </Chip>
    </View>
  );

  if (loading && leaderboard.length === 0) {
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
            Loading leaderboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          Leaderboard
        </Text>
        {renderFilterChips()}
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="info"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurface,
                    marginLeft: spacing.sm,
                  }}
                >
                  Rankings update every hour. Points are earned through
                  activities.
                </Text>
              </View>
            </Card.Content>
          </Card>
        }
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: spacing.lg,
    backgroundColor: "#f8f8f8",
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  filterChip: {
    marginHorizontal: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
    backgroundColor: "#e3f2fd",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankText: {
    fontWeight: "bold",
  },
  avatar: {
    marginHorizontal: spacing.sm,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  displayName: {
    ...typography.h6,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  levelText: {
    ...typography.caption,
    color: "#666",
    marginLeft: spacing.xs,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsText: {
    ...typography.h6,
  },
  divider: {
    marginVertical: spacing.sm,
  },
});

export default LeaderboardScreen;
