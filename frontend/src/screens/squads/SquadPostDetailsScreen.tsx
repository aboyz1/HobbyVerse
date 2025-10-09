import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput as RNTextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from "../../contexts/AuthContext";
import SquadService from "../../services/SquadService";
import { spacing, typography, colors } from "../../constants/theme";
import { SquadPostDetailsScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";

const SquadPostDetailsScreen: React.FC<SquadPostDetailsScreenProps> = ({
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
    SquadService.setAuthToken(accessToken);
    fetchPostDetails();
  }, [postId, accessToken]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const postResponse = await SquadService.getPostById(postId);

      if (postResponse.success) {
        setPost(postResponse.data);

        // Get comments for this post
        const commentsResponse = await SquadService.getPostComments(
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
      const response = await SquadService.createComment(postId, {
        content: newComment.trim(),
      });

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

  const handleVoteOnPost = async () => {
    try {
      const response = await SquadService.voteOnPost(postId);
      if (response.success) {
        // Refresh post details to update vote status
        fetchPostDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to vote on post");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred while voting on post"
      );
    }
  };

  const handleVoteOnComment = async (commentId: string) => {
    try {
      const response = await SquadService.voteOnComment(commentId);
      if (response.success) {
        // Refresh comments to update vote status
        fetchPostDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to vote on comment");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred while voting on comment"
      );
    }
  };

  const renderPost = () => {
    if (!post) return null;

    return (
      <Card style={styles.postCard}>
        <Card.Content>
          <View style={styles.postHeader}>
            <Avatar.Text size={40} label={post.user_name.charAt(0)} />
            <View style={styles.postUserInfo}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {post.user_name}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {new Date(post.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <Text
            variant="bodyLarge"
            style={[styles.postContent, { color: theme.colors.onSurface }]}
          >
            {post.content}
          </Text>

          <View style={styles.postActions}>
            <Button
              mode="outlined"
              onPress={handleVoteOnPost}
              style={styles.actionButton}
              icon={post.has_voted ? "thumb-up" : "thumb-up-outline"}
              textColor={
                post.has_voted ? colors.like : theme.colors.onSurfaceVariant
              }
            >
              {post.helpful_votes || 0}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderComments = () => {
    if (comments.length === 0) {
      return (
        <Card style={styles.commentsSection}>
          <Card.Content>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              No comments yet. Be the first to comment!
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <View style={styles.commentsSection}>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          Comments ({comments.length})
        </Text>
        {comments.map((comment) => (
          <Card key={comment.id} style={styles.commentCard}>
            <Card.Content>
              <View style={styles.commentHeader}>
                <Avatar.Text size={32} label={comment.user_name.charAt(0)} />
                <View style={styles.commentUserInfo}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface }}
                  >
                    {comment.user_name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {new Date(comment.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={() => handleVoteOnComment(comment.id)}
                  style={styles.commentVoteButton}
                  icon={comment.has_voted ? "thumb-up" : "thumb-up-outline"}
                  textColor={
                    comment.has_voted
                      ? colors.like
                      : theme.colors.onSurfaceVariant
                  }
                  compact
                >
                  {comment.helpful_votes || 0}
                </Button>
              </View>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, marginTop: spacing.sm }}
              >
                {comment.content}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderAddComment = () => (
    <Card style={styles.addCommentCard}>
      <Card.Content>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          Add Comment
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Write your comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          numberOfLines={3}
          style={styles.commentInput}
          disabled={submittingComment}
        />
        <Button
          mode="contained"
          onPress={handleAddComment}
          loading={submittingComment}
          disabled={!newComment.trim() || submittingComment}
          style={styles.submitButton}
        >
          Post Comment
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              marginTop: spacing.md,
              color: theme.colors.onSurfaceVariant,
              ...typography.body1,
            }}
          >
            Loading post details...
          </Text>
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
            size={64}
            color={theme.colors.error}
          />
          <Text
            style={{
              marginTop: spacing.md,
              color: theme.colors.onBackground,
              ...typography.h6,
            }}
          >
            Error
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              ...typography.body1,
            }}
          >
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {renderPost()}
          {renderComments()}
          {renderAddComment()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  postCard: {
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  postUserInfo: {
    marginLeft: spacing.sm,
  },
  postContent: {
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  actionButton: {
    borderRadius: 8,
  },
  commentsSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: "600",
  },
  commentCard: {
    marginBottom: spacing.sm,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentUserInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  commentVoteButton: {
    borderRadius: 8,
  },
  addCommentCard: {
    marginBottom: spacing.lg,
  },
  commentInput: {
    marginBottom: spacing.md,
  },
  submitButton: {
    borderRadius: 8,
  },
  retryButton: {
    marginTop: spacing.lg,
    borderRadius: 8,
  },
});

export default SquadPostDetailsScreen;
