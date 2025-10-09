import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
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
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../constants/theme";
import { SearchScreenProps } from "../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import FeedService from "../services/FeedService";
import { useAuth } from "../contexts/AuthContext";

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<
    "all" | "projects" | "challenges" | "squads" | "users"
  >("all");
  const [sortBy, setSortBy] = useState<"relevance" | "popular" | "newest">(
    "relevance"
  );

  // Initialize service with auth token
  useEffect(() => {
    if (accessToken) {
      FeedService.setAuthToken(accessToken);
    }
  }, [accessToken]);

  // Perform search when query or filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchType, sortBy]);

  // Perform search
  const performSearch = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the API
      // For now, we'll simulate with mock data
      const mockResults = [
        {
          id: "1",
          type: "project",
          title: "Arduino Weather Station",
          description:
            "A complete weather monitoring system built with Arduino and sensors",
          creator: {
            display_name: "TechEnthusiast",
            avatar_url: "https://via.placeholder.com/40",
          },
          thumbnail_url: "https://via.placeholder.com/100",
          tags: ["arduino", "electronics", "weather"],
          likes: 124,
          views: 456,
        },
        {
          id: "2",
          type: "challenge",
          title: "30-Day Drawing Challenge",
          description:
            "Improve your drawing skills with daily prompts for 30 days",
          creator: {
            display_name: "ArtMaster",
            avatar_url: "https://via.placeholder.com/40",
          },
          participants: 1245,
          points: 100,
          status: "active",
        },
        {
          id: "3",
          type: "squad",
          name: "Woodworking Wizards",
          description: "A community for woodworkers of all skill levels",
          member_count: 892,
          avatar_url: "https://via.placeholder.com/40",
          tags: ["woodworking", "crafts", "diy"],
        },
        {
          id: "4",
          type: "user",
          display_name: "GardenGuru",
          bio: "Passionate gardener sharing tips and tricks for all skill levels",
          avatar_url: "https://via.placeholder.com/40",
          followers: 2341,
          projects_count: 15,
        },
      ];

      setSearchResults(mockResults);
    } catch (err) {
      console.log("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Render search result item
  const renderSearchResult = ({ item }: { item: any }) => {
    switch (item.type) {
      case "project":
        return (
          <Card
            style={[
              styles.resultCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() =>
              navigation.navigate("ProjectDetails", { projectId: item.id })
            }
          >
            <Card.Content style={styles.resultContent}>
              <Avatar.Image
                size={50}
                source={{ uri: item.thumbnail_url }}
                style={styles.resultAvatar}
              />
              <View style={styles.resultInfo}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.resultTitle,
                    { color: theme.colors.onBackground },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.resultDescription,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <View style={styles.resultMeta}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.resultMetaText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    by {item.creator.display_name}
                  </Text>
                  <View style={styles.resultTags}>
                    {item.tags.slice(0, 2).map((tag: string, index: number) => (
                      <Chip key={index} compact style={styles.resultTag}>
                        {tag}
                      </Chip>
                    ))}
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        );

      case "challenge":
        return (
          <Card
            style={[
              styles.resultCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() =>
              navigation.navigate("ChallengeDetails", { challengeId: item.id })
            }
          >
            <Card.Content style={styles.resultContent}>
              <Avatar.Icon
                size={50}
                icon="trophy"
                style={[
                  styles.resultAvatar,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              />
              <View style={styles.resultInfo}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.resultTitle,
                    { color: theme.colors.onBackground },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.resultDescription,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <View style={styles.resultMeta}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.resultMetaText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {item.participants} participants • {item.points} pts
                  </Text>
                  <Chip
                    compact
                    style={[
                      styles.statusChip,
                      item.status === "active" && styles.activeChip,
                    ]}
                  >
                    {item.status}
                  </Chip>
                </View>
              </View>
            </Card.Content>
          </Card>
        );

      case "squad":
        return (
          <Card
            style={[
              styles.resultCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() =>
              navigation.navigate("SquadDetails", { squadId: item.id })
            }
          >
            <Card.Content style={styles.resultContent}>
              <Avatar.Image
                size={50}
                source={{ uri: item.avatar_url }}
                style={styles.resultAvatar}
              />
              <View style={styles.resultInfo}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.resultTitle,
                    { color: theme.colors.onBackground },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.resultDescription,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <View style={styles.resultMeta}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.resultMetaText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {item.member_count} members
                  </Text>
                  <View style={styles.resultTags}>
                    {item.tags.slice(0, 2).map((tag: string, index: number) => (
                      <Chip key={index} compact style={styles.resultTag}>
                        {tag}
                      </Chip>
                    ))}
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        );

      case "user":
        return (
          <Card
            style={[
              styles.resultCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() =>
              navigation.navigate("UserProfile", { userId: item.id })
            }
          >
            <Card.Content style={styles.resultContent}>
              <Avatar.Image
                size={50}
                source={{ uri: item.avatar_url }}
                style={styles.resultAvatar}
              />
              <View style={styles.resultInfo}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.resultTitle,
                    { color: theme.colors.onBackground },
                  ]}
                >
                  {item.display_name}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.resultDescription,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={2}
                >
                  {item.bio}
                </Text>
                <View style={styles.resultMeta}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.resultMetaText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {item.followers} followers • {item.projects_count} projects
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Search Header */}
      <View
        style={[styles.searchHeader, { backgroundColor: theme.colors.surface }]}
      >
        <Searchbar
          placeholder="Search projects, challenges, squads, users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <Chip
              mode={searchType === "all" ? "flat" : "outlined"}
              selected={searchType === "all"}
              onPress={() => setSearchType("all")}
              style={[
                styles.filterChip,
                searchType === "all" && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              textStyle={
                searchType === "all"
                  ? { color: "white" }
                  : { color: theme.colors.onSurface }
              }
            >
              All
            </Chip>
            <Chip
              mode={searchType === "projects" ? "flat" : "outlined"}
              selected={searchType === "projects"}
              onPress={() => setSearchType("projects")}
              style={[
                styles.filterChip,
                searchType === "projects" && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              textStyle={
                searchType === "projects"
                  ? { color: "white" }
                  : { color: theme.colors.onSurface }
              }
            >
              Projects
            </Chip>
            <Chip
              mode={searchType === "challenges" ? "flat" : "outlined"}
              selected={searchType === "challenges"}
              onPress={() => setSearchType("challenges")}
              style={[
                styles.filterChip,
                searchType === "challenges" && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              textStyle={
                searchType === "challenges"
                  ? { color: "white" }
                  : { color: theme.colors.onSurface }
              }
            >
              Challenges
            </Chip>
            <Chip
              mode={searchType === "squads" ? "flat" : "outlined"}
              selected={searchType === "squads"}
              onPress={() => setSearchType("squads")}
              style={[
                styles.filterChip,
                searchType === "squads" && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              textStyle={
                searchType === "squads"
                  ? { color: "white" }
                  : { color: theme.colors.onSurface }
              }
            >
              Squads
            </Chip>
            <Chip
              mode={searchType === "users" ? "flat" : "outlined"}
              selected={searchType === "users"}
              onPress={() => setSearchType("users")}
              style={[
                styles.filterChip,
                searchType === "users" && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              textStyle={
                searchType === "users"
                  ? { color: "white" }
                  : { color: theme.colors.onSurface }
              }
            >
              Users
            </Chip>
          </ScrollView>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              // In a real implementation, this would show a sort options modal
            }}
          >
            <MaterialIcons
              name="sort"
              size={20}
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Divider />

      {/* Search Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyLarge"
            style={{
              marginTop: spacing.md,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Searching...
          </Text>
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsContainer}
        />
      ) : searchQuery.trim() ? (
        <View style={styles.centered}>
          <MaterialIcons
            name="search-off"
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="headlineSmall"
            style={{ marginTop: spacing.md, color: theme.colors.onBackground }}
          >
            No Results Found
          </Text>
          <Text
            variant="bodyLarge"
            style={{
              marginTop: spacing.sm,
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <View style={styles.centered}>
          <MaterialIcons
            name="search"
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="headlineSmall"
            style={{ marginTop: spacing.md, color: theme.colors.onBackground }}
          >
            Discover Hobbyverse
          </Text>
          <Text
            variant="bodyLarge"
            style={{
              marginTop: spacing.sm,
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Search for projects, challenges, squads, and users
          </Text>
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
    padding: spacing.lg,
  },
  searchHeader: {
    padding: spacing.md,
    elevation: 2,
  },
  searchBar: {
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  sortButton: {
    padding: spacing.sm,
  },
  resultsContainer: {
    padding: spacing.md,
  },
  resultCard: {
    marginBottom: spacing.md,
    elevation: 1,
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultAvatar: {
    marginRight: spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    ...typography.h6,
    marginBottom: spacing.xs,
  },
  resultDescription: {
    marginBottom: spacing.sm,
    ...typography.body1,
  },
  resultMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultMetaText: {
    ...typography.body2,
  },
  resultTags: {
    flexDirection: "row",
  },
  resultTag: {
    marginLeft: spacing.xs,
  },
  statusChip: {
    backgroundColor: "#e0e0e0",
  },
  activeChip: {
    backgroundColor: "#c8e6c9",
  },
});

export default SearchScreen;
