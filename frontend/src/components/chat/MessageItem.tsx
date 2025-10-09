import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Avatar } from "react-native-paper";
import { spacing, typography } from "../../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { ChatMessage } from "../../types/squad";

interface MessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onLongPress: () => void;
  theme: any;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  onLongPress,
  theme,
}) => {
  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser && styles.currentUserMessage,
      ]}
    >
      {!isCurrentUser && (
        <Avatar.Image
          size={32}
          source={{
            uri: message.user?.avatar_url || "https://via.placeholder.com/32",
          }}
          style={styles.avatar}
        />
      )}

      <TouchableOpacity
        onLongPress={onLongPress}
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          {
            backgroundColor: isCurrentUser
              ? theme.colors.primary
              : theme.colors.surfaceVariant,
          },
        ]}
      >
        {!isCurrentUser && (
          <Text
            style={[styles.messageUserName, { color: theme.colors.onSurface }]}
          >
            {message.user?.display_name}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            { color: isCurrentUser ? "white" : theme.colors.onSurface },
          ]}
        >
          {message.message}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              {
                color: isCurrentUser
                  ? "rgba(255,255,255,0.8)"
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {message.edited && (
            <Text
              style={[
                styles.editedText,
                {
                  color: isCurrentUser
                    ? "rgba(255,255,255,0.8)"
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              (edited)
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {isCurrentUser && (
        <Avatar.Image
          size={32}
          source={{
            uri: message.user?.avatar_url || "https://via.placeholder.com/32",
          }}
          style={styles.avatar}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "flex-end",
  },
  currentUserMessage: {
    justifyContent: "flex-end",
  },
  avatar: {
    marginHorizontal: spacing.sm,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: spacing.sm,
    borderRadius: 16,
  },
  currentUserBubble: {
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    borderBottomLeftRadius: 4,
  },
  messageUserName: {
    ...typography.caption,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.body1,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  messageTime: {
    fontSize: 10,
  },
  editedText: {
    fontSize: 10,
    fontStyle: "italic",
    marginLeft: spacing.xs,
  },
});

export default MessageItem;
