import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { Platform, View, ViewStyle, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Type imports
import { MainStackParamList, TabParamList } from "../types/navigation";

// Tab Screens
import HomeScreen from "../screens/HomeScreen";
import SquadsScreen from "../screens/squads/SquadsScreen";
import ProjectsScreen from "../screens/projects/ProjectsScreen";
import ChallengesScreen from "../screens/challenges/ChallengesScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

// Stack Screens
import SquadDetailsScreen from "../screens/squads/SquadDetailsScreen";
import SquadPostDetailsScreen from "../screens/squads/SquadPostDetailsScreen";
import SquadChatScreen from "../screens/squads/SquadChatScreen";
import RealTimeChatScreen from "../screens/chat/RealTimeChatScreen";
import SquadMembersScreen from "../screens/squads/SquadMembersScreen";
import CreateSquadScreen from "../screens/squads/CreateSquadScreen";
import CreateThreadScreen from "../screens/squads/CreateThreadScreen";
import CreatePostScreen from "../screens/squads/CreatePostScreen";
import ProjectDetailsScreen from "../screens/projects/ProjectDetailsScreen";
import CreateProjectScreen from "../screens/projects/CreateProjectScreen";
import ChallengeDetailsScreen from "../screens/challenges/ChallengeDetailsScreen";
import SubmitChallengeScreen from "../screens/challenges/SubmitChallengeScreen";
import CreateChallengeScreen from "../screens/challenges/CreateChallengeScreen";
import UserProfileScreen from "../screens/profile/UserProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SearchScreen from "../screens/SearchScreen";
import SquadDiscoveryScreen from "../screens/squads/SquadDiscoveryScreen";
// Gamification Screens
import GamificationDashboardScreen from "@/screens/gamification/GamificationDashboardScreen";
import LeaderboardScreen from "@/screens/gamification/LeaderboardScreen";
import BadgesScreen from "@/screens/gamification/BadgesScreen";
import PointsHistoryScreen from "@/screens/gamification/PointsHistoryScreen";
// General Post Screens
import CreateGeneralPostScreen from "../screens/CreateGeneralPostScreen";
import GeneralPostDetailsScreen from "../screens/GeneralPostDetailsScreen";
// New Screens
import ChallengeSubmissionDetailsScreen from "../screens/challenges/ChallengeSubmissionDetailsScreen";
import ChallengeSubmissionReviewScreen from "../screens/challenges/ChallengeSubmissionReviewScreen";
import ProjectFileManagerScreen from "../screens/projects/ProjectFileManagerScreen";
import ProjectUpdateManagementScreen from "../screens/projects/ProjectUpdateManagementScreen";
import SquadLeaderboardScreen from "../screens/squads/SquadLeaderboardScreen";
import SquadMemberManagementScreen from "../screens/squads/SquadMemberManagementScreen";
import BadgeDetailsScreen from "../screens/gamification/BadgeDetailsScreen";
import UserBadgesScreen from "../screens/gamification/UserBadgesScreen";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// Styles for active tab background
const activeTabBackground: ViewStyle = {
  backgroundColor: "#E3F2FD", // Light blue - light form of primary color (#1DA1F2)
  borderRadius: 25, // More rounded to make it pill-shaped
  paddingVertical: 20, // Increased vertical padding to fully cover both icon and text
  paddingHorizontal: 25, // Increased horizontal padding to make it wider
  marginHorizontal: -15, // Negative margin to extend beyond the default boundaries
  alignSelf: "center",
  justifyContent: "center",
  alignItems: "center",
};

// Tab Navigator Component
const TabNavigator: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          let label: string;

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              label = "Home";
              break;
            case "Squads":
              iconName = focused ? "people" : "people-outline";
              label = "Squads";
              break;
            case "Projects":
              iconName = focused ? "folder" : "folder-outline";
              label = "Projects";
              break;
            case "Challenges":
              iconName = focused ? "trophy" : "trophy-outline";
              label = "Challenges";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              label = "Profile";
              break;
            default:
              iconName = "help-outline";
              label = "Unknown";
          }

          return (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                position: "relative",
              }}
            >
              {focused && <View style={activeTabBackground} />}
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1, // Ensure content is above background
                }}
              >
                <Ionicons name={iconName} size={size} color={color} />
                <View style={{ height: 6 }} />
                <Text
                  style={{
                    color: focused
                      ? theme.colors.onBackground
                      : theme.colors.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  {label}
                </Text>
              </View>
            </View>
          );
        },
        // Custom styling to cover both icon and text
        tabBarShowLabel: false, // Hide the default label since we're showing it in the icon
        tabBarActiveTintColor: theme.colors.onBackground,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          height:
            Platform.OS === "ios" ? 80 + insets.bottom : 60 + insets.bottom,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : insets.bottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={
          {
            // Removed tabBarLabel property
          }
        }
      />
      <Tab.Screen
        name="Squads"
        component={SquadsScreen}
        options={
          {
            // Removed tabBarLabel property
          }
        }
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={
          {
            // Removed tabBarLabel property
          }
        }
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={
          {
            // Removed tabBarLabel property
          }
        }
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={
          {
            // Removed tabBarLabel property
          }
        }
      />
    </Tab.Navigator>
  );
};

