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

  // Mock leaderboard data
  const mockLeaderboard = [
    {
      id: "1",
      rank: 1,
      user: {
        display_name: "HobbyMaster",
        avatar_url: "https://via.placeholder.com/50",
        level: 42,
      },
      points: 12500,
      change: 5,
    },
    {
      id: "2",
      rank: 2,
      user: {
        display_name: "CraftKing",
        avatar_url: "https://via.placeholder.com/50",
        level: 38,
      },
      points: 11200,
      change: -2,
    },
    {
      id: "3",
      rank: 3,
      user: {
        display_name: "ArtQueen",
        avatar_url: "https://via.placeholder.com/50",
        level: 35,
      },
      points: 9800,
      change: 1,
    },
    {
      id: "4",
      rank: 4,
      user: {
        display_name: "TechGuru",
        avatar_url: "https://via.placeholder.com/50",
        level: 32,
      },
      points: 8900,
      change: 3,
    },
    {
      id: "5",
      rank: 5,
      user: {
        display_name: "GardenPro",
        avatar_url: "https://via.placeholder.com/50",
        level: 29,
      },
      points: 7600,
      change: -1,
    },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Simulate API call with mock data
      setTimeout(() => {
        setLeaderboard(mockLeaderboard);
        setLoading(false);
      }, 1000);
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
      onPress={() =>
        navigation.navigate("UserProfile", { userId: item.user.id })
      }
    >
      <View style={styles.rankContainer}>
        <Text variant="titleLarge" style={styles.rankText}>
          {item.rank}
        </Text>
      </View>

      <Avatar.Image
        size={50}
        source={{ uri: item.user.avatar_url }}
        style={styles.avatar}
      />

      <View style={styles.userInfo}>
        <Text variant="titleMedium" style={styles.displayName}>
          {item.user.display_name}
        </Text>
        <View style={styles.levelContainer}>
          <MaterialIcons name="star" size={16} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.levelText}>
            Level {item.user.level}
          </Text>
        </View>
      </View>

      <View style={styles.pointsContainer}>
        <Text variant="titleMedium" style={styles.pointsText}>
          {item.points.toLocaleString()}
        </Text>
        <View style={styles.changeContainer}>
          {item.change > 0 ? (
            <MaterialIcons
              name="arrow-upward"
              size={16}
              color={theme.colors.success}
            />
          ) : item.change < 0 ? (
            <MaterialIcons
              name="arrow-downward"
              size={16}
              color={theme.colors.error}
            />
          ) : null}
          <Text
            variant="bodyMedium"
            style={[
              styles.changeText,
              item.change > 0
                ? { color: theme.colors.success }
                : item.change < 0
                ? { color: theme.colors.error }
                : { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {item.change !== 0 ? Math.abs(item.change) : ""}
          </Text>
        </View>
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
        keyExtractor={(item) => item.id}
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
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  changeText: {
    ...typography.caption,
    fontWeight: "600",
  },
  changeValue: {
    ...typography.caption,
    fontWeight: "600",
  },
  divider: {
    marginVertical: spacing.sm,
  },
});

export default LeaderboardScreen;
