import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Avatar,
  Card,
  IconButton,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography } from "../../constants/theme";
import { SquadChatScreenProps } from "../../types/navigation";
import { useAuth } from "../../contexts/AuthContext";
import SquadService from "../../services/SquadService";
import WebSocketService from "../../services/WebSocketService";
import { ChatMessage } from "../../types/squad";

const SquadChatScreen: React.FC<SquadChatScreenProps> = ({
  route,
  navigation,
}) => {
  const { squadId, squadName } = route.params;

  // Add a useEffect to redirect to RealTimeChatScreen
  useEffect(() => {
    navigation.replace("RealTimeChat", { squadId, squadName });
  }, [squadId, squadName, navigation]);

  // Return empty view since we're redirecting
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Redirecting to real-time chat...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body1,
  },
  header: {
    padding: spacing.md,
    backgroundColor: "white",
  },
  headerTitle: {
    ...typography.h4,
    fontWeight: "600",
  },
  headerSubtitle: {
    ...typography.body2,
    color: "#666",
  },
  messagesContainer: {
    padding: spacing.md,
    paddingBottom: 0,
  },
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
    backgroundColor: "#6200ee",
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
  },
  messageUserName: {
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  currentUserText: {
    color: "white",
  },
  otherUserText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "#999",
    marginTop: spacing.xs,
    textAlign: "right",
  },
  typingContainer: {
    padding: spacing.sm,
    alignItems: "center",
  },
  typingText: {
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    backgroundColor: "white",
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    margin: 0,
  },
});

export default SquadChatScreen;
