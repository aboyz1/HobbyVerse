import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Searchbar,
  Chip,
  Card,
  Avatar,
  Button,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { spacing, colors } from "../../constants/theme";
import { SquadDiscoveryScreenProps } from "../../types/navigation";
import SquadService from "../../services/SquadService";
import { useAuth } from "../../contexts/AuthContext";
import { Squad } from "../../types/squad";

const SquadDiscoveryScreen: React.FC<SquadDiscoveryScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize squad service with auth token
  useEffect(() => {
    SquadService.setAuthToken(accessToken);
  }, [accessToken]);

  // Fetch squads
  const fetchSquads = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        if (!refresh) setLoading(true);
        setHasMore(true);
      }

      // Debug: Log the request parameters
      console.log("Fetching squads with params:", {
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page: pageNum,
        limit: 10,
        accessToken: accessToken ? "present" : "missing",
      });

      const response = await SquadService.getSquads({
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page: pageNum,
        limit: 10,
      });

      // Debug: Log the response
      console.log("SquadService response:", response);

      if (response.success) {
        // Fix: Access the data correctly - response.data is a PaginatedResponse
        const paginatedData = response.data as any;
        const newSquads = Array.isArray(paginatedData)
          ? paginatedData
          : paginatedData?.data || [];

        // Debug: Log the squads data
        console.log("Fetched squads:", newSquads);

        if (pageNum === 1) {
          setSquads(newSquads);
        } else {
          setSquads((prev) => [...prev, ...newSquads]);
        }

        // Fix: Correctly access the length and forEach methods
        const squadsArray = Array.isArray(newSquads) ? newSquads : [];
        setHasMore(squadsArray.length === 10);
        setPage(pageNum);

        // Collect all unique tags
        const tags = new Set<string>();
        squadsArray.forEach((squad: any) => {
          if (squad.tags && Array.isArray(squad.tags)) {
            squad.tags.forEach((tag: any) => {
              if (typeof tag === "string") {
                tags.add(tag);
              }
            });
          }
        });
        setAllTags(Array.from(tags));
      } else {
        setError(response.error || "Failed to load squads");
        if (pageNum === 1) setSquads([]);
      }
    } catch (err: any) {
      console.error("Error fetching squads:", err);
      setError(err.message || "An error occurred while fetching squads");
      if (pageNum === 1) setSquads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh squads
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSquads(1, true);
  }, []);

  // Load more squads
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchSquads(page + 1);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  // Fetch squads when filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSquads(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedTags]);

  // Fetch squads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSquads(1);
    }, [])
  );

  // Render squad item
  const renderSquadItem = ({ item }: { item: Squad }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("SquadDetails", { squadId: item.id })}
    >
      <Card style={styles.squadCard}>
        <Card.Content>
          <View style={styles.squadHeader}>
            {item.avatar_url ? (
              <Avatar.Image size={40} source={{ uri: item.avatar_url }} />
            ) : (
              <Avatar.Icon size={40} icon="account-group" />
            )}

            <View style={styles.squadInfo}>
              <Text
                variant="titleMedium"
                numberOfLines={1}
                style={{ color: theme.colors.onSurface }}
              >
                {item.name}
              </Text>
              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {item.member_count} members
              </Text>
            </View>

            <View style={styles.privacyBadge}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onPrimary }}
              >
                {item.privacy.charAt(0).toUpperCase() + item.privacy.slice(1)}
              </Text>
            </View>
          </View>

          {item.description ? (
            <Text
              variant="bodyMedium"
              numberOfLines={2}
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: spacing.sm,
              }}
            >
              {item.description}
            </Text>
          ) : null}

          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} mode="outlined" compact style={styles.tagChip}>
                {tag}
              </Chip>
            ))}
            {item.tags.length > 3 && (
              <Chip mode="outlined" compact style={styles.tagChip}>
                +{item.tags.length - 3}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  // Render loading state
  if (loading && squads.length === 0) {
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
            Loading squads...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search squads..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterRow}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, marginRight: spacing.sm }}
          >
            Filter by:
          </Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={allTags}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              mode="outlined"
              selected={selectedTags.includes(item)}
              onPress={() => toggleTag(item)}
              style={styles.filterChip}
            >
              {item}
            </Chip>
          )}
          contentContainerStyle={styles.tagsList}
        />
      </View>

      <Divider />

      {/* Squad List */}
      {squads.length > 0 ? (
        <FlatList
          data={squads}
          renderItem={renderSquadItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Avatar.Icon
            size={64}
            icon="account-group"
            style={{ backgroundColor: theme.colors.surface }}
          />
          <Text
            variant="headlineSmall"
            style={{
              color: theme.colors.onSurface,
              marginTop: spacing.lg,
              textAlign: "center",
            }}
          >
            No squads found
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: spacing.sm,
            }}
          >
            Try adjusting your search or filters
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("CreateSquad")}
            style={{ marginTop: spacing.xl }}
          >
            Create Your First Squad
          </Button>
        </View>
      )}
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
  searchContainer: {
    padding: spacing.md,
    paddingTop: spacing.xs,
  },
  searchBar: {
    marginBottom: spacing.sm,
    backgroundColor: colors.cardBackground,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  tagsList: {
    paddingVertical: spacing.xs,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  squadCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
  },
  squadHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  squadInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  privacyBadge: {
    backgroundColor: "#6200ee",
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  tagChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: "center",
  },
});

export default SquadDiscoveryScreen;
