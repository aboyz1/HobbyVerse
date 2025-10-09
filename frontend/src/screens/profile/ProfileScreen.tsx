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
  ActivityIndicator,
  Button,
} from "react-native-paper";
import { View as SafeAreaView } from "react-native"; // Change to View like ChallengesScreen
import { spacing, typography, colors, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import UserService from "../../services/UserService";
import { User } from "../../types/user";
import { ProfileScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Add this import

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(currentUser);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets(); // Get safe area insets

  // Get the parent navigation for accessing MainStack screens
  const parentNavigation = navigation.getParent();

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await UserService.getCurrentUserProfile();
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.log("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Unable to load profile</Text>
          <Button
            mode="contained"
            onPress={fetchUserProfile}
            style={styles.retryButton}
            buttonColor={colors.primary}
          >
            Retry
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <TouchableOpacity
            onPress={() => parentNavigation?.navigate("EditProfile" as any)}
            style={styles.avatarContainer}
          >
            <Avatar.Image
              size={90}
              source={{
                uri: user.avatar_url || "https://via.placeholder.com/90",
              }}
              style={styles.avatar}
            />
            <View style={styles.editOverlay}>
              <MaterialIcons name="edit" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.displayName, { ...typography.h4 }]}>
              {user.display_name}
            </Text>
            <Text style={[styles.username, { ...typography.body2 }]}>
              @{user.display_name.toLowerCase().replace(/\s+/g, "")}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { ...typography.h5 }]}>
                  {user.total_points || 0}
                </Text>
                <Text style={[styles.statLabel, { ...typography.caption }]}>
                  Points
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { ...typography.h5 }]}>
                  {user.level || 1}
                </Text>
                <Text style={[styles.statLabel, { ...typography.caption }]}>
                  Level
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { ...typography.h5 }]}>
                  {user.squads_joined || 0}
                </Text>
                <Text style={[styles.statLabel, { ...typography.caption }]}>
                  Squads
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => parentNavigation?.navigate("EditProfile" as any)}
            style={styles.actionButton}
            icon="pencil"
            textColor={colors.primary}
          >
            Edit Profile
          </Button>
          <Button
            mode="outlined"
            onPress={() => parentNavigation?.navigate("Settings" as any)}
            style={styles.actionButton}
            icon="cog"
            textColor={colors.onSurface}
          >
            Settings
          </Button>
        </View>

        {/* Gamification Actions */}
        <View style={styles.gamificationContainer}>
          <Button
            mode="outlined"
            onPress={() =>
              parentNavigation?.navigate("GamificationDashboard" as any)
            }
            style={styles.gamificationButton}
            icon="star"
            textColor={colors.primary}
          >
            Gamification
          </Button>
          <Button
            mode="outlined"
            onPress={() => parentNavigation?.navigate("Leaderboard" as any)}
            style={styles.gamificationButton}
            icon="format-list-numbered"
            textColor={colors.onSurface}
          >
            Leaderboard
          </Button>
        </View>

        <View style={styles.gamificationContainer}>
          <Button
            mode="outlined"
            onPress={() => parentNavigation?.navigate("Badges" as any)}
            style={styles.gamificationButton}
            icon="star"
            textColor={colors.onSurface}
          >
            Badges
          </Button>
          <Button
            mode="outlined"
            onPress={() =>
              parentNavigation?.navigate("UserBadges", { userId: user.id })
            }
            style={styles.gamificationButton}
            icon="star"
            textColor={colors.onSurface}
          >
            My Badges
          </Button>
        </View>

        <View style={styles.gamificationContainer}>
          <Button
            mode="outlined"
            onPress={() => parentNavigation?.navigate("PointsHistory" as any)}
            style={styles.gamificationButton}
            icon="history"
            textColor={colors.onSurface}
          >
            Points History
          </Button>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Activity Overview</Text>
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { ...shadows.small }]}>
              <Card.Content style={styles.statCardContent}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <MaterialIcons
                    name="folder"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.statCardNumber, { ...typography.h4 }]}>
                  {user.projects_created || 0}
                </Text>
                <Text style={[styles.statCardLabel, { ...typography.caption }]}>
                  Projects
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { ...shadows.small }]}>
              <Card.Content style={styles.statCardContent}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: colors.secondary + "20" },
                  ]}
                >
                  <MaterialIcons
                    name="emoji-events"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text
                  style={[
                    styles.statCardNumber,
                    { fontWeight: "600", fontSize: 20 },
                  ]}
                >
                  {user.challenges_completed || 0}
                </Text>
                <Text
                  style={[
                    styles.statCardLabel,
                    { fontSize: 14, color: colors.onSurfaceVariant },
                  ]}
                >
                  Challenges
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { ...shadows.small }]}>
              <Card.Content style={styles.statCardContent}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: colors.tertiary + "20" },
                  ]}
                >
                  <MaterialIcons
                    name="star"
                    size={24}
                    color={colors.tertiary}
                  />
                </View>
                <Text style={[styles.statCardNumber, { ...typography.h4 }]}>
                  {user.badges_earned || 0}
                </Text>
                <Text style={[styles.statCardLabel, { ...typography.caption }]}>
                  Badges
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { ...shadows.small }]}>
              <Card.Content style={styles.statCardContent}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: colors.info + "20" },
                  ]}
                >
                  <MaterialIcons name="people" size={24} color={colors.info} />
                </View>
                <Text style={[styles.statCardNumber, { ...typography.h4 }]}>
                  {user.followers_count || 0}
                </Text>
                <Text style={[styles.statCardLabel, { ...typography.caption }]}>
                  Followers
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Bio */}
        {user.bio && (
          <Card style={[styles.section, { ...shadows.small }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { fontWeight: "600", fontSize: 18, marginLeft: spacing.sm },
                  ]}
                >
                  About Me
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.onSurface,
                }}
              >
                {user.bio}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <Card style={[styles.section, { ...shadows.small }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="build" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { fontWeight: "600", fontSize: 18, marginLeft: spacing.sm },
                  ]}
                >
                  Skills
                </Text>
              </View>
              <View style={styles.skillsContainer}>
                {user.skills.map((skill, index) => (
                  <View
                    key={index}
                    style={[
                      styles.skillTag,
                      { backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Text style={[styles.skillText, { ...typography.caption }]}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Portfolio Links */}
        {user.portfolio_links && user.portfolio_links.length > 0 && (
          <Card style={[styles.section, { ...shadows.small }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="link" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { fontWeight: "600", fontSize: 18, marginLeft: spacing.sm },
                  ]}
                >
                  Portfolio
                </Text>
              </View>
              {user.portfolio_links.map((link, index) => (
                <TouchableOpacity key={index} style={styles.linkItem}>
                  <MaterialIcons name="link" size={20} color={colors.primary} />
                  <Text
                    style={[styles.linkText, { ...typography.body2 }]}
                    numberOfLines={1}
                  >
                    {link}
                  </Text>
                  <MaterialIcons
                    name="open-in-new"
                    size={16}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={logout}
          textColor={colors.error}
          style={styles.logoutButton}
          icon="logout"
        >
          Log Out
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    paddingBottom: spacing.xl,
    // No additional padding needed as we're handling insets directly
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
    color: colors.onBackground,
  },
  retryButton: {
    marginTop: spacing.md,
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    padding: spacing.lg,
    alignItems: "center",
    backgroundColor: colors.surface,
    ...shadows.small,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    backgroundColor: colors.surfaceVariant,
  },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontWeight: "600",
    color: colors.onBackground,
  },
  username: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  statItem: {
    alignItems: "center",
    marginRight: spacing.lg,
  },
  statNumber: {
    fontWeight: "600",
    color: colors.onBackground,
  },
  statLabel: {
    color: colors.onSurfaceVariant,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.sm,
    borderRadius: 8,
  },
  gamificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  gamificationButton: {
    flex: 1,
    marginHorizontal: spacing.sm,
    borderRadius: 8,
  },
  statsSection: {
    margin: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    marginBottom: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  statCardContent: {
    alignItems: "center",
    padding: spacing.md,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statCardNumber: {
    fontWeight: "600",
    marginTop: spacing.sm,
    fontSize: 20,
    color: colors.onBackground,
  },
  statCardLabel: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    fontSize: 14,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: 0,
    color: colors.onBackground,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  skillText: {
    color: colors.onSurface,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  linkText: {
    marginLeft: spacing.sm,
    flex: 1,
    color: colors.onSurface,
  },
  logoutButton: {
    margin: spacing.lg,
    borderRadius: 8,
  },
});

export default ProfileScreen;
