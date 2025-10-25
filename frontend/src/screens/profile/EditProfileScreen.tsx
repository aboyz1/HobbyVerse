import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Text,
  Button,
  Card,
  Chip,
  Avatar,
  ActivityIndicator,
  IconButton,
  HelperText,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, colors } from "../../constants/theme";
import { EditProfileScreenProps } from "../../types/navigation";
import UserService from "../../services/UserService";
import { useAuth } from "../../contexts/AuthContext";
import { UpdateUserRequest } from "../../types/user";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useTabNavigation } from "../../hooks/useNavigation";

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  navigation,
}) => {
  const tabNavigation = useTabNavigation();
  const parentNavigation = tabNavigation.getParent();
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(
    user?.portfolio_links || []
  );
  const [newSkill, setNewSkill] = useState("");
  const [newLink, setNewLink] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateForm = () => {
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters");
      return false;
    }
    if (bio.trim().length > 500) {
      setError("Bio must be less than 500 characters");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UpdateUserRequest = {
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
        portfolio_links: portfolioLinks.length > 0 ? portfolioLinks : undefined,
      };

      const response = await UserService.updateUserProfile(updateData);
      if (response.data) {
        updateUser(response.data);
      }
      setSuccess("Profile updated successfully!");

      // Navigate back after a short delay
      setTimeout(() => {
        parentNavigation?.goBack();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const addLink = () => {
    if (newLink.trim() && !portfolioLinks.includes(newLink.trim())) {
      setPortfolioLinks([...portfolioLinks, newLink.trim()]);
      setNewLink("");
    }
  };

  const removeLink = (linkToRemove: string) => {
    setPortfolioLinks(portfolioLinks.filter((link) => link !== linkToRemove));
  };

  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri);
      // In a real app, you would upload this image to your server here
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          {error && (
            <Card style={styles.messageCard}>
              <Card.Content style={styles.messageContent}>
                <MaterialIcons name="error" size={24} color={colors.error} />
                <Text style={styles.errorMessage}>{error}</Text>
              </Card.Content>
            </Card>
          )}

          {success && (
            <Card style={styles.messageCard}>
              <Card.Content style={styles.messageContent}>
                <MaterialIcons
                  name="check-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.successMessage}>{success}</Text>
              </Card.Content>
            </Card>
          )}

          {/* Avatar Section */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={{
                  ...styles.sectionTitle,
                  fontWeight: "600",
                  fontSize: 18,
                }}
              >
                Profile Picture
              </Text>
              <View style={styles.avatarSection}>
                <TouchableOpacity onPress={pickImage}>
                  <Avatar.Image
                    size={100}
                    source={{
                      uri: avatarUrl || "https://via.placeholder.com/100",
                    }}
                  />
                </TouchableOpacity>
                <Button
                  mode="outlined"
                  onPress={pickImage}
                  style={styles.changeAvatarButton}
                >
                  Change Photo
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Display Name */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={{
                  ...styles.sectionTitle,
                  fontWeight: "600",
                  fontSize: 18,
                }}
              >
                Display Name
              </Text>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                maxLength={50}
              />
              <HelperText type="info" visible={true}>
                {displayName.length}/50 characters
              </HelperText>
            </Card.Content>
          </Card>

          {/* Bio */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={{
                  ...styles.sectionTitle,
                  fontWeight: "600",
                  fontSize: 18,
                }}
              >
                Bio
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <HelperText type="info" visible={true}>
                {bio.length}/500 characters
              </HelperText>
            </Card.Content>
          </Card>

          {/* Skills */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={{
                  ...styles.sectionTitle,
                  fontWeight: "600",
                  fontSize: 18,
                }}
              >
                Skills
              </Text>
              <View style={styles.chipContainer}>
                {skills.map((skill, index) => (
                  <Chip
                    key={index}
                    onClose={() => removeSkill(skill)}
                    style={styles.chip}
                  >
                    {skill}
                  </Chip>
                ))}
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.textInput, styles.flexInput]}
                  value={newSkill}
                  onChangeText={setNewSkill}
                  placeholder="Add a skill"
                  onSubmitEditing={addSkill}
                />
                <IconButton
                  icon="plus"
                  onPress={addSkill}
                  disabled={!newSkill.trim()}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Portfolio Links */}
          <Card style={styles.section}>
            <Card.Content>
              <Text
                style={{
                  ...styles.sectionTitle,
                  fontWeight: "600",
                  fontSize: 18,
                }}
              >
                Portfolio Links
              </Text>
              {portfolioLinks.map((link, index) => (
                <View key={index} style={styles.linkItem}>
                  <Text style={styles.linkText} numberOfLines={1}>
                    {link}
                  </Text>
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => removeLink(link)}
                  />
                </View>
              ))}
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.textInput, styles.flexInput]}
                  value={newLink}
                  onChangeText={setNewLink}
                  placeholder="https://example.com"
                  keyboardType="url"
                  onSubmitEditing={addLink}
                />
                <IconButton
                  icon="plus"
                  onPress={addLink}
                  disabled={!newLink.trim()}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  content: {
    padding: spacing.md,
  },
  messageCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  successMessage: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: spacing.sm,
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
  avatarSection: {
    alignItems: "center",
  },
  changeAvatarButton: {
    marginTop: spacing.md,
  },
  textInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm,
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: 16,
    flex: 1,
  },
  saveButton: {
    marginVertical: spacing.lg,
  },
});

export default EditProfileScreen;
