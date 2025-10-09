import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  IconButton,
  ActivityIndicator,
  Divider,
  Switch,
  Button,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import NotificationService from "../services/NotificationService";
import { useAuth } from "../contexts/AuthContext";

const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any>({});
  const [showPreferences, setShowPreferences] = useState(false);

  // Initialize service with auth token
  useEffect(() => {
    if (accessToken) {
      NotificationService.setAuthToken(accessToken);
    }
    fetchNotifications();
    fetchPreferences();
  }, [accessToken]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the API
      // For now, we'll simulate with mock data
      const mockNotifications = [
        {
          id: "1",
          type: "squad_invite",
          title: "Squad Invitation",
          message:
            "You've been invited to join the 'Photography Enthusiasts' squad",
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          data: {
            squadId: "squad1",
            squadName: "Photography Enthusiasts",
          },
        },
        {
          id: "2",
          type: "challenge_start",
          title: "New Challenge",
          message:
            "The '30-Day Drawing Challenge' has started! Join now to participate.",
          read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          data: {
            challengeId: "chal1",
            challengeName: "30-Day Drawing Challenge",
          },
        },
        {
          id: "3",
          type: "comment_reply",
          title: "New Reply",
          message: "Sam Wilson replied to your comment in 'Woodworking Tips'",
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          data: {
            postId: "post1",
            userName: "Sam Wilson",
          },
        },
        {
          id: "4",
          type: "project_update",
          title: "Project Update",
          message: "Your project 'DIY Garden Shed' has been approved",
          read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          data: {
            projectId: "proj1",
            projectName: "DIY Garden Shed",
          },
        },
      ];

      setNotifications(mockNotifications);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification preferences
  const fetchPreferences = async () => {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll simulate with mock data
      const mockPreferences = {
        email_notifications: true,
        push_notifications: true,
        squad_invites: true,
        challenge_updates: true,
        project_comments: true,
        weekly_digest: false,
      };

      setPreferences(mockPreferences);
    } catch (err: any) {
      console.log("Failed to load preferences");
    }
  };

  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      // In a real implementation, this would call the API
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.log("Failed to mark as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // In a real implementation, this would call the API
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.log("Failed to mark all as read");
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      // In a real implementation, this would call the API
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    } catch (err) {
      console.log("Failed to delete notification");
    }
  };

  // Toggle preference
  const togglePreference = (key: string) => {
    setPreferences((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: any }) => {
    const getIcon = () => {
      switch (item.type) {
        case "squad_invite":
          return "group-add";
        case "challenge_start":
          return "emoji-events";
        case "comment_reply":
          return "comment";
        case "project_update":
          return "folder";
        default:
          return "notifications";
      }
    };

    const getIconColor = () => {
      switch (item.type) {
        case "squad_invite":
          return theme.colors.primary;
        case "challenge_start":
          return "#FFD700";
        case "comment_reply":
          return "#4CAF50";
        case "project_update":
          return "#2196F3";
        default:
          return theme.colors.onSurface;
      }
    };

    return (
      <Card
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Card.Content style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <MaterialIcons
              name={getIcon() as any}
              size={24}
              color={getIconColor()}
            />
            <View style={styles.notificationText}>
              <Text
                style={[
                  styles.notificationTitle,
                  {
                    color: theme.colors.onBackground,
                    fontWeight: "600",
                    fontSize: 16,
                  },
                  !item.read && styles.unreadTitle,
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.notificationMessage,
                  { color: theme.colors.onSurface, fontSize: 16 },
                ]}
              >
                {item.message}
              </Text>
              <Text
                style={[
                  styles.notificationTime,
                  { color: theme.colors.onSurfaceVariant, fontSize: 14 },
                ]}
              >
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.notificationActions}>
              {!item.read && (
                <IconButton
                  icon="check"
                  size={18}
                  onPress={() => markAsRead(item.id)}
                />
              )}
              <IconButton
                icon="delete"
                size={18}
                onPress={() => deleteNotification(item.id)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Render preferences
  const renderPreferences = () => (
    <View
      style={[
        styles.preferencesContainer,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.preferencesHeader}>
        <Text
          style={[
            styles.preferencesTitle,
            {
              color: theme.colors.onBackground,
              fontWeight: "700",
              fontSize: 24,
            },
          ]}
        >
          Notification Preferences
        </Text>
        <IconButton icon="close" onPress={() => setShowPreferences(false)} />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.preferenceItem}>
        <Text
          style={[
            styles.preferenceLabel,
            { color: theme.colors.onBackground, fontSize: 16 },
          ]}
        >
          Email Notifications
        </Text>
        <Switch
          value={preferences.email_notifications}
          onValueChange={() => togglePreference("email_notifications")}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.preferenceItem}>
        <Text
          style={[
            styles.preferenceLabel,
            { color: theme.colors.onBackground, fontSize: 16 },
          ]}
        >
          Push Notifications
        </Text>
        <Switch
          value={preferences.push_notifications}
          onValueChange={() => togglePreference("push_notifications")}
          color={theme.colors.primary}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.preferenceItem}>
        <Text
          style={[
            styles.preferenceLabel,
            { color: theme.colors.onBackground, fontSize: 16 },
          ]}
        >
          Squad Invites
        </Text>
        <Switch
          value={preferences.squad_invites}
          onValueChange={() => togglePreference("squad_invites")}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.preferenceItem}>
        <Text
          style={[
            styles.preferenceLabel,
            { color: theme.colors.onBackground, fontSize: 16 },
          ]}
        >
          Challenge Updates
        </Text>
        <Switch
          value={preferences.challenge_updates}
          onValueChange={() => togglePreference("challenge_updates")}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.preferenceItem}>
        <Text
          style={[
            styles.preferenceLabel,
            { color: theme.colors.onBackground, fontSize: 16 },
          ]}
        >
          Project Comments
        </Text>
        <Switch
          value={preferences.project_comments}
          onValueChange={() => togglePreference("project_comments")}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.preferenceItem}>
        <Text
          style={[
            styles.preferenceLabel,
            { color: theme.colors.onBackground, fontSize: 16 },
          ]}
        >
          Weekly Digest
        </Text>
        <Switch
          value={preferences.weekly_digest}
          onValueChange={() => togglePreference("weekly_digest")}
          color={theme.colors.primary}
        />
      </View>

      <Button
        mode="contained"
        onPress={() => setShowPreferences(false)}
        style={styles.saveButton}
      >
        Save Preferences
      </Button>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              marginTop: spacing.md,
              color: theme.colors.onSurfaceVariant,
              ...typography.body1,
            }}
          >
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {!showPreferences ? (
        <>
          {/* Header */}
          <View
            style={[styles.header, { backgroundColor: theme.colors.surface }]}
          >
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.onBackground,
                  fontWeight: "700",
                  fontSize: 24,
                },
              ]}
            >
              Notifications
            </Text>
            <View style={styles.headerActions}>
              <IconButton
                icon="settings"
                onPress={() => setShowPreferences(true)}
              />
              <IconButton icon="done-all" onPress={markAllAsRead} />
            </View>
          </View>

          <Divider />

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <View style={styles.centered}>
              <MaterialIcons
                name="notifications-off"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={{
                  marginTop: spacing.md,
                  color: theme.colors.onBackground,
                  fontWeight: "600",
                  fontSize: 20,
                }}
              >
                No Notifications
              </Text>
              <Text
                style={{
                  marginTop: spacing.sm,
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                  fontSize: 16,
                }}
              >
                You're all caught up! Check back later for new notifications.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      ) : (
        renderPreferences()
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    elevation: 2,
  },
  title: {},
  headerActions: {
    flexDirection: "row",
  },
  listContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    marginBottom: spacing.md,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#6200ee",
  },
  notificationContent: {
    padding: spacing.sm,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notificationTitle: {
    marginBottom: spacing.xs,
  },
  unreadTitle: {
    fontWeight: "600",
  },
  notificationMessage: {
    marginBottom: spacing.xs,
  },
  notificationTime: {},
  notificationActions: {
    flexDirection: "row",
  },
  preferencesContainer: {
    flex: 1,
    padding: spacing.md,
  },
  preferencesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  preferencesTitle: {},
  divider: {
    marginVertical: spacing.md,
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  preferenceLabel: {},
  saveButton: {
    marginTop: spacing.lg,
  },
});

export default NotificationsScreen;
