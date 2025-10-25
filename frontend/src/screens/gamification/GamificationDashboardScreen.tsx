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
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography, colors } from "../../constants/theme";
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

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      // Fetch real data from the API
      const [leaderboardResponse, badgesResponse] = await Promise.all([
        GamificationService.getLeaderboard("global", 3),
        GamificationService.getUserBadges(),
      ]);

      // Process leaderboard data - the data is in leaderboard property
      if (leaderboardResponse.success) {
        // Handle the response structure properly
        const leaderboardData =
          (leaderboardResponse as any).leaderboard ||
          leaderboardResponse.data ||
          [];
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      }

      // Process badges data - the data is in badges property
      if (badgesResponse.success) {
        // Handle the response structure properly
        const badgesData =
          (badgesResponse as any).badges || badgesResponse.data || [];
        setBadges(Array.isArray(badgesData) ? badgesData : []);
      }

      // Set stats from user data
      setStats({
        totalPoints: user?.total_points || 0,
        level: user?.level || 1,
        nextLevelPoints: ((user?.level || 1) + 1) * 100,
        currentLevelPoints: (user?.level || 1) * 100,
        badgesCount: Array.isArray(
          (badgesResponse as any).badges || badgesResponse.data
        )
          ? ((badgesResponse as any).badges || badgesResponse.data).length
          : 0,
        rank: 0, // We don't have rank in this response
      });

      setLoading(false);
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
    // Use colors that match the leaderboard screen color palette
    switch (rarity) {
      case "common":
        return theme.colors.onSurfaceVariant; // Use theme color instead of custom color
      case "uncommon":
        return theme.colors.primary; // Use primary color
      case "rare":
        return theme.colors.onSurface; // Use theme color
      case "epic":
        return theme.colors.primary; // Use primary color
      default:
        return theme.colors.outline;
    }
  };

  const renderProgressCard = () => {
    if (!stats) return null;

    // Avoid division by zero
    const progress =
      stats.nextLevelPoints > stats.currentLevelPoints
        ? ((stats.totalPoints - stats.currentLevelPoints) /
            (stats.nextLevelPoints - stats.currentLevelPoints)) *
          100
        : 0;

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
              {stats.totalPoints} points
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(Math.max(progress, 0), 100)}%`,
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
              {Math.max(stats.totalPoints - stats.currentLevelPoints, 0)} /{" "}
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
          <TouchableOpacity onPress={() => appNavigation.navigate("Badges")}>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgesContainer}>
          {(badges || []).slice(0, 4).map((badge) => (
            <View
              key={badge.id}
              style={[
                styles.badgeItem,
                {
                  borderColor: badge.rarity
                    ? getRarityColor(badge.rarity)
                    : theme.colors.outline,
                },
              ]}
            >
              <MaterialIcons
                name={badge.icon || "star"} // Default icon if none provided
                size={24}
                color={
                  badge.rarity
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
          <TouchableOpacity
            onPress={() => appNavigation.navigate("Leaderboard")}
          >
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              View Full Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {(leaderboard || []).map((entry, index) => (
          <View key={entry.id}>
            <View style={styles.leaderboardItem}>
              <View style={styles.leaderboardRankContainer}>
                <Text variant="titleLarge" style={styles.leaderboardRankText}>
                  {entry.rank}.
                </Text>
              </View>

              <Avatar.Image
                size={50}
                source={{
                  uri: entry.avatar_url || "https://via.placeholder.com/50",
                }}
                style={styles.leaderboardAvatar}
              />

              <View style={styles.leaderboardUserInfo}>
                <Text
                  variant="titleMedium"
                  style={styles.leaderboardDisplayName}
                >
                  {entry.display_name || "Unknown User"}
                </Text>
                <View style={styles.leaderboardLevelContainer}>
                  <MaterialIcons
                    name="star"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="bodyMedium"
                    style={styles.leaderboardLevelText}
                  >
                    Level {entry.level || 1}
                  </Text>
                </View>
              </View>

              <View style={styles.leaderboardPointsContainer}>
                <Text
                  variant="titleMedium"
                  style={styles.leaderboardPointsText}
                >
                  {(entry.total_points || 0).toLocaleString()}
                </Text>
              </View>
            </View>
            {index < leaderboard.length - 1 && (
              <Divider style={styles.divider} />
            )}
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
        textColor={theme.colors.primary}
      >
        Points History
      </Button>
      <Button
        mode="outlined"
        onPress={() => appNavigation.navigate("Badges")}
        style={styles.quickActionButton}
        icon="star"
        textColor={theme.colors.primary}
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
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          Gamification
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
                Track your progress, earn badges, and climb the leaderboard!
              </Text>
            </View>
          </Card.Content>
        </Card>

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
  header: {
    padding: spacing.lg,
    backgroundColor: "#f8f8f8", // Same as leaderboard
  },
  title: {
    ...typography.h3,
    marginBottom: 0,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.cardBackground,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    backgroundColor: colors.cardBackground,
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
    backgroundColor: "#e3f2fd", // Use same color as info card instead of #e0e0e0
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
    backgroundColor: colors.cardBackground,
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
  // Updated leaderboard styles to match leaderboard screen
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  leaderboardRankContainer: {
    width: 40,
    alignItems: "center",
  },
  leaderboardRankText: {
    fontWeight: "bold",
  },
  leaderboardAvatar: {
    marginHorizontal: spacing.sm,
  },
  leaderboardUserInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  leaderboardDisplayName: {
    ...typography.h6,
  },
  leaderboardLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  leaderboardLevelText: {
    ...typography.caption,
    color: "#666", // Same as leaderboard
    marginLeft: spacing.xs,
  },
  leaderboardPointsContainer: {
    alignItems: "flex-end",
  },
  leaderboardPointsText: {
    ...typography.h6,
  },
  divider: {
    marginVertical: spacing.sm,
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
