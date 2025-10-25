import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Divider,
  IconButton,
  Dialog,
  Portal,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, colors } from "../../constants/theme";
import { SettingsScreenProps } from "../../types/navigation";
import { useAuth } from "../../contexts/AuthContext";
import AuthService from "../../services/AuthService";
import NotificationService from "../../services/NotificationService";
import { MaterialIcons } from "@expo/vector-icons";
import { NotificationPreferences } from "../../types/user";

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout, refreshToken } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [changePasswordDialogVisible, setChangePasswordDialogVisible] =
    useState(false);
  const [privacySettingsDialogVisible, setPrivacySettingsDialogVisible] =
    useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public" as "public" | "squads_only" | "private",
    email_visibility: "public" as "public" | "squads_only" | "private",
    project_visibility: "public" as "public" | "squads_only" | "private",
  });

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      push_notifications: true,
      email_notifications: true,
      squad_updates: true,
      project_updates: true,
      challenge_updates: true,
      achievement_updates: true,
    });

  // Load notification preferences when component mounts
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const response = await NotificationService.getPreferences();
      if (response.data) {
        setNotificationPreferences(response.data);
      }
    } catch (error) {
      console.log("Error loading notification preferences:", error);
    }
  };

  const toggleNotification = async (type: keyof NotificationPreferences) => {
    try {
      const updatedPreferences = {
        ...notificationPreferences,
        [type]: !notificationPreferences[type],
      };

      setNotificationPreferences(updatedPreferences);

      // Save to backend
      await NotificationService.updatePreferences(updatedPreferences);
    } catch (error) {
      console.log("Error updating notification preferences:", error);
      // Revert the change if save fails
      loadNotificationPreferences();
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      // Use the actual refresh token from the auth context
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      logout();
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      setLogoutLoading(false);
      setDialogVisible(false);
    }
  };

  const showLogoutDialog = () => {
    setDialogVisible(true);
  };

  const hideLogoutDialog = () => {
    setDialogVisible(false);
  };

  const showChangePasswordDialog = () => {
    setChangePasswordDialogVisible(true);
    // Reset form fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const hideChangePasswordDialog = () => {
    setChangePasswordDialogVisible(false);
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await AuthService.updatePassword(currentPassword, newPassword);
      setPasswordSuccess("Password updated successfully!");

      // Close dialog after a short delay
      setTimeout(() => {
        hideChangePasswordDialog();
      }, 1500);
    } catch (error: any) {
      setPasswordError(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const showPrivacySettingsDialog = () => {
    // Initialize with user's current privacy settings if available
    if (user?.privacy_settings) {
      setPrivacySettings(user.privacy_settings);
    }
    setPrivacySettingsDialogVisible(true);
  };

  const hidePrivacySettingsDialog = () => {
    setPrivacySettingsDialogVisible(false);
  };

  const handleSavePrivacySettings = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would save these settings to the backend
      // For now, we'll just update the local state and close the dialog
      setTimeout(() => {
        hidePrivacySettingsDialog();
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.log("Error saving privacy settings:", error);
      setLoading(false);
    }
  };

  const handleHelpCenter = () => {
    // Navigate to help center screen or open web view
    // For now, we'll show an alert
    Alert.alert("Help Center", "Help center content would be displayed here.");
  };

  const handleSendFeedback = () => {
    // Open email client or feedback form
    // For now, we'll show an alert
    Alert.alert("Send Feedback", "Feedback form would be displayed here.");
  };

  const handleAboutHobbyverse = () => {
    // Navigate to about screen or show modal
    // For now, we'll show an alert
    Alert.alert(
      "About Hobbyverse",
      "Information about Hobbyverse would be displayed here."
    );
  };

  const handlePrivacyPolicy = () => {
    // Navigate to privacy policy screen or open web view
    // For now, we'll show an alert
    Alert.alert(
      "Privacy Policy",
      "Privacy policy content would be displayed here."
    );
  };

  const handleTermsOfService = () => {
    // Navigate to terms of service screen or open web view
    // For now, we'll show an alert
    Alert.alert(
      "Terms of Service",
      "Terms of service content would be displayed here."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Account Section */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontWeight: "600", fontSize: 18 },
                ]}
              >
                Account
              </Text>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Edit Profile
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>

              <Divider style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={showChangePasswordDialog}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="security"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Change Password
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>

              <Divider style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={showPrivacySettingsDialog}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="privacy-tip"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Privacy Settings
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Notifications Section */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontWeight: "600", fontSize: 18 },
                ]}
              >
                Notifications
              </Text>

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="notifications"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Push Notifications
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences.push_notifications}
                  onValueChange={() => toggleNotification("push_notifications")}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="email"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Email Notifications
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences.email_notifications}
                  onValueChange={() =>
                    toggleNotification("email_notifications")
                  }
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="groups"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Squad Updates
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences.squad_updates}
                  onValueChange={() => toggleNotification("squad_updates")}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="folder"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Project Updates
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences.project_updates}
                  onValueChange={() => toggleNotification("project_updates")}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="emoji-events"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text style={[styles.settingItemText, { fontSize: 16 }]}>
                    Challenge Updates
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences.challenge_updates}
                  onValueChange={() => toggleNotification("challenge_updates")}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="star"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Achievement Updates
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences.achievement_updates}
                  onValueChange={() =>
                    toggleNotification("achievement_updates")
                  }
                />
              </View>
            </Card.Content>
          </Card>

          {/* Appearance Section */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontWeight: "600", fontSize: 18 },
                ]}
              >
                Appearance
              </Text>

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="dark-mode"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Dark Mode
                  </Text>
                </View>
                <Switch value={darkMode} onValueChange={setDarkMode} />
              </View>
            </Card.Content>
          </Card>

          {/* Support Section */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontWeight: "600", fontSize: 18 },
                ]}
              >
                Support
              </Text>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleHelpCenter}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="help"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Help Center
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>

              <Divider style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleSendFeedback}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="feedback"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Send Feedback
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* About Section */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontWeight: "600", fontSize: 18 },
                ]}
              >
                About
              </Text>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleAboutHobbyverse}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="info"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    About Hobbyverse
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>

              <Divider style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handlePrivacyPolicy}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="policy"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Privacy Policy
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>

              <Divider style={styles.divider} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleTermsOfService}
              >
                <View style={styles.settingItemContent}>
                  <MaterialIcons
                    name="description"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text
                    style={[styles.settingItemText, { ...typography.body1 }]}
                  >
                    Terms of Service
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Logout */}
          <Button
            mode="contained"
            onPress={showLogoutDialog}
            textColor="white"
            buttonColor={colors.error}
            style={styles.logoutButton}
          >
            Log Out
          </Button>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideLogoutDialog}>
          <Dialog.Title>Log Out</Dialog.Title>
          <Dialog.Content>
            <Text style={{ ...typography.body1 }}>
              Are you sure you want to log out of your account?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideLogoutDialog}>Cancel</Button>
            <Button
              onPress={handleLogout}
              loading={logoutLoading}
              disabled={logoutLoading}
              textColor={colors.error}
            >
              {logoutLoading ? "Logging out..." : "Log Out"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog
          visible={changePasswordDialogVisible}
          onDismiss={hideChangePasswordDialog}
        >
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            {passwordError && (
              <Text style={{ color: colors.error, marginBottom: spacing.sm }}>
                {passwordError}
              </Text>
            )}
            {passwordSuccess && (
              <Text style={{ color: colors.primary, marginBottom: spacing.sm }}>
                {passwordSuccess}
              </Text>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideChangePasswordDialog}>Cancel</Button>
            <Button
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading || !!passwordSuccess}
            >
              {passwordSuccess ? "Done" : "Change"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Privacy Settings Dialog */}
      <Portal>
        <Dialog
          visible={privacySettingsDialogVisible}
          onDismiss={hidePrivacySettingsDialog}
        >
          <Dialog.Title>Privacy Settings</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    profile_visibility: "public",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.profile_visibility === "public" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    profile_visibility: "squads_only",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.profile_visibility === "squads_only" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Squads Only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    profile_visibility: "private",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.profile_visibility === "private" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Private</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>
              Email Visibility
            </Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    email_visibility: "public",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.email_visibility === "public" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    email_visibility: "squads_only",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.email_visibility === "squads_only" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Squads Only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    email_visibility: "private",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.email_visibility === "private" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Private</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>
              Project Visibility
            </Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    project_visibility: "public",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.project_visibility === "public" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    project_visibility: "squads_only",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.project_visibility === "squads_only" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Squads Only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  setPrivacySettings({
                    ...privacySettings,
                    project_visibility: "private",
                  })
                }
              >
                <View style={styles.radioCircle}>
                  {privacySettings.project_visibility === "private" && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Private</Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hidePrivacySettingsDialog}>Cancel</Button>
            <Button
              onPress={handleSavePrivacySettings}
              loading={loading}
              disabled={loading}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
    elevation: 1,
    backgroundColor: colors.cardBackground,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: spacing.sm,
    fontSize: 18,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemText: {
    marginLeft: spacing.md,
    fontSize: 16,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  logoutButton: {
    marginVertical: spacing.lg,
    borderColor: colors.error,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    padding: spacing.sm,
    fontSize: 16,
  },
  radioGroup: {
    marginBottom: spacing.md,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 16,
  },
});

export default SettingsScreen;
