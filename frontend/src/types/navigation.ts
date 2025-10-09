import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

// App Root Navigator Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Auth Navigator Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Navigator Types (contains tabs and modal screens)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  // Squad Screens
  SquadDetails: { squadId: string };
  SquadPostDetails: { postId: string; squadId?: string };
  SquadChat: { squadId: string; squadName: string };
  RealTimeChat: { squadId: string; squadName: string };
  CreateSquad: undefined;
  SquadDiscovery: undefined;
  SquadMembers: { squadId: string };
  CreateThread: { squadId: string };
  CreatePost: { squadId: string; threadId?: string };
  // New Squad Screens
  SquadLeaderboard: { squadId: string };
  SquadMemberManagement: { squadId: string };
  // Project Screens
  ProjectDetails: { projectId: string };
  CreateProject: { squadId?: string };
  // New Project Screens
  ProjectFileManager: { projectId: string };
  ProjectUpdateManagement: { projectId: string };
  // Challenge Screens
  ChallengeDetails: { challengeId: string };
  SubmitChallenge: { challengeId: string };
  CreateChallenge: undefined;
  // New Challenge Screens
  ChallengeSubmissionDetails: { challengeId: string; submissionId: string };
  ChallengeSubmissionReview: { challengeId: string };
  // Gamification Screens
  GamificationDashboard: undefined;
  Leaderboard: undefined;
  Badges: undefined;
  PointsHistory: undefined;
  // New Gamification Screens
  BadgeDetails: { badgeId: string };
  UserBadges: { userId: string };
  // Profile Screens
  UserProfile: { userId: string };
  EditProfile: undefined;
  Settings: undefined;
  // Other Screens
  Notifications: undefined;
  Search: { initialQuery?: string };
  // General Post Screens
  CreateGeneralPost: undefined;
  GeneralPostDetails: { postId: string };
};

// Tab Navigator Types
export type TabParamList = {
  Home: undefined;
  Squads: undefined;
  Projects: undefined;
  Challenges: undefined;
  Profile: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  T
>;

// Combined types for screens that can be accessed from multiple navigators
export type HomeScreenProps = TabScreenProps<"Home">;
export type SquadsScreenProps = TabScreenProps<"Squads">;
export type ProjectsScreenProps = TabScreenProps<"Projects">;
export type ChallengesScreenProps = TabScreenProps<"Challenges">;
export type ProfileScreenProps = TabScreenProps<"Profile">;

export type LoginScreenProps = AuthStackScreenProps<"Login">;
export type RegisterScreenProps = AuthStackScreenProps<"Register">;
export type ForgotPasswordScreenProps = AuthStackScreenProps<"ForgotPassword">;

export type SquadDetailsScreenProps = MainStackScreenProps<"SquadDetails">;
export type SquadChatScreenProps = MainStackScreenProps<"SquadChat">;
export type RealTimeChatScreenProps = MainStackScreenProps<"RealTimeChat">;
export type CreateSquadScreenProps = MainStackScreenProps<"CreateSquad">;
export type SquadDiscoveryScreenProps = MainStackScreenProps<"SquadDiscovery">;
export type SquadMembersScreenProps = MainStackScreenProps<"SquadMembers">;
export type CreateThreadScreenProps = MainStackScreenProps<"CreateThread">;
export type CreatePostScreenProps = MainStackScreenProps<"CreatePost">;
export type SquadPostDetailsScreenProps =
  MainStackScreenProps<"SquadPostDetails">;
// New Squad Screen Props
export type SquadLeaderboardScreenProps =
  MainStackScreenProps<"SquadLeaderboard">;
export type SquadMemberManagementScreenProps =
  MainStackScreenProps<"SquadMemberManagement">;
export type ProjectDetailsScreenProps = MainStackScreenProps<"ProjectDetails">;
export type CreateProjectScreenProps = MainStackScreenProps<"CreateProject">;
// New Project Screen Props
export type ProjectFileManagerScreenProps =
  MainStackScreenProps<"ProjectFileManager">;
export type ProjectUpdateManagementScreenProps =
  MainStackScreenProps<"ProjectUpdateManagement">;
export type ChallengeDetailsScreenProps =
  MainStackScreenProps<"ChallengeDetails">;
export type SubmitChallengeScreenProps =
  MainStackScreenProps<"SubmitChallenge">;
export type CreateChallengeScreenProps =
  MainStackScreenProps<"CreateChallenge">;
// New Challenge Screen Props
export type ChallengeSubmissionDetailsScreenProps =
  MainStackScreenProps<"ChallengeSubmissionDetails">;
export type ChallengeSubmissionReviewScreenProps =
  MainStackScreenProps<"ChallengeSubmissionReview">;
export type GamificationDashboardScreenProps =
  MainStackScreenProps<"GamificationDashboard">;
export type LeaderboardScreenProps = MainStackScreenProps<"Leaderboard">;
export type BadgesScreenProps = MainStackScreenProps<"Badges">;
export type PointsHistoryScreenProps = MainStackScreenProps<"PointsHistory">;
// New Gamification Screen Props
export type BadgeDetailsScreenProps = MainStackScreenProps<"BadgeDetails">;
export type UserBadgesScreenProps = MainStackScreenProps<"UserBadges">;
export type UserProfileScreenProps = MainStackScreenProps<"UserProfile">;
export type EditProfileScreenProps = MainStackScreenProps<"EditProfile">;
export type SettingsScreenProps = MainStackScreenProps<"Settings">;
export type NotificationsScreenProps = MainStackScreenProps<"Notifications">;
export type SearchScreenProps = MainStackScreenProps<"Search">;
export type CreateGeneralPostScreenProps =
  MainStackScreenProps<"CreateGeneralPost">;
export type GeneralPostDetailsScreenProps =
  MainStackScreenProps<"GeneralPostDetails">;

// Global navigation declaration
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
