import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
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
import { BadgeDetailsScreenProps } from "../../types/navigation";
import BadgeService from "../../services/BadgeService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const BadgeDetailsScreen: React.FC<BadgeDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { badgeId } = route.params;
  const { accessToken } = useAuth();

  const [badge, setBadge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service with auth token
  useEffect(() => {
    BadgeService.setAuthToken(accessToken);
    fetchBadgeDetails();
  }, [badgeId, accessToken]);

  const fetchBadgeDetails = async () => {
    try {
      setLoading(true);
      const response = await BadgeService.getBadgeById(badgeId);
      if (response.success) {
        setBadge(response.data);
      } else {
        setError(response.error || "Failed to load badge details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load badge details");
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "#4CAF50";
      case "rare":
        return "#2196F3";
      case "epic":
        return "#9C27B0";
      case "legendary":
        return "#FF9800";
      default:
        return colors.onSurfaceVariant;
    }
  };

  const renderEarnerItem = ({ item }: { item: any }) => (
    <Card style={styles.earnerCard}>
      <Card.Content style={styles.earnerContent}>
        <Avatar.Image
          size={40}
          source={{
            uri: item.avatar_url || "https://via.placeholder.com/40",
          }}
          style={styles.earnerAvatar}
        />
        <View style={styles.earnerInfo}>
          <Text variant="titleMedium">{item.display_name}</Text>
          <Text variant="bodySmall" style={styles.earnedDate}>
            Earned on {new Date(item.earned_at).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading badge details...</Text>
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
            onPress={fetchBadgeDetails}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!badge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="info"
            size={48}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.errorText}>Badge not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Badge Header */}
        <View style={styles.header}>
          <Avatar.Image
            size={80}
            source={{
              uri: badge.icon_url || "https://via.placeholder.com/80",
            }}
            style={styles.badgeIcon}
          />
          <View style={styles.badgeInfo}>
            <Text variant="headlineSmall" style={styles.badgeName}>
              {badge.name}
            </Text>
            <Text variant="bodyMedium" style={styles.badgeDescription}>
              {badge.description}
            </Text>
            <View style={styles.badgeMeta}>
              <Chip
                compact
                style={[
                  styles.rarityChip,
                  { backgroundColor: getRarityColor(badge.rarity) + "20" },
                ]}
              >
                <Text style={{ color: getRarityColor(badge.rarity) }}>
                  {badge.rarity}
                </Text>
              </Chip>
              <Text variant="bodySmall" style={styles.earnedCount}>
                Earned by {badge.earned_count || 0} users
              </Text>
            </View>
          </View>
        </View>

        <Divider />

        {/* Recent Earners */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent Earners
            </Text>
            {badge.recent_earners && badge.recent_earners.length > 0 ? (
              <FlatList
                data={badge.recent_earners}
                renderItem={renderEarnerItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.earnersList}
              />
            ) : (
              <Text variant="bodyMedium" style={styles.noEarnersText}>
                No one has earned this badge yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Badge Criteria */}
        {badge.criteria && (
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                How to Earn
              </Text>
              <Text variant="bodyMedium" style={styles.criteriaText}>
                {badge.criteria}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Your Progress */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Progress
            </Text>
            <View style={styles.progressContainer}>
              <MaterialIcons
                name={
                  badge.user_has_earned ? "check-circle" : "hourglass-empty"
                }
                size={24}
                color={badge.user_has_earned ? colors.success : colors.warning}
              />
              <Text variant="bodyMedium" style={styles.progressText}>
                {badge.user_has_earned
                  ? "You've earned this badge!"
                  : "You haven't earned this badge yet"}
              </Text>
            </View>
            {!badge.user_has_earned && badge.progress && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${badge.progress.percentage}%` },
                    ]}
                  />
                </View>
                <Text variant="bodySmall" style={styles.progressPercentage}>
                  {Math.round(badge.progress.percentage)}% complete
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
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
    flexDirection: "row",
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  badgeIcon: {
    marginRight: spacing.lg,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    ...typography.h5,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  badgeDescription: {
    ...typography.body1,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  badgeMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  rarityChip: {
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
  },
  earnedCount: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
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
  earnersList: {
    marginTop: spacing.sm,
  },
  earnerCard: {
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  earnerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  earnerAvatar: {
    marginRight: spacing.md,
  },
  earnerInfo: {
    flex: 1,
  },
  earnedDate: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  noEarnersText: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    padding: spacing.lg,
  },
  criteriaText: {
    color: colors.onSurface,
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  progressText: {
    marginLeft: spacing.sm,
    color: colors.onSurface,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressPercentage: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
});

export default BadgeDetailsScreen;
