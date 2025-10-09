import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography, colors, shadows } from "../../constants/theme";
import { SquadsScreenProps } from "../../types/navigation";
import { useAppNavigation } from "../../hooks/useNavigation";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SquadsScreen: React.FC<SquadsScreenProps> = () => {
  const navigation = useAppNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, spacing.md),
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <View style={styles.header}>
          <MaterialIcons
            name="people"
            size={64}
            color={colors.primary}
            style={styles.headerIcon}
          />
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Squads
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Find and join communities of hobbyists
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("CreateSquad")}
            style={styles.button}
            buttonColor={colors.primary}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Create Squad
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate("SquadDiscovery")}
            style={styles.button}
            textColor={colors.primary}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Browse Squads
          </Button>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <MaterialIcons name="chat" size={24} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>Real-time Chat</Text>
            <Text style={styles.featureDescription}>
              Connect with fellow hobbyists through instant messaging
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: colors.secondary + "20" },
              ]}
            >
              <MaterialIcons name="forum" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.featureTitle}>Discussion Forums</Text>
            <Text style={styles.featureDescription}>
              Share ideas and get feedback in topic-based discussions
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: colors.tertiary + "20" },
              ]}
            >
              <MaterialIcons name="event" size={24} color={colors.tertiary} />
            </View>
            <Text style={styles.featureTitle}>Squad Events</Text>
            <Text style={styles.featureDescription}>
              Participate in exclusive events and challenges
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    width: "100%",
  },
  headerIcon: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body1,
    textAlign: "center",
    marginBottom: spacing.xl,
    opacity: 0.7,
    lineHeight: 22,
  },
  buttons: {
    width: "100%",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  button: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    ...shadows.small,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontWeight: "600",
  },
  featuresContainer: {
    width: "100%",
  },
  featureItem: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.h6,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default SquadsScreen;
