import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import {
  useTheme,
  IconButton,
  Menu,
  Divider,
  Avatar,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../../constants";
import { useAuth } from "@/contexts/AuthContext";
import { Message, User } from "@/types/chat";
import { colors } from "@/constants/theme";

const RealTimeChatScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { squadId, squadName } = route.params as {
    squadId: string;
    squadName: string;
  };
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnchor = useRef(null);

  useEffect(() => {
    const s = io(SOCKET_URL);

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("joinRoom", squadId);
    });

    s.on("newMessage", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    s.on("userTyping", (user: User) => {
      setTypingUsers((prevUsers) => {
        if (!prevUsers.some((u) => u.id === user.id)) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });
    });

    s.on("userStoppedTyping", (userId: string) => {
      setTypingUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
    });

    s.on("disconnect", () => {
      setIsConnected(false);
      s.emit("leaveRoom", squadId);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [squadId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user) return;

    const messageData = {
      userId: user.id,
      squadId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  const startTyping = () => {
    if (!socket || !user) return;
    socket.emit("startTyping", { userId: user.id, squadId });
    setIsTyping(true);
  };

  const stopTyping = () => {
    if (!socket || !user) return;
    socket.emit("stopTyping", { userId: user.id, squadId });
    setIsTyping(false);
  };

  const showMenu = (message: Message) => {
    setSelectedMessage(message);
    setMenuVisible(true);
  };

  const hideMenu = () => {
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  const editMessage = () => {
    if (selectedMessage) {
      setNewMessage(selectedMessage.content);
      // Here you would typically set an edit mode and message ID
      // For now, we'll just close the menu
      hideMenu();
    }
  };

  const deleteMessage = () => {
    if (selectedMessage) {
      Alert.alert(
        "Delete Message",
        "Are you sure you want to delete this message?",
        [
          { text: "Cancel", style: "cancel", onPress: hideMenu },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              // Here you would typically call an API to delete the message
              // For now, we'll just remove it from the local state
              setMessages(
                messages.filter((msg) => msg.id !== selectedMessage.id)
              );
              hideMenu();
            },
          },
        ]
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.userId === user?.id;

    return (
      <View style={styles.messageContainer}>
        {!isCurrentUser && (
          <Avatar.Image
            size={32}
            source={{
              uri: item.user.avatar_url || "https://via.placeholder.com/32",
            }}
            style={styles.avatar}
          />
        )}

        <TouchableOpacity
          onLongPress={() => isCurrentUser && showMenu(item)}
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          {!isCurrentUser && (
            <Text style={{ fontWeight: "600", marginBottom: 4 }}>
              {item.user.display_name}
            </Text>
          )}
          <Text style={{ color: theme.colors.onSurface }}>{item.content}</Text>
          <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>

        {isCurrentUser && (
          <Avatar.Image
            size={32}
            source={{
              uri: item.user.avatar_url || "https://via.placeholder.com/32",
            }}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  const renderTypingIndicators = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text
          style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}
        >
          {typingUsers.map((user) => user.display_name).join(", ")} is typing...
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={{ fontSize: 20, fontWeight: "600" }} numberOfLines={1}>
            {squadName}
          </Text>
          <Text
            style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {messages.length} messages
          </Text>
        </View>
        <IconButton icon="information-outline" onPress={() => {}} size={24} />
      </View>

      <Divider />

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        ListFooterComponent={renderTypingIndicators}
      />

      <Menu
        visible={menuVisible}
        onDismiss={hideMenu}
        anchor={menuAnchor.current}
      >
        <Menu.Item onPress={editMessage} title="Edit" />
        <Divider />
        <Menu.Item onPress={deleteMessage} title="Delete" />
      </Menu>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <IconButton icon="plus" onPress={() => {}} size={24} />
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            style={styles.textInput}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            onFocus={startTyping}
            onBlur={stopTyping}
          />
          <IconButton
            icon="send"
            onPress={sendMessage}
            disabled={!newMessage.trim()}
            style={styles.sendButton}
            iconColor={
              newMessage.trim() ? colors.primary : colors.onSurfaceVariant
            }
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.surface,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  currentUserMessage: {
    justifyContent: "flex-end",
  },
  avatar: {
    marginHorizontal: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: colors.surfaceVariant,
    borderBottomLeftRadius: 4,
  },
  messageUserName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  currentUserText: {
    color: "white",
  },
  otherUserText: {
    color: colors.onSurface,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  typingContainer: {
    padding: 16,
    alignItems: "center",
  },
  typingText: {
    color: colors.onSurfaceVariant,
    fontStyle: "italic",
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButton: {
    margin: 0,
  },
});

export default RealTimeChatScreen;
