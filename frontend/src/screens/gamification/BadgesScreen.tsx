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
  Card,
  Chip,
  IconButton,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../../constants/theme";
import { BadgesScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import GamificationService from "../../services/GamificationService";

const BadgesScreen: React.FC<BadgesScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "earned" | "unearned">("all");

  useEffect(() => {
    fetchBadges();
  }, [filter]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await GamificationService.getAvailableBadges();

      if (response.success) {
        // Handle the response structure properly
        let badgeData = (response as any).badges || response.data || [];
        badgeData = Array.isArray(badgeData) ? badgeData : [];

        // Apply filtering on frontend since backend doesn't support it
        if (filter === "earned") {
          // In a real app, we would filter by earned badges
          // For now, we'll just show all badges
        } else if (filter === "unearned") {
          // In a real app, we would filter by unearned badges
          // For now, we'll just show all badges
        }

        setBadges(badgeData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching badges:", err);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBadges();
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

  const renderBadgeItem = ({ item }: { item: any }) => (
    <Card
      style={[
        styles.badgeCard,
        {
          borderColor: item.rarity
            ? getRarityColor(item.rarity)
            : theme.colors.outline,
          backgroundColor: theme.colors.surface,
        },
      ]}
      onPress={() => navigation.navigate("BadgeDetails", { badgeId: item.id })}
    >
      <Card.Content style={styles.badgeContent}>
        <View style={styles.badgeIconContainer}>
          <MaterialIcons
            name={item.icon || "star"} // Default icon if none provided
            size={40}
            color={
              item.rarity
                ? getRarityColor(item.rarity)
                : theme.colors.onSurfaceVariant
            }
          />
        </View>

        <View style={styles.badgeInfo}>
          <Text
            variant="titleMedium"
            style={[styles.badgeName, { color: theme.colors.onBackground }]}
          >
            {item.name}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.badgeDescription, { color: theme.colors.onSurface }]}
          >
            {item.description}
          </Text>

          <View style={styles.badgeMeta}>
            <Chip
              compact
              style={[
                styles.rarityChip,
                {
                  backgroundColor: item.rarity
                    ? getRarityColor(item.rarity)
                    : theme.colors.outline,
                },
              ]}
            >
              <Text variant="bodySmall" style={styles.rarityText}>
                {item.rarity || "common"}
              </Text>
            </Chip>

            {item.earned_at && (
              <Text
                variant="bodySmall"
                style={[
                  styles.earnedDate,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Earned: {new Date(item.earned_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        mode="outlined"
        selected={filter === "all"}
        onPress={() => setFilter("all")}
        style={styles.filterChip}
      >
        All
      </Chip>
      <Chip
        mode="outlined"
        selected={filter === "earned"}
        onPress={() => setFilter("earned")}
        style={styles.filterChip}
      >
        Earned
      </Chip>
      <Chip
        mode="outlined"
        selected={filter === "unearned"}
        onPress={() => setFilter("unearned")}
        style={styles.filterChip}
      >
        Not Earned
      </Chip>
    </View>
  );

  if (loading && badges.length === 0) {
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
            Loading badges...
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
          Badges
        </Text>
        {renderFilterChips()}
      </View>

      <FlatList
        data={badges}
        renderItem={renderBadgeItem}
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
                  Earn badges by completing activities and challenges. Rarer
                  badges are harder to earn!
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
  badgeCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeIconContainer: {
    marginRight: spacing.lg,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    ...typography.h6,
    marginBottom: spacing.xs,
  },
  badgeDescription: {
    marginBottom: spacing.sm,
  },
  badgeMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rarityChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  rarityText: {
    color: "white",
    fontWeight: "bold",
  },
  earnedDate: {
    ...typography.caption,
  },
  divider: {
    marginVertical: spacing.sm,
  },
});

export default BadgesScreen;
