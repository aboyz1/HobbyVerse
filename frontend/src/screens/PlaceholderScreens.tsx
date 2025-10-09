import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography } from "@/constants/theme";

const SquadChatScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Squad Chat
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Real-time chat placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const CreateSquadScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Squad
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Create new squad form placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const ProjectsScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Projects
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Browse and manage projects
      </Text>
    </View>
  </SafeAreaView>
);

const ProjectDetailsScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Project Details
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Project details placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const CreateProjectScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Project
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Create new project form placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const ChallengesScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Challenges
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Browse active challenges
      </Text>
    </View>
  </SafeAreaView>
);

const ChallengeDetailsScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Challenge Details
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Challenge details placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const ProfileScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Profile
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        User profile placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const UserProfileScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        User Profile
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Other user profile placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const EditProfileScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Edit Profile
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Edit profile form placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const SettingsScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        App settings placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const NotificationsScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Notifications
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Notifications list placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const SearchScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Search
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Search functionality placeholder
      </Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body1,
    textAlign: "center",
    opacity: 0.7,
  },
});

// Export all screens
export {
  SquadChatScreen,
  CreateSquadScreen,
  ProjectsScreen,
  ProjectDetailsScreen,
  CreateProjectScreen,
  ChallengesScreen,
  ChallengeDetailsScreen,
  ProfileScreen,
  UserProfileScreen,
  EditProfileScreen,
  SettingsScreen,
  NotificationsScreen,
  SearchScreen,
};
