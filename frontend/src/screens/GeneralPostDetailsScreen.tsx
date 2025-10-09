import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
  IconButton,
  ActivityIndicator,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import GeneralPostService from "../services/GeneralPostService";
import { spacing, typography, colors } from "../constants/theme";
import { GeneralPostDetailsScreenProps } from "../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";

const GeneralPostDetailsScreen: React.FC<GeneralPostDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { postId } = route.params;
  const theme = useTheme();
  const { user, accessToken } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      GeneralPostService.setAuthToken(accessToken);
      fetchPostDetails();
    }
  }, [postId, accessToken]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const postResponse = await GeneralPostService.getPostById(postId);

      if (postResponse.success) {
        setPost(postResponse.data);

        // Get comments for this post
        const commentsResponse = await GeneralPostService.getPostComments(
          postId,
          1,
          100
        );
        if (commentsResponse.success) {
          setComments(commentsResponse.data);
        }
      } else {
        setError(postResponse.error || "Failed to load post details");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching post details");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPostDetails();
    setRefreshing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await GeneralPostService.createComment(
        postId,
        newComment.trim()
      );

      if (response.success) {
        setNewComment("");
        // Refresh comments
        fetchPostDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to add comment");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred while adding comment"
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikePost = async () => {
    try {
      const response = await GeneralPostService.likePost(postId);
      if (response.success) {
        // Refresh post details to update like status
        fetchPostDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to like post");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred while liking post"
      );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = () => {
    if (!post) return null;

    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.userRow}>
            <Avatar.Image
              size={44}
              source={{
                uri: post.user_avatar_url || "https://via.placeholder.com/44",
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text variant="titleMedium" style={styles.userName}>
                {post.user_display_name}
              </Text>
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>
          </TouchableOpacity>

          <IconButton
            icon="dots-horizontal"
            size={20}
            onPress={() => {}}
            style={styles.moreOptionsButton}
          />
        </View>

        {/* Post Content */}
        <View style={styles.postContentContainer}>
          <Text variant="bodyLarge" style={styles.postContent}>
            {post.content}
          </Text>
        </View>

        {/* Post Stats */}
        <View style={styles.postStats}>
          <Text variant="bodySmall" style={styles.statText}>
            {post.like_count || 0} likes
          </Text>
          <Text variant="bodySmall" style={styles.statText}>
            {post.comment_count || 0} comments
          </Text>
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLikePost}
          >
            <MaterialIcons
              name={post.liked ? "favorite" : "favorite-outline"}
              size={20}
              color={post.liked ? colors.like : theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.actionText,
                {
                  color: post.liked
                    ? colors.like
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons
              name="autorenew"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.actionText}>Repost</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons
              name="share"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderComments = () => {
    if (comments.length === 0) {
      return (
        <View style={styles.emptyCommentsContainer}>
          <MaterialIcons
            name="chat"
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="titleMedium" style={styles.emptyCommentsText}>
            No comments yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyCommentsSubtext}>
            Be the first to share what you think!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.commentsContainer}>
        <Text variant="titleMedium" style={styles.commentsHeader}>
          Comments ({comments.length})
        </Text>
        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentContainer}>
            <Avatar.Image
              size={36}
              source={{
                uri:
                  comment.user_avatar_url || "https://via.placeholder.com/36",
              }}
              style={styles.commentAvatar}
            />
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text variant="titleSmall" style={styles.commentUserName}>
                  {comment.user_display_name}
                </Text>
                <Text variant="bodySmall" style={styles.commentTimestamp}>
                  {formatTimeAgo(comment.created_at)}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.commentText}>
                {comment.content}
              </Text>
              <View style={styles.commentActions}>
                <TouchableOpacity style={styles.commentActionButton}>
                  <Text style={styles.commentActionText}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentActionButton}>
                  <Text style={styles.commentActionText}>Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCommentInput = () => (
    <View style={styles.commentInputContainer}>
      <Avatar.Image
        size={36}
        source={{ uri: user?.avatar_url || "https://via.placeholder.com/36" }}
        style={styles.inputAvatar}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          mode="flat"
          multiline
          numberOfLines={2}
          style={styles.commentInput}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        <IconButton
          icon="send"
          onPress={handleAddComment}
          disabled={!newComment.trim() || submittingComment}
          loading={submittingComment}
          size={20}
          style={[
            styles.sendButton,
            (!newComment.trim() || submittingComment) &&
              styles.sendButtonDisabled,
          ]}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={theme.colors.error}
          />
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Error
          </Text>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={fetchPostDetails}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {renderPost()}
          <Divider style={styles.divider} />
          {renderComments()}
        </ScrollView>
        {renderCommentInput()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorTitle: {
    marginTop: spacing.md,
    color: colors.error,
    fontWeight: "600",
  },
  errorText: {
    color: colors.onSurface,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.lg,
    borderRadius: 24,
    minWidth: 120,
  },

  // Post Styles
  postContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    marginRight: spacing.sm,
  },
  userInfo: {
    justifyContent: "center",
  },
  userName: {
    fontWeight: "600",
    color: colors.onSurface,
  },
  timestamp: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  moreOptionsButton: {
    margin: 0,
  },

  postContentContainer: {
    marginBottom: spacing.md,
  },
  postContent: {
    lineHeight: 22,
    color: colors.onSurface,
    fontSize: 16,
  },

  postStats: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  statText: {
    color: colors.onSurfaceVariant,
    marginRight: spacing.lg,
    fontSize: 13,
  },

  postActions: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.divider,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  actionText: {
    marginLeft: spacing.xs,
    fontSize: 15,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },

  // Comments Styles
  commentsContainer: {
    padding: spacing.md,
  },
  commentsHeader: {
    marginBottom: spacing.md,
    color: colors.onSurface,
    fontWeight: "600",
  },
  commentContainer: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  commentAvatar: {
    marginRight: spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  commentUserName: {
    fontWeight: "600",
    color: colors.onSurface,
    marginRight: spacing.xs,
  },
  commentTimestamp: {
    color: colors.onSurfaceVariant,
  },
  commentText: {
    color: colors.onSurface,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  commentActions: {
    flexDirection: "row",
  },
  commentActionButton: {
    marginRight: spacing.lg,
  },
  commentActionText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },

  // Empty Comments
  emptyCommentsContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyCommentsText: {
    marginTop: spacing.md,
    color: colors.onSurface,
    fontWeight: "600",
  },
  emptyCommentsSubtext: {
    marginTop: spacing.xs,
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },

  // Comment Input
  commentInputContainer: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderColor: colors.divider,
  },
  inputAvatar: {
    marginRight: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surfaceVariant,
    borderRadius: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  commentInput: {
    flex: 1,
    margin: 0,
    padding: 0,
    paddingHorizontal: spacing.xs,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  sendButton: {
    margin: 0,
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceVariant,
  },

  // Divider
  divider: {
    height: 8,
    backgroundColor: colors.background,
  },
});

export default GeneralPostDetailsScreen;
