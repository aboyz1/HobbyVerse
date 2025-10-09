import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Avatar,
  Chip,
  IconButton,
  ActivityIndicator,
  Button,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import GamificationService from "../../services/GamificationService";
import { useAuth } from "../../contexts/AuthContext";
import { GamificationDashboardScreenProps } from "../../types/navigation";
import { useAppNavigation } from "../../hooks/useNavigation";

const GamificationDashboardScreen: React.FC<
  GamificationDashboardScreenProps
> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const appNavigation = useAppNavigation();
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockStats = {
    totalPoints: 2450,
    level: 12,
    nextLevelPoints: 3000,
    currentLevelPoints: 2000,
    badgesCount: 8,
    rank: 15,
  };

  const mockBadges = [
    {
      id: "1",
      name: "First Post",
      icon: "edit",
      earned: true,
      rarity: "common",
    },
    {
      id: "2",
      name: "Helpful User",
      icon: "thumb-up",
      earned: true,
      rarity: "common",
    },
    {
      id: "3",
      name: "Project Enthusiast",
      icon: "folder",
      earned: true,
      rarity: "uncommon",
    },
    {
      id: "4",
      name: "Challenge Master",
      icon: "trophy",
      earned: false,
      rarity: "rare",
    },
  ];

  const mockLeaderboard = [
    {
      id: "1",
      rank: 1,
      user: {
        display_name: "HobbyMaster",
        avatar_url: "https://via.placeholder.com/40",
      },
      points: 12500,
    },
    {
      id: "2",
      rank: 2,
      user: {
        display_name: "CraftKing",
        avatar_url: "https://via.placeholder.com/40",
      },
      points: 11200,
    },
    {
      id: "3",
      rank: 3,
      user: {
        display_name: "ArtQueen",
        avatar_url: "https://via.placeholder.com/40",
      },
      points: 9800,
    },
  ];

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      // In a real app, we would call the API:
      // const statsResponse = await GamificationService.getUserStats();
      // const badgesResponse = await GamificationService.getUserBadges();
      // const leaderboardResponse = await GamificationService.getLeaderboard();

      // Simulate API calls with mock data
      setTimeout(() => {
        setStats(mockStats);
        setBadges(mockBadges);
        setLeaderboard(mockLeaderboard);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error fetching gamification data:", err);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGamificationData();
    setRefreshing(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "#B0BEC5";
      case "uncommon":
        return "#81C784";
      case "rare":
        return "#4FC3F7";
      case "epic":
        return "#AB47BC";
      default:
        return theme.colors.onSurface;
    }
  };

  const renderProgressCard = () => {
    if (!stats) return null;

    const progress =
      ((stats.totalPoints - stats.currentLevelPoints) /
        (stats.nextLevelPoints - stats.currentLevelPoints)) *
      100;

    return (
      <Card style={styles.progressCard}>
        <Card.Content>
          <View style={styles.levelContainer}>
            <Text
              variant="headlineSmall"
              style={[styles.levelText, { color: theme.colors.onBackground }]}
            >
              Level {stats.level}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.rankText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Rank #{stats.rank}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.progressTextContainer}>
            <Text
              variant="bodyMedium"
              style={[styles.progressText, { color: theme.colors.onSurface }]}
            >
              {stats.totalPoints - stats.currentLevelPoints} /{" "}
              {stats.nextLevelPoints - stats.currentLevelPoints} pts
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.progressText, { color: theme.colors.onSurface }]}
            >
              {stats.nextLevelPoints} pts to next level
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderBadgesSection = () => (
    <Card style={styles.section}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Badges
          </Text>
          <TouchableOpacity>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgesContainer}>
          {badges.map((badge) => (
            <View
              key={badge.id}
              style={[
                styles.badgeItem,
                {
                  borderColor: badge.earned
                    ? getRarityColor(badge.rarity)
                    : theme.colors.outline,
                },
              ]}
            >
              <MaterialIcons
                name={badge.icon as any}
                size={24}
                color={
                  badge.earned
                    ? getRarityColor(badge.rarity)
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text
                variant="bodySmall"
                style={[styles.badgeName, { color: theme.colors.onSurface }]}
              >
                {badge.name}
              </Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderLeaderboardSection = () => (
    <Card style={styles.section}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Top Users
          </Text>
          <TouchableOpacity>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              View Full Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {leaderboard.map((entry) => (
          <View key={entry.id} style={styles.leaderboardItem}>
            <Text
              variant="bodyMedium"
              style={[styles.rank, { color: theme.colors.onSurface }]}
            >
              {entry.rank}.
            </Text>
            <Avatar.Image
              size={32}
              source={{ uri: entry.user.avatar_url }}
              style={styles.leaderboardAvatar}
            />
            <Text
              variant="bodyMedium"
              style={[
                styles.leaderboardName,
                { color: theme.colors.onSurface },
              ]}
            >
              {entry.user.display_name}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.leaderboardPoints,
                { color: theme.colors.onSurface },
              ]}
            >
              {entry.points.toLocaleString()}
            </Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Button
        mode="outlined"
        onPress={() => appNavigation.navigate("PointsHistory")}
        style={styles.quickActionButton}
        icon="history"
      >
        Points History
      </Button>
      <Button
        mode="outlined"
        onPress={() => appNavigation.navigate("Badges")}
        style={styles.quickActionButton}
        icon="star"
      >
        All Badges
      </Button>
    </View>
  );

  if (loading && !stats) {
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
            Loading gamification data...
          </Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderProgressCard()}
        {renderBadgesSection()}
        {renderLeaderboardSection()}
        {renderQuickActions()}
      </ScrollView>
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
  progressCard: {
    margin: spacing.lg,
    elevation: 2,
  },
  levelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  levelText: {
    ...typography.h4,
  },
  rankText: {
    ...typography.body1,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    ...typography.body2,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  badgeItem: {
    alignItems: "center",
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    width: 80,
  },
  badgeName: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  rank: {
    width: 20,
  },
  leaderboardAvatar: {
    marginHorizontal: spacing.sm,
  },
  leaderboardName: {
    flex: 1,
  },
  leaderboardPoints: {
    fontWeight: "600",
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
});

export default GamificationDashboardScreen;