// Main Navigator with all screens
const MainNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        animation: "slide_from_right",
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      {/* Squad Screens */}
      <Stack.Screen
        name="SquadDetails"
        component={SquadDetailsScreen}
        options={({ route }) => ({
          title: "Squad Details",
          headerBackTitle: "Back",
        })}
      />
      <Stack.Screen
        name="SquadPostDetails"
        component={SquadPostDetailsScreen}
        options={{
          title: "Post Details",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="SquadChat"
        component={SquadChatScreen}
        options={({ route }) => ({
          title: route.params.squadName || "Chat",
          headerBackTitle: "Back",
        })}
      />
      <Stack.Screen
        name="RealTimeChat"
        component={RealTimeChatScreen}
        options={({ route }) => ({
          title: route.params.squadName || "Chat",
          headerBackTitle: "Back",
        })}
      />
      <Stack.Screen
        name="CreateSquad"
        component={CreateSquadScreen}
        options={{
          title: "Create Squad",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="SquadDiscovery"
        component={SquadDiscoveryScreen}
        options={{
          title: "Discover Squads",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="SquadMembers"
        component={SquadMembersScreen}
        options={{
          title: "Squad Members",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="CreateThread"
        component={CreateThreadScreen}
        options={{
          title: "Create Thread",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: "Create Post",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      {/* New Squad Screens */}
      <Stack.Screen
        name="SquadLeaderboard"
        component={SquadLeaderboardScreen}
        options={{
          title: "Squad Leaderboard",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="SquadMemberManagement"
        component={SquadMemberManagementScreen}
        options={{
          title: "Manage Members",
          headerBackTitle: "Back",
        }}
      />

      {/* Project Screens */}
      <Stack.Screen
        name="ProjectDetails"
        component={ProjectDetailsScreen}
        options={{
          title: "Project Details",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{
          title: "Create Project",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      {/* New Project Screens */}
      <Stack.Screen
        name="ProjectFileManager"
        component={ProjectFileManagerScreen}
        options={{
          title: "Project Files",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="ProjectUpdateManagement"
        component={ProjectUpdateManagementScreen}
        options={{
          title: "Project Updates",
          headerBackTitle: "Back",
        }}
      />

      {/* Challenge Screens */}
      <Stack.Screen
        name="ChallengeDetails"
        component={ChallengeDetailsScreen}
        options={{
          title: "Challenge Details",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="SubmitChallenge"
        component={SubmitChallengeScreen}
        options={{
          title: "Submit Challenge",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="CreateChallenge"
        component={CreateChallengeScreen}
        options={{
          title: "Create Challenge",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      {/* New Challenge Screens */}
      <Stack.Screen
        name="ChallengeSubmissionDetails"
        component={ChallengeSubmissionDetailsScreen}
        options={{
          title: "Submission Details",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="ChallengeSubmissionReview"
        component={ChallengeSubmissionReviewScreen}
        options={{
          title: "Review Submissions",
          headerBackTitle: "Back",
        }}
      />

      {/* Gamification Screens */}
      <Stack.Screen
        name="GamificationDashboard"
        component={GamificationDashboardScreen}
        options={{
          title: "Gamification",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          title: "Leaderboard",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="Badges"
        component={BadgesScreen}
        options={{
          title: "Badges",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="PointsHistory"
        component={PointsHistoryScreen}
        options={{
          title: "Points History",
          headerBackTitle: "Back",
        }}
      />
      {/* New Gamification Screens */}
      <Stack.Screen
        name="BadgeDetails"
        component={BadgeDetailsScreen}
        options={{
          title: "Badge Details",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="UserBadges"
        component={UserBadgesScreen}
        options={{
          title: "User Badges",
          headerBackTitle: "Back",
        }}
      />

      {/* Profile Screens */}
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: "Profile",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: "Edit Profile",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerBackTitle: "Back",
        }}
      />

      {/* Other Screens */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: "Search",
          headerBackTitle: "Back",
        }}
      />

      {/* General Post Screens */}
      <Stack.Screen
        name="CreateGeneralPost"
        component={CreateGeneralPostScreen}
        options={{
          title: "Create Post",
          headerBackTitle: "Cancel",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="GeneralPostDetails"
        component={GeneralPostDetailsScreen}
        options={{
          title: "Post Details",
          headerBackTitle: "Back",
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
