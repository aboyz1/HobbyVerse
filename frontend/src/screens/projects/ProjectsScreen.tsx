import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
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
  Button,
  IconButton,
} from "react-native-paper";
import { View as SafeAreaView } from "react-native"; // Change to View like ChallengesScreen
import { spacing, typography, colors } from "../../constants/theme";
import { ProjectsScreenProps } from "../../types/navigation";
import ProjectService from "../../services/ProjectService";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useTabNavigation } from "../../hooks/useNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Add this import

const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ navigation }) => {
  const tabNavigation = useTabNavigation();
  const parentNavigation = tabNavigation.getParent();
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const difficultyOptions = ["beginner", "intermediate", "advanced"];
  const statusOptions = ["planning", "in_progress", "completed", "on_hold"];

  const fetchProjects = async (
    pageNum: number = 1,
    refresh: boolean = false
  ) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const params: any = {
        page: pageNum,
        limit: 10,
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        difficulty: difficultyFilter || undefined,
        status: statusFilter || undefined,
      };

      const response = await ProjectService.getProjects(params);

      // Fix: Correctly access the paginated response structure
      if (pageNum === 1) {
        setProjects(response.data || []);
      } else {
        setProjects((prev) => [...prev, ...(response.data || [])]);
      }

      // Safely handle pagination data - pagination is part of the response, not response.pagination
      const pagination = (response as any).pagination || {};
      setHasMore((pagination.page || 1) < (pagination.pages || 1));
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      console.log("Error fetching projects:", err);
      // Set default values to prevent crashes
      if (pageNum === 1) {
        setProjects([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchProjects(1);
  }, []);

  const onRefresh = () => {
    fetchProjects(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProjects(page + 1);
    }
  };

  // Fetch when filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProjects(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedTags, difficultyFilter, statusFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setDifficultyFilter(null);
    setStatusFilter(null);
    setSearchQuery("");
  };

  const renderProjectItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.projectItem}
      onPress={() =>
        parentNavigation?.navigate("ProjectDetails", { projectId: item.id })
      }
    >
      <Card style={styles.projectCard}>
        <Card.Content>
          <View style={styles.projectHeader}>
            <Avatar.Image
              size={40}
              source={{
                uri: item.creator_avatar || "https://via.placeholder.com/40",
              }}
            />
            <View style={styles.projectInfo}>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.title || "Untitled Project"}
              </Text>
              <Text variant="bodySmall" style={styles.creatorName}>
                by {item.creator_name || "Unknown"}
              </Text>
            </View>
            <IconButton
              icon={item.is_liked ? "heart" : "heart-outline"}
              iconColor={item.is_liked ? colors.error : colors.onSurface}
              size={20}
              onPress={() => {}}
            />
          </View>

          <Text
            variant="bodyMedium"
            numberOfLines={2}
            style={styles.projectDescription}
          >
            {item.description || "No description available"}
          </Text>

          <View style={styles.projectMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="signal-cellular-alt"
                size={16}
                color={colors.onSurface}
              />
              <Text variant="bodySmall" style={styles.metaText}>
                {item.difficulty_level || "beginner"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="flag" size={16} color={colors.onSurface} />
              <Text variant="bodySmall" style={styles.metaText}>
                {item.status || "planning"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="favorite" size={16} color={colors.like} />
              <Text variant="bodySmall" style={styles.metaText}>
                {item.like_count || 0}
              </Text>
            </View>
          </View>

          {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag: string, index: number) => (
                <Chip key={index} compact style={styles.tagChip}>
                  {tag}
                </Chip>
              ))}
              {item.tags.length > 3 && (
                <Chip compact style={styles.tagChip}>
                  +{item.tags.length - 3}
                </Chip>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating size="small" />
      </View>
    );
  };

  if (loading && projects.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Add a safety check for projects array
  const projectCount = Array.isArray(projects) ? projects.length : 0;

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={[styles.searchContainer, { paddingTop: insets.top + spacing.lg }]}>
        <Searchbar
          placeholder="Search projects..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {difficultyOptions.map((difficulty) => (
              <Chip
                key={difficulty}
                selected={difficultyFilter === difficulty}
                onPress={() =>
                  setDifficultyFilter(
                    difficultyFilter === difficulty ? null : difficulty
                  )
                }
                style={styles.filterChip}
              >
                {difficulty}
              </Chip>
            ))}

            {statusOptions.map((status) => (
              <Chip
                key={status}
                selected={statusFilter === status}
                onPress={() =>
                  setStatusFilter(statusFilter === status ? null : status)
                }
                style={styles.filterChip}
              >
                {status.replace("_", " ")}
              </Chip>
            ))}
          </ScrollView>

          {(selectedTags.length > 0 ||
            difficultyFilter ||
            statusFilter ||
            searchQuery) && (
            <Button
              mode="text"
              onPress={clearFilters}
              style={styles.clearFiltersButton}
            >
              Clear
            </Button>
          )}
        </View>
      </View>

      {/* Projects List */}
      {projects && projects.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <MaterialIcons
            name="folder"
            size={48}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No projects found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ||
            selectedTags.length > 0 ||
            difficultyFilter ||
            statusFilter
              ? "Try adjusting your filters"
              : "Be the first to create a project!"}
          </Text>
          <Button
            mode="contained"
            onPress={() => parentNavigation?.navigate("CreateProject")}
            style={styles.createButton}
          >
            Create Project
          </Button>
        </View>
      ) : (
        <FlatList
          data={projects || []}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item?.id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text variant="titleMedium">
                {projectCount} {projectCount === 1 ? "Project" : "Projects"}
              </Text>
              <Button
                mode="outlined"
                onPress={() => parentNavigation?.navigate("CreateProject")}
                icon="plus"
              >
                Create
              </Button>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Add background color like ChallengesScreen
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
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    elevation: 2,
    // paddingTop handled directly in the View component
  },
  searchBar: {
    marginBottom: spacing.sm,
    backgroundColor: colors.cardBackground,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  clearFiltersButton: {
    marginLeft: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    // No paddingBottom to avoid extra space
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  projectItem: {
    marginBottom: spacing.sm, // Reduce from spacing.md to spacing.sm
  },
  projectCard: {
    elevation: 1,
    backgroundColor: colors.cardBackground,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  projectInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  creatorName: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  projectDescription: {
    marginBottom: spacing.sm,
  },
  projectMeta: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  metaText: {
    ...typography.body2,
    marginLeft: spacing.xs,
    color: colors.onSurfaceVariant,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  footerLoader: {
    padding: spacing.sm, // Reduce from spacing.md to spacing.sm
    alignItems: "center",
  },
  emptyText: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md, // Reduce from spacing.lg to spacing.md
  },
  createButton: {
    marginTop: spacing.md,
  },
});

export default ProjectsScreen;
