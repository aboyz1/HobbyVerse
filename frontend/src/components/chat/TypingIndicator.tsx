import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useTheme } from "react-native-paper";
import { spacing } from "../../constants/theme";

interface TypingIndicatorProps {
  typingUsers: any[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const theme = useTheme();

  if (typingUsers.length === 0) return null;

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0].user.display_name} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0].user.display_name} and ${typingUsers[1].user.display_name} are typing`
      : `${typingUsers[0].user.display_name} and ${
          typingUsers.length - 1
        } others are typing`;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        {typingText}
      </Text>
      <View style={styles.dotsContainer}>
        <View
          style={[
            styles.dot,
            { backgroundColor: theme.colors.onSurfaceVariant },
          ]}
        />
        <View
          style={[
            styles.dot,
            { backgroundColor: theme.colors.onSurfaceVariant },
          ]}
        />
        <View
          style={[
            styles.dot,
            { backgroundColor: theme.colors.onSurfaceVariant },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});

export default TypingIndicator;
