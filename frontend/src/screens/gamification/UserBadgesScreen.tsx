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
import { UserBadgesScreenProps } from "../../types/navigation";
import BadgeService from "../../services/BadgeService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const UserBadgesScreen: React.FC<UserBadgesScreenProps> = ({
  route,
  navigation,
}) => {
  const { userId } = route.params;
  const { accessToken, user: currentUser } = useAuth();

  const [badges, setBadges] = useState<any[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const rarityOptions = ["common", "rare", "epic", "legendary"];
  const isOwnProfile = currentUser?.id === userId;

  // Initialize service with auth token
  useEffect(() => {
    BadgeService.setAuthToken(accessToken);
    fetchUserBadges();
  }, [userId, accessToken]);

  const fetchUserBadges = async () => {
    try {
      setLoading(true);
      const response = await BadgeService.getUserBadges(userId);
      if (response.success) {
        setBadges(response.data || []);
        setFilteredBadges(response.data || []);
      } else {
        setError(response.error || "Failed to load badges");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load badges");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserBadges();
    setRefreshing(false);
  };

  // Filter badges based on search query and rarity filter
  useEffect(() => {
    let filtered = badges;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (badge) =>
          badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          badge.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply rarity filter
    if (rarityFilter) {
      filtered = filtered.filter((badge) => badge.rarity === rarityFilter);
    }

    setFilteredBadges(filtered);
  }, [searchQuery, rarityFilter, badges]);

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

  const clearFilters = () => {
    setSearchQuery("");
    setRarityFilter(null);
  };

  const renderBadgeItem = ({ item }: { item: any }) => (
    <View style={styles.badgeItem}>
      <Avatar.Image
        size={60}
        source={{
          uri: item.icon_url || "https://via.placeholder.com/60",
        }}
        style={styles.badgeIcon}
      />
      <View style={styles.badgeInfo}>
        <Text variant="titleMedium" numberOfLines={1} style={styles.badgeName}>
          {item.name}
        </Text>
        <Text
          variant="bodySmall"
          numberOfLines={2}
          style={styles.badgeDescription}
        >
          {item.description}
        </Text>
        <View style={styles.badgeMeta}>
          <Chip
            compact
            style={[
              styles.rarityChip,
              { backgroundColor: getRarityColor(item.rarity) + "20" },
            ]}
          >
            <Text style={{ color: getRarityColor(item.rarity) }}>
              {item.rarity}
            </Text>
          </Chip>
          <Text variant="bodySmall" style={styles.earnedDate}>
            Earned on {new Date(item.earned_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating size="small" color={colors.primary} />
      </View>
    );
  };

  if (loading && badges.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {isOwnProfile ? "Your Badges" : "User Badges"}
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {filteredBadges.length} badge{filteredBadges.length === 1 ? "" : "s"}{" "}
          earned
        </Text>
      </View>

      <Divider />

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search badges..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterRow}>
          <FlatList
            horizontal
            data={rarityOptions}
            renderItem={({ item }) => (
              <Chip
                key={item}
                selected={rarityFilter === item}
                onPress={() =>
                  setRarityFilter(rarityFilter === item ? null : item)
                }
                style={[
                  styles.filterChip,
                  rarityFilter === item && {
                    backgroundColor: getRarityColor(item) + "20",
                    borderColor: getRarityColor(item),
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      rarityFilter === item
                        ? getRarityColor(item)
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

          {(rarityFilter || searchQuery) && (
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

      {/* Badges List */}
      {filteredBadges.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="emoji-events"
            size={64}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No badges found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || rarityFilter
              ? "Try adjusting your filters"
              : isOwnProfile
              ? "Start participating to earn badges!"
              : "This user hasn't earned any badges yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBadges}
          renderItem={renderBadgeItem}
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
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  badgeIcon: {
    marginRight: spacing.md,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    ...typography.h6,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  badgeDescription: {
    ...typography.body2,
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
  earnedDate: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
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

export default UserBadgesScreen;
