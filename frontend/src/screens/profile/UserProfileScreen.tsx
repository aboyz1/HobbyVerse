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
import { spacing, typography, colors, shadows } from "../../constants/theme";
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
      // Validate userId
      console.log("Fetching user profile for userId:", userId);

      if (!userId) {
        setError("User ID is missing");
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await UserService.getUserProfile(userId);

      console.log("User profile response:", response);

      // Handle the correct response structure from the backend
      if (response.success && response.user) {
        setUser(response.user);
        setIsFollowing(response.user.is_following || false);
      } else {
        setError(response.error || "Failed to load user profile");
      }

      // Fetch badges
      try {
        const badgesResponse = await UserService.getUserBadges(userId);
        if (badgesResponse.success && badgesResponse.badges) {
          setBadges(badgesResponse.badges);
        }
      } catch (badgeError) {
        console.log("Error fetching badges:", badgeError);
      }

      // Fetch projects
      try {
        const projectsResponse = await UserService.getUserProjects(userId);
        if (projectsResponse.success && projectsResponse.projects) {
          setProjects(projectsResponse.projects);
        }
      } catch (projectError) {
        console.log("Error fetching projects:", projectError);
      }
    } catch (err: any) {
      console.error("Error in fetchUserProfile:", err);
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (!userId) {
        console.log("User ID is missing for follow action");
        return;
      }

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
          <Text style={styles.errorText}>ID: {userId}</Text>
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
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri: "https://via.placeholder.com/400x200/1DA1F2/FFFFFF?text=Cover+Photo",
            }}
            style={styles.coverImage}
          />
          <View style={styles.avatarOverlay}>
            <Avatar.Image
              size={100}
              source={{
                uri: user.avatar_url || "https://via.placeholder.com/100",
              }}
              style={styles.profileAvatar}
            />
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{user.display_name}</Text>
              <Text style={styles.username}>
                @{user.display_name.toLowerCase().replace(/\s+/g, "")}
              </Text>
            </View>

            {!isOwnProfile && (
              <Button
                mode={isFollowing ? "outlined" : "contained"}
                onPress={handleFollow}
                style={styles.followButton}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </View>

          {/* Bio */}
          {user.bio && <Text style={styles.bioText}>{user.bio}</Text>}

          {/* Profile Stats */}
          <View style={styles.profileStats}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate("UserBadges", { userId })}
            >
              <Text style={styles.statNumber}>{user.badges_earned || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user.projects_created || 0}
              </Text>
              <Text style={styles.statLabel}>Projects</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statItem}
              onPress={() => console.log("Navigate to followers")}
            >
              <Text style={styles.statNumber}>{user.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statItem}
              onPress={() => console.log("Navigate to following")}
            >
              <Text style={styles.statNumber}>{user.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.chipContainer}>
                {user.skills.map((skill, index) => (
                  <Chip key={index} style={styles.skillChip}>
                    {skill}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </View>

        <Divider style={styles.sectionDivider} />

        {/* Badges Section */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Badges ({badges.length})</Text>
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
          </View>
        )}

        {/* Recent Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recent Projects ({projects.length})
            </Text>
            {projects.slice(0, 3).map((project) => (
              <TouchableOpacity key={project.id} style={styles.projectItem}>
                <Image
                  source={{
                    uri:
                      project.thumbnail_url || "https://via.placeholder.com/60",
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
          </View>
        )}

        {/* Activity Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.activityStats}>
            <View style={styles.activityStat}>
              <Text style={styles.activityNumber}>
                {user.challenges_completed || 0}
              </Text>
              <Text style={styles.activityLabel}>Challenges</Text>
            </View>
            <View style={styles.activityStat}>
              <Text style={styles.activityNumber}>{user.posts_count || 0}</Text>
              <Text style={styles.activityLabel}>Posts</Text>
            </View>
            <View style={styles.activityStat}>
              <Text style={styles.activityNumber}>
                {user.comments_count || 0}
              </Text>
              <Text style={styles.activityLabel}>Comments</Text>
            </View>
            <View style={styles.activityStat}>
              <Text style={styles.activityNumber}>
                {user.squads_joined || 0}
              </Text>
              <Text style={styles.activityLabel}>Squads</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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

  // Cover and Avatar
  coverContainer: {
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: 150,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: -50,
    left: spacing.lg,
  },
  profileAvatar: {
    borderWidth: 3,
    borderColor: colors.surface,
  },

  // Profile Info
  profileInfoContainer: {
    marginTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  nameContainer: {
    flex: 1,
  },
  displayName: {
    ...typography.h4,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  followButton: {
    borderRadius: 20,
    minWidth: 100,
  },
  bioText: {
    ...typography.body1,
    marginBottom: spacing.md,
    lineHeight: 22,
  },

  // Profile Stats
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...shadows.small,
  },
  statItem: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  statNumber: {
    ...typography.h4,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },

  // Skills
  skillsContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.primaryContainer,
  },

  // Sections
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionDivider: {
    marginVertical: spacing.lg,
  },
  viewAllButton: {
    padding: 0,
  },

  // Badges
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

  // Projects
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

  // Activity Stats
  activityStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.small,
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
    marginTop: spacing.xs,
  },
});

export default UserProfileScreen;
