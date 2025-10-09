import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, Chip, Snackbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import { spacing, typography } from "../../constants/theme";
import { REGEX, ERROR_MESSAGES } from "../../constants";
import { RegisterScreenProps } from "../../types/navigation";
import { useAuthNavigation } from "../../hooks/useNavigation";

const RegisterScreen: React.FC<RegisterScreenProps> = () => {
  const navigation = useAuthNavigation();
  const theme = useTheme();
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    display_name: "",
    bio: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!REGEX.EMAIL.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.display_name) {
      errors.display_name = "Display name is required";
    } else if (formData.display_name.length < 2) {
      errors.display_name = "Display name must be at least 2 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
      });
    } catch (error) {
      // Error is handled by the context
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim().toLowerCase();
    if (skill && !skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text
              variant="displaySmall"
              style={[styles.title, { color: theme.colors.onBackground }]}
            >
              Join Hobbyverse
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Connect with fellow hobbyists worldwide
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateField("email", value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={!!formErrors.email}
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />
            {formErrors.email && (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: theme.colors.error }]}
              >
                {formErrors.email}
              </Text>
            )}

            <TextInput
              label="Display Name"
              value={formData.display_name}
              onChangeText={(value) => updateField("display_name", value)}
              mode="outlined"
              autoComplete="name"
              error={!!formErrors.display_name}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            {formErrors.display_name && (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: theme.colors.error }]}
              >
                {formErrors.display_name}
              </Text>
            )}

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => updateField("password", value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              error={!!formErrors.password}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {formErrors.password && (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: theme.colors.error }]}
              >
                {formErrors.password}
              </Text>
            )}

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              error={!!formErrors.confirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            {formErrors.confirmPassword && (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: theme.colors.error }]}
              >
                {formErrors.confirmPassword}
              </Text>
            )}

            <TextInput
              label="Bio (Optional)"
              value={formData.bio}
              onChangeText={(value) => updateField("bio", value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              left={<TextInput.Icon icon="text" />}
            />

            <View style={styles.skillsSection}>
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onSurface,
                  marginBottom: spacing.sm,
                }}
              >
                Skills & Interests (Optional)
              </Text>

              <View style={styles.skillInput}>
                <TextInput
                  label="Add a skill"
                  value={newSkill}
                  onChangeText={setNewSkill}
                  mode="outlined"
                  style={styles.skillTextInput}
                  onSubmitEditing={addSkill}
                  right={
                    <TextInput.Icon
                      icon="plus"
                      onPress={addSkill}
                      disabled={!newSkill.trim()}
                    />
                  }
                />
              </View>

              <View style={styles.skillsList}>
                {skills.map((skill, index) => (
                  <Chip
                    key={index}
                    mode="outlined"
                    onClose={() => removeSkill(skill)}
                    style={styles.skillChip}
                  >
                    {skill}
                  </Chip>
                ))}
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>
          </View>

          <View style={styles.footer}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Already have an account?{" "}
              <Text
                style={{ color: theme.colors.primary, fontWeight: "600" }}
                onPress={() => navigation.navigate("Login")}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
        action={{
          label: "Dismiss",
          onPress: clearError,
        }}
      >
        {error || ERROR_MESSAGES.NETWORK_ERROR}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
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
  form: {
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
  },
  errorText: {
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },
  skillsSection: {
    marginBottom: spacing.lg,
  },
  skillInput: {
    marginBottom: spacing.md,
  },
  skillTextInput: {
    flex: 1,
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  skillChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
  },
});

export default RegisterScreen;
