import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  ActivityIndicator,
  FAB,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import SquadService from "../../services/SquadService";
import { spacing, typography } from "../../constants/theme";
import { SquadDetailsScreenProps } from "../../types/navigation";

const SquadDetailsScreen: React.FC<SquadDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { squadId } = route.params;
  const theme = useTheme();
  const { user, accessToken } = useAuth();

  const [squad, setSquad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SquadService.setAuthToken(accessToken);
    fetchSquadDetails();
  }, [squadId, accessToken]);

  const fetchSquadDetails = async () => {
    try {
      setLoading(true);
      const response = await SquadService.getSquadById(squadId);
      if (response.success) {
        setSquad(response.data);
      } else {
        setError(response.error || "Failed to load squad details");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching squad details");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSquadDetails();
    setRefreshing(false);
  };

  const handleJoinSquad = async () => {
    try {
      const response = await SquadService.joinSquad(squadId);
      if (response.success) {
        Alert.alert("Success", "You have successfully joined the squad!");
        // Refresh squad details to update membership status
        fetchSquadDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to join squad");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred while joining the squad"
      );
    }
  };

  const handleLeaveSquad = async () => {
    Alert.alert("Leave Squad", "Are you sure you want to leave this squad?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await SquadService.leaveSquad(squadId);
            if (response.success) {
              Alert.alert("Success", "You have successfully left the squad.");
              // Refresh squad details to update membership status
              fetchSquadDetails();
            } else {
              Alert.alert("Error", response.error || "Failed to leave squad");
            }
          } catch (err: any) {
            Alert.alert(
              "Error",
              err.message || "An error occurred while leaving the squad"
            );
          }
        },
      },
    ]);
  };

  const handleCreateThread = () => {
    navigation.navigate("CreateThread", { squadId });
  };

  const handleCreatePost = () => {
    navigation.navigate("CreatePost", { squadId });
  };

  const handleViewLeaderboard = () => {
    navigation.navigate("SquadLeaderboard", { squadId });
  };

  const handleManageMembers = () => {
    navigation.navigate("SquadMemberManagement", { squadId });
  };

  const renderHeader = () => {
    if (!squad) return null;

    return (
      <View style={styles.header}>
        {squad.banner_url ? (
          <Avatar.Image
            size={80}
            source={{ uri: squad.banner_url }}
            style={styles.banner}
          />
        ) : (
          <Avatar.Icon
            size={80}
            icon="account-group"
            style={[styles.banner, { backgroundColor: theme.colors.primary }]}
          />
        )}

        <Text
          variant="headlineSmall"
          style={[styles.squadName, { color: theme.colors.onBackground }]}
        >
          {squad.name}
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.squadDescription,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {squad.description}
        </Text>

        <View style={styles.tagsContainer}>
          {squad.tags?.map((tag: string, index: number) => (
            <Chip key={index} mode="outlined" style={styles.tagChip}>
              {tag}
            </Chip>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("SquadMembers", { squadId })}
            style={styles.statItem}
          >
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {squad.member_count}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Members
            </Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {squad.threads?.length || 0}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Threads
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {squad.recent_posts?.length || 0}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Posts
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {squad.is_member ? (
            <Button
              mode="outlined"
              onPress={handleLeaveSquad}
              textColor={theme.colors.error}
              style={styles.actionButton}
            >
              Leave Squad
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleJoinSquad}
              style={styles.actionButton}
            >
              Join Squad
            </Button>
          )}

          {squad.is_member && (
            <>
              <Button
                mode="outlined"
                onPress={() =>
                  navigation.navigate("RealTimeChat", {
                    squadId,
                    squadName: squad.name,
                  })
                }
                style={styles.actionButton}
              >
                Chat
              </Button>
              <Button
                mode="outlined"
                onPress={handleViewLeaderboard}
                style={styles.actionButton}
              >
                Leaderboard
              </Button>
            </>
          )}

          {squad.is_admin && (
            <Button
              mode="outlined"
              onPress={handleManageMembers}
              style={styles.actionButton}
            >
              Manage Members
            </Button>
          )}
        </View>
      </View>
    );
  };

  const renderThreads = () => {
    if (!squad?.threads || squad.threads.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Discussion Threads
          </Text>
          {squad.is_member && (
            <IconButton icon="plus" size={20} onPress={handleCreateThread} />
          )}
        </View>

        {squad.threads.map((thread: any) => (
          <Card
            key={thread.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content>
              <View style={styles.threadHeader}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface }}
                >
                  {thread.title}
                </Text>
                {thread.is_pinned && (
                  <Chip mode="outlined" compact style={styles.pinnedChip}>
                    Pinned
                  </Chip>
                )}
              </View>

              {thread.description && (
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.threadDescription,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {thread.description}
                </Text>
              )}

              <View style={styles.threadMeta}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  by {thread.creator_name}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {thread.post_count} posts
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderRecentPosts = () => {
    if (!squad?.recent_posts || squad.recent_posts.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text
          variant="titleLarge"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          Recent Posts
        </Text>

        {squad.recent_posts.map((post: any) => (
          <Card
            key={post.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content>
              <View style={styles.postHeader}>
                <Avatar.Text size={32} label={post.user_name.charAt(0)} />
                <View style={styles.postUserInfo}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface }}
                  >
                    {post.user_name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, marginTop: spacing.sm }}
              >
                {post.content}
              </Text>

              {post.thread_title && (
                <Chip mode="outlined" compact style={styles.threadChip}>
                  {post.thread_title}
                </Chip>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  if (loading) {
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
            Loading squad details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centered}>
          <IconButton
            icon="alert-circle"
            size={48}
            iconColor={theme.colors.error}
          />
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground, textAlign: "center" }}
          >
            Error Loading Squad
          </Text>
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: spacing.sm,
            }}
          >
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={fetchSquadDetails}
            style={{ marginTop: spacing.lg }}
          >
            Try Again
          </Button>
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
        {renderHeader()}
        <Divider style={styles.divider} />
        {renderThreads()}
        <Divider style={styles.divider} />
        {renderRecentPosts()}
        <View style={{ height: 80 }} />
      </ScrollView>

      {squad?.is_member && (
        <FAB
          icon="plus"
          label="New Post"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreatePost}
        />
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
  header: {
    padding: spacing.lg,
    alignItems: "center",
  },
  banner: {
    marginBottom: spacing.md,
  },
  squadName: {
    ...typography.h3,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  squadDescription: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tagChip: {
    margin: 0,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  actionButton: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
  },
  card: {
    marginBottom: spacing.md,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  pinnedChip: {
    height: 24,
  },
  threadDescription: {
    marginBottom: spacing.sm,
  },
  threadMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  postUserInfo: {
    marginLeft: spacing.md,
  },
  threadChip: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
  },
});

export default SquadDetailsScreen;
