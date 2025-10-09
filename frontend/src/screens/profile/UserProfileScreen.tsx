import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Text,
  Button,
  Card,
  Chip,
  Avatar,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, colors } from "../../constants/theme";
import { UserProfileScreenProps } from "../../types/navigation";
import UserService from "../../services/UserService";
import { User } from "../../types/user";
import { useAuth } from "../../contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  route,
  navigation,
}) => {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUserProfile(userId);
      if (response.data) {
        setUser(response.data);
        setIsFollowing(response.data.is_following || false);
      }

      // Fetch badges
      try {
        const badgesResponse = await UserService.getUserBadges(userId);
        setBadges(badgesResponse.data || []);
      } catch (badgeError) {
        console.log("Error fetching badges:", badgeError);
      }

      // Fetch projects
      try {
        const projectsResponse = await UserService.getUserProjects(userId);
        setProjects(projectsResponse.data || []);
      } catch (projectError) {
        console.log("Error fetching projects:", projectError);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await UserService.unfollowUser(userId);
      } else {
        await UserService.followUser(userId);
      }
      setIsFollowing(!isFollowing);
    } catch (err: any) {
      console.log("Error following user:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
            onPress={fetchUserProfile}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={100}
              source={{
                uri: user.avatar_url || "https://via.placeholder.com/100",
              }}
            />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{user.display_name}</Text>
            <Text style={styles.username}>
              @{user.display_name.toLowerCase().replace(/\s+/g, "")}
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.total_points || 0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.level || 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.squads_joined || 0}</Text>
                <Text style={styles.statLabel}>Squads</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <Button
              mode={isFollowing ? "outlined" : "contained"}
              onPress={handleFollow}
              style={styles.followButton}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button mode="outlined" style={styles.messageButton}>
              Message
            </Button>
          </View>
        )}

        {/* Bio */}
        {user.bio && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={{ fontSize: 16 }}>{user.bio}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.chipContainer}>
                {user.skills.map((skill, index) => (
                  <Chip key={index} style={styles.chip}>
                    {skill}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <Card style={styles.section}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Badges ({badges.length})
                </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate("UserBadges", { userId })}
                  style={styles.viewAllButton}
                >
                  View All
                </Button>
              </View>
              <View style={styles.badgesContainer}>
                {badges.slice(0, 6).map((badge) => (
                  <TouchableOpacity key={badge.id} style={styles.badgeItem}>
                    <Avatar.Image
                      size={40}
                      source={{
                        uri: badge.icon_url || "https://via.placeholder.com/40",
                      }}
                    />
                  </TouchableOpacity>
                ))}
                {badges.length > 6 && (
                  <TouchableOpacity style={styles.badgeItem}>
                    <View style={styles.moreBadges}>
                      <Text style={styles.moreBadgesText}>
                        +{badges.length - 6}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Recent Projects */}
        {projects.length > 0 && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Recent Projects ({projects.length})
              </Text>
              {projects.slice(0, 3).map((project) => (
                <TouchableOpacity key={project.id} style={styles.projectItem}>
                  <Image
                    source={{
                      uri:
                        project.thumbnail_url ||
                        "https://via.placeholder.com/60",
                    }}
                    style={styles.projectImage}
                  />
                  <View style={styles.projectInfo}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={styles.projectMeta}>
                      {project.difficulty_level} • {project.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Stats */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.activityStats}>
              <View style={styles.activityStat}>
                <Text style={styles.activityNumber}>
                  {user.projects_created || 0}
                </Text>
                <Text style={styles.activityLabel}>Projects</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={styles.activityNumber}>
                  {user.challenges_completed || 0}
                </Text>
                <Text style={styles.activityLabel}>Challenges</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={styles.activityNumber}>
                  {user.badges_earned || 0}
                </Text>
                <Text style={styles.activityLabel}>Badges</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={styles.activityNumber}>
                  {user.posts_count || 0}
                </Text>
                <Text style={styles.activityLabel}>Posts</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
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
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontWeight: "600",
    marginBottom: spacing.xs,
    fontSize: 20,
  },
  username: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    ...typography.h4,
    fontWeight: "700",
  },
  statLabel: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  followButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  messageButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: spacing.sm,
    fontSize: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  badgeItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  moreBadges: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  moreBadgesText: {
    ...typography.body2,
    fontWeight: "600",
  },
  projectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  projectImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectMeta: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  activityStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  activityStat: {
    alignItems: "center",
  },
  activityNumber: {
    ...typography.h4,
    fontWeight: "700",
  },
  activityLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  viewAllButton: {
    padding: 0,
  },
});

export default UserProfileScreen;
