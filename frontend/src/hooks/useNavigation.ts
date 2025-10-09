import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  RootStackParamList,
  MainStackParamList,
  TabParamList,
  AuthStackParamList,
} from "../types/navigation";

// Navigation hook types
type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MainStackNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type TabNavigationProp = BottomTabNavigationProp<TabParamList>;
type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Main navigation hook - use this in most screens
export const useAppNavigation = () => {
  return useNavigation<MainStackNavigationProp>();
};

// Specific navigation hooks for different contexts
export const useRootNavigation = () => {
  return useNavigation<RootStackNavigationProp>();
};

export const useTabNavigation = () => {
  return useNavigation<TabNavigationProp>();
};

export const useAuthNavigation = () => {
  return useNavigation<AuthStackNavigationProp>();
};

// Navigation helper functions
export const navigationHelpers = {
  // Squad navigation
  navigateToSquadDetails: (
    navigation: MainStackNavigationProp,
    squadId: string
  ) => {
    navigation.navigate("SquadDetails", { squadId });
  },

  navigateToSquadChat: (
    navigation: MainStackNavigationProp,
    squadId: string,
    squadName: string
  ) => {
    navigation.navigate("SquadChat", { squadId, squadName });
  },

  navigateToCreateSquad: (navigation: MainStackNavigationProp) => {
    navigation.navigate("CreateSquad");
  },

  // Project navigation
  navigateToProjectDetails: (
    navigation: MainStackNavigationProp,
    projectId: string
  ) => {
    navigation.navigate("ProjectDetails", { projectId });
  },

  navigateToCreateProject: (
    navigation: MainStackNavigationProp,
    squadId?: string
  ) => {
    navigation.navigate("CreateProject", { squadId });
  },

  // Challenge navigation
  navigateToChallengeDetails: (
    navigation: MainStackNavigationProp,
    challengeId: string
  ) => {
    navigation.navigate("ChallengeDetails", { challengeId });
  },

  // Profile navigation
  navigateToUserProfile: (
    navigation: MainStackNavigationProp,
    userId: string
  ) => {
    navigation.navigate("UserProfile", { userId });
  },

  navigateToEditProfile: (navigation: MainStackNavigationProp) => {
    navigation.navigate("EditProfile");
  },

  navigateToSettings: (navigation: MainStackNavigationProp) => {
    navigation.navigate("Settings");
  },

  // Other navigation
  navigateToNotifications: (navigation: MainStackNavigationProp) => {
    navigation.navigate("Notifications");
  },

  navigateToSearch: (
    navigation: MainStackNavigationProp,
    initialQuery?: string
  ) => {
    navigation.navigate("Search", { initialQuery });
  },

  // Tab navigation
  navigateToTab: (
    navigation: TabNavigationProp,
    tabName: keyof TabParamList
  ) => {
    navigation.navigate(tabName);
  },

  // Auth navigation
  navigateToLogin: (navigation: AuthStackNavigationProp) => {
    navigation.navigate("Login");
  },

  navigateToRegister: (navigation: AuthStackNavigationProp) => {
    navigation.navigate("Register");
  },

  navigateToForgotPassword: (navigation: AuthStackNavigationProp) => {
    navigation.navigate("ForgotPassword");
  },

  // Go back
  goBack: (navigation: MainStackNavigationProp | AuthStackNavigationProp) => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  },

  // Reset navigation stack
  resetToHome: (navigation: RootStackNavigationProp) => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  },

  resetToAuth: (navigation: RootStackNavigationProp) => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  },
};
