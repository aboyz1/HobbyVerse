import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  FAB,
  Chip,
  Avatar,
  ActivityIndicator,
  Divider,
  IconButton,
} from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../constants";
import { spacing, typography, colors, shadows } from "../constants/theme";
import { HomeScreenProps } from "../types/navigation";
import { useTabNavigation, navigationHelpers } from "../hooks/useNavigation";
import { MaterialIcons } from "@expo/vector-icons";
import FeedService from "../services/FeedService";
import WebSocketService from "../services/WebSocketService";
import GeneralPostService from "../services/GeneralPostService";

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const tabNavigation = useTabNavigation();
  const parentNavigation = tabNavigation.getParent();
  const theme = useTheme();
  const { user, accessToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "forYou" | "trending" | "discover"
  >("forYou");
  const [recommendations, setRecommendations] = useState<any>({});
  const [realTimeUpdates, setRealTimeUpdates] = useState<Record<string, any>>(
    {}
  );

  // Initialize service with auth token
  useEffect(() => {
    if (accessToken) {
      FeedService.setAuthToken(accessToken);
      GeneralPostService.setAuthToken(accessToken);
    }
  }, [accessToken]);

  // Fetch feed based on active tab
  useEffect(() => {
    fetchFeed();
  }, [accessToken, activeTab]);

  // Setup WebSocket listeners for real-time updates
  useEffect(() => {
    // Connect WebSocket if not already connected
    if (!WebSocketService.isConnected()) {
      WebSocketService.connect();
    }

    // Listen for project updates
    const handleProjectUpdate = (update: any) => {
      switch (update.type) {
        case "LIKE_UPDATE":
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.projectId]: {
              ...prev[update.projectId],
              likeCount: update.likeCount,
              liked:
                update.likedBy === user?.id
                  ? update.liked
                  : prev[update.projectId]?.liked,
            },
          }));
          break;
        case "REPOST_UPDATE":
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.projectId]: {
              ...prev[update.projectId],
              repostCount: update.repostCount,
            },
          }));
          break;
      }
    };

    // Listen for challenge updates
    const handleChallengeUpdate = (update: any) => {
      if (update.type === "NEW_SUBMISSION") {
        // Add new submission to the beginning of the feed if it's a challenge item
        setFeed((prevFeed) => [update.submission, ...prevFeed]);
      }
    };

    // Listen for squad updates
    const handleSquadUpdate = (update: any) => {
      switch (update.type) {
        case "NEW_POST":
          // Add new post to the beginning of the feed if it's a squad post
          setFeed((prevFeed) => [update.post, ...prevFeed]);
          break;
        case "NEW_COMMENT":
          // Update comment count for the post
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.postId]: {
              ...prev[update.postId],
              commentCount: (prev[update.postId]?.commentCount || 0) + 1,
            },
          }));
          break;
        case "POST_VOTE_ADDED":
          // Update helpful votes count for the post
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.postId]: {
              ...prev[update.postId],
              helpfulVotes: update.helpfulVotes,
            },
          }));
          break;
        case "POST_VOTE_REMOVED":
          // Update helpful votes count for the post when vote is removed
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.postId]: {
              ...prev[update.postId],
              helpfulVotes: update.helpfulVotes,
            },
          }));
          break;
        case "COMMENT_VOTE_ADDED":
          // Update helpful votes count for the comment
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.commentId]: {
              ...prev[update.commentId],
              helpfulVotes: update.helpfulVotes,
            },
          }));
          break;
      }
    };

    // Listen for new posts (this might be redundant with squad updates)
    const handleNewPost = (post: any) => {
      // Add new post to the beginning of the feed
      setFeed((prevFeed) => [post, ...prevFeed]);
    };

    // Listen for general post updates
    const handleGeneralPostUpdate = (update: any) => {
      switch (update.type) {
        case "NEW_COMMENT":
          // Update comment count for the general post
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.postId]: {
              ...prev[update.postId],
              commentCount: (prev[update.postId]?.commentCount || 0) + 1,
            },
          }));
          break;
        case "LIKE_UPDATE":
          // Update like count for the general post
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.postId]: {
              ...prev[update.postId],
              likeCount: update.likeCount,
              liked:
                update.likedBy === user?.id
                  ? update.liked
                  : prev[update.postId]?.liked,
            },
          }));
          break;
        case "REPOST_UPDATE":
          // Update repost count for the general post
          setRealTimeUpdates((prev) => ({
            ...prev,
            [update.postId]: {
              ...prev[update.postId],
              repostCount: update.repostCount,
            },
          }));
          break;
      }
    };

    WebSocketService.on("project_update", handleProjectUpdate);
    WebSocketService.on("challenge_update", handleChallengeUpdate);
    WebSocketService.on("squad_update", handleSquadUpdate);
    WebSocketService.on("new_post", handleNewPost);
    WebSocketService.on("general_post_update", handleGeneralPostUpdate);

    // Cleanup
    return () => {
      WebSocketService.off("project_update", handleProjectUpdate);
      WebSocketService.off("challenge_update", handleChallengeUpdate);
      WebSocketService.off("squad_update", handleSquadUpdate);
      WebSocketService.off("new_post", handleNewPost);
      WebSocketService.off("general_post_update", handleGeneralPostUpdate);
    };
  }, [user?.id]);

  // Fetch recommendations (now handled in fetchFeed)
  useEffect(() => {
    // This effect is kept for backward compatibility but does nothing
    // Recommendations are now fetched in fetchFeed when activeTab is "discover"
  }, []);

  // Fetch feed based on active tab
  const fetchFeed = async () => {
    try {
      setLoading(true);

      // Fetch from actual API based on active tab
      let response;
      switch (activeTab) {
        case "forYou":
          response = await FeedService.getFeed(1, 20);
          break;
        case "trending":
          response = await FeedService.getGlobalFeed(1, 20);
          break;
        case "discover":
          response = await FeedService.getRecommendations();
          break;
        default:
          response = await FeedService.getFeed(1, 20);
      }

      if (response.success) {
        if (activeTab === "discover") {
          // For discover tab, we get recommendations object
          setRecommendations(response.data);
          setFeed([]); // Clear feed for discover tab
        } else {
          // For forYou and trending tabs, we get feed array
          setFeed(response.data || []);
          setRecommendations({}); // Clear recommendations for feed tabs
        }
      } else {
        throw new Error(response.error || "Failed to load feed");
      }
    } catch (err) {
      console.log("Failed to load feed", err);
      // Fallback to mock data on error
      const mockFeed = [
        {
          id: "1",
          type: "project",
          title: "My First Arduino Project",
          description:
            "Just finished building my first Arduino-based weather station! Here's how it works...",
          user: {
            id: "user1",
            display_name: "TechEnthusiast",
            avatar_url: "https://via.placeholder.com/40",
          },
          project: {
            id: "proj1",
            title: "Arduino Weather Station",
            thumbnail_url: "https://via.placeholder.com/200",
          },
          likes: 24,
          comments: 8,
          reposts: 5,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          type: "challenge",
          title: "30-Day Drawing Challenge - Day 15",
          description:
            "Today's prompt was 'fantasy creature'. I decided to draw a dragon with butterfly wings!",
          user: {
            id: "user2",
            display_name: "ArtLover",
            avatar_url: "https://via.placeholder.com/40",
          },
          challenge: {
            id: "chal1",
            title: "30-Day Drawing Challenge",
          },
          likes: 42,
          comments: 15,
          reposts: 3,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "3",
          type: "squad_post",
          title: "Woodworking Tips",
          description:
            "Just discovered this amazing technique for creating smooth curves in wood. Check out this video!",
          user: {
            id: "user3",
            display_name: "MasterCraftsman",
            avatar_url: "https://via.placeholder.com/40",
          },
          squad: {
            id: "squad1",
            name: "Woodworking Wizards",
            avatar_url: "https://via.placeholder.com/40",
          },
          likes: 18,
          comments: 5,
          reposts: 7,
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
      ];

      setFeed(mockFeed);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    // Recommendations are now fetched in fetchFeed when activeTab is "discover"
    // This function is kept for backward compatibility but does nothing
    return;
  };

  // Refresh feed
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  // Render feed item
  const renderFeedItem = ({ item }: { item: any }) => {
    // Determine item type and properties based on API response
    const getItemType = () => {
      if (item.type) return item.type;
      if (item.project_id) return "project";
      if (item.challenge_id) return "challenge";
      if (item.squad_id) return "squad_post";
      if (
        item.user_id &&
        item.content &&
        !item.project_id &&
        !item.challenge_id &&
        !item.squad_id
      )
        return "general_post";
      return "post";
    };

    const type = getItemType();

    // Get real-time updated values if available
    const realTimeData = realTimeUpdates[item.id] || {};
    const currentLikeCount =
      realTimeData.likeCount !== undefined
        ? realTimeData.likeCount
        : item.like_count || item.likes || 0;
    const currentCommentCount =
      realTimeData.commentCount !== undefined
        ? realTimeData.commentCount
        : item.comment_count || item.comments || 0;
    const currentRepostCount =
      realTimeData.repostCount !== undefined
        ? realTimeData.repostCount
        : item.repost_count || item.reposts || 0;
    const isLiked =
      realTimeData.liked !== undefined
        ? realTimeData.liked
        : item.is_liked || false;

    const getTitle = () => {
      if (item.title) return item.title;
      if (item.project?.title) return item.project.title;
      if (item.challenge?.title) return item.challenge.title;
      // For general posts, don't show a title
      if (type === "general_post") return "";
      return "Untitled";
    };

    const getContent = () => {
      if (item.description) return item.description;
      if (item.content) return item.content;
      if (item.project?.description) return item.project.description;
      return "";
    };

    const getUserDisplayName = () => {
      if (item.creator_name) return item.creator_name;
      if (item.user?.display_name) return item.user.display_name;
      return "Unknown User";
    };

    const getUserAvatar = () => {
      if (item.creator_avatar) return item.creator_avatar;
      if (item.user?.avatar_url) return item.user.avatar_url;
      return "https://via.placeholder.com/40";
    };

    const getIcon = () => {
      switch (type) {
        case "project":
          return "folder";
        case "challenge":
          return "emoji-events";
        case "squad_post":
          return "people";
        case "general_post":
          return "chat";
        default:
          return "chat";
      }
    };

    const getIconColor = () => {
      switch (type) {
        case "project":
          return colors.primary;
        case "challenge":
          return colors.secondary;
        case "squad_post":
          return colors.tertiary;
        case "general_post":
          return colors.primary;
        default:
          return colors.onSurfaceVariant;
      }
    };

    // Handle like action
    const handleLike = async () => {
      try {
        if (type === "project" && item.id) {
          // Call the actual like API
          const response = await fetch(
            `${API_BASE_URL}/projects/${item.id}/like`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          const result = await response.json();
          if (result.success) {
            // Update local state with the response from the API
            setRealTimeUpdates((prev) => ({
              ...prev,
              [item.id]: {
                ...prev[item.id],
                likeCount: result.likeCount,
                liked: result.liked,
              },
            }));
          }
        } else if (type === "general_post" && item.id) {
          // Handle like for general posts
          const response = await GeneralPostService.likePost(item.id);

          if (response.success) {
            // Update local state with the response from the API
            setRealTimeUpdates((prev) => ({
              ...prev,
              [item.id]: {
                ...prev[item.id],
                likeCount: response.data?.likeCount || 0,
                liked: response.data?.liked || false,
              },
            }));
          }
        }
      } catch (error) {
        console.log("Failed to like item", error);
      }
    };

    // Handle repost action
    const handleRepost = async () => {
      try {
        if (type === "project" && item.id) {
          // Call the actual repost API
          const response = await fetch(
            `${API_BASE_URL}/projects/${item.id}/repost`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          const result = await response.json();
          if (result.success) {
            // Update local state with the response from the API
            setRealTimeUpdates((prev) => ({
              ...prev,
              [item.id]: {
                ...prev[item.id],
                repostCount: result.repostCount,
              },
            }));
          }
        } else if (type === "general_post" && item.id) {
          // Handle repost for general posts
          const response = await GeneralPostService.repostPost(item.id);

          if (response.success) {
            // Update local state with the response from the API
            setRealTimeUpdates((prev) => ({
              ...prev,
              [item.id]: {
                ...prev[item.id],
                repostCount: response.data?.repostCount || 0,
              },
            }));
          }
        }
      } catch (error) {
        console.log("Failed to repost item", error);
      }
    };

    return (
      <View style={styles.feedItemContainer}>
        <View style={styles.feedItemHeader}>
          <Avatar.Image size={40} source={{ uri: getUserAvatar() }} />
          <View style={styles.feedItemUserInfo}>
            <Text style={styles.feedItemUserName}>{getUserDisplayName()}</Text>
            <Text style={styles.feedItemTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.feedItemTypeBadge}>
            <MaterialIcons name={getIcon()} size={16} color={getIconColor()} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.feedItemContent}
          onPress={() => {
            // Navigate based on item type
            switch (type) {
              case "project":
                if (item.project?.id) {
                  parentNavigation?.navigate("ProjectDetails", {
                    projectId: item.project.id,
                  });
                } else if (item.id) {
                  parentNavigation?.navigate("ProjectDetails", {
                    projectId: item.id,
                  });
                }
                break;
              case "challenge":
                if (item.challenge?.id) {
                  parentNavigation?.navigate("ChallengeDetails", {
                    challengeId: item.challenge.id,
                  });
                } else if (item.challenge_id) {
                  parentNavigation?.navigate("ChallengeDetails", {
                    challengeId: item.challenge_id,
                  });
                } else if (item.id) {
                  parentNavigation?.navigate("ChallengeDetails", {
                    challengeId: item.id,
                  });
                }
                break;
              case "squad_post":
                if (item.squad_id) {
                  parentNavigation?.navigate("SquadDetails", {
                    squadId: item.squad_id,
                  });
                }
                break;
              case "general_post":
                // Navigate to general post details screen
                if (item.id) {
                  parentNavigation?.navigate("GeneralPostDetails", {
                    postId: item.id,
                  });
                }
                break;
            }
          }}
        >
          {/* Only show title if it's not empty (for general posts, title will be empty) */}
          {getTitle() ? (
            <Text style={styles.feedItemTitle}>{getTitle()}</Text>
          ) : null}

          <Text style={styles.feedItemText}>{getContent()}</Text>

          {item.thumbnail_url && (
            <Avatar.Image
              size={80}
              source={{ uri: item.thumbnail_url }}
              style={styles.feedItemThumbnail}
            />
          )}
        </TouchableOpacity>

        <View style={styles.feedItemActions}>
          <TouchableOpacity style={styles.feedItemAction} onPress={handleLike}>
            <MaterialIcons
              name={isLiked ? "favorite" : "favorite-border"}
              size={18}
              color={isLiked ? colors.like : theme.colors.onSurfaceVariant}
            />
            <Text style={styles.feedItemActionText}>{currentLikeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedItemAction}
            onPress={() => {
              // Navigate to the appropriate detail screen based on item type
              switch (type) {
                case "project":
                  if (item.project?.id) {
                    parentNavigation?.navigate("ProjectDetails", {
                      projectId: item.project.id,
                    });
                  } else if (item.id) {
                    parentNavigation?.navigate("ProjectDetails", {
                      projectId: item.id,
                    });
                  }
                  break;
                case "challenge":
                  if (item.challenge?.id) {
                    parentNavigation?.navigate("ChallengeDetails", {
                      challengeId: item.challenge.id,
                    });
                  } else if (item.challenge_id) {
                    parentNavigation?.navigate("ChallengeDetails", {
                      challengeId: item.challenge_id,
                    });
                  } else if (item.id) {
                    parentNavigation?.navigate("ChallengeDetails", {
                      challengeId: item.id,
                    });
                  }
                  break;
                case "squad_post":
                  // For squad posts, navigate to the post details screen
                  if (item.id) {
                    parentNavigation?.navigate("SquadPostDetails", {
                      postId: item.id,
                      squadId: item.squad_id,
                    });
                  } else if (item.squad_id) {
                    // Fallback to squad details if we don't have the post ID
                    parentNavigation?.navigate("SquadDetails", {
                      squadId: item.squad_id,
                    });
                  }
                  break;
                case "general_post":
                  // For general posts, navigate to the post details screen
                  if (item.id) {
                    parentNavigation?.navigate("GeneralPostDetails", {
                      postId: item.id,
                    });
                  }
                  break;
                default:
                  // For other types, try to determine the appropriate screen
                  if (item.id) {
                    if (item.project?.id) {
                      parentNavigation?.navigate("ProjectDetails", {
                        projectId: item.project.id,
                      });
                    } else if (item.challenge?.id) {
                      parentNavigation?.navigate("ChallengeDetails", {
                        challengeId: item.challenge.id,
                      });
                    } else if (item.squad_id) {
                      parentNavigation?.navigate("SquadPostDetails", {
                        postId: item.id,
                        squadId: item.squad_id,
                      });
                    } else if (type === "general_post") {
                      parentNavigation?.navigate("GeneralPostDetails", {
                        postId: item.id,
                      });
                    }
                  }
                  break;
              }
            }}
          >
            <MaterialIcons
              name="chat-bubble-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.feedItemActionText}>{currentCommentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedItemAction}
            onPress={handleRepost}
          >
            <MaterialIcons
              name="autorenew"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.feedItemActionText}>{currentRepostCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.feedItemAction}>
            <MaterialIcons
              name="share"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // renderPostItem function was removed as it was not being used and causing TypeScript errors

  // Render recommendations
  const renderRecommendations = () => (
    <View style={styles.recommendationsContainer}>
      {/* Recommended Projects */}
      <View style={styles.recommendationSection}>
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.recommendationTitle,
              { color: theme.colors.onBackground, ...typography.h5 },
            ]}
          >
            Recommended Projects
          </Text>
          <Button
            mode="text"
            onPress={() => parentNavigation?.navigate("Projects")}
            textColor={colors.primary}
            style={styles.seeAllButton}
          >
            See All
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recommendationList}
          contentContainerStyle={styles.recommendationListContent}
        >
          {recommendations.projects?.map((project: any) => (
            <Card
              key={project.id}
              style={[
                styles.recommendationCard,
                { backgroundColor: theme.colors.surface, ...shadows.small },
              ]}
              onPress={() =>
                parentNavigation?.navigate("ProjectDetails", {
                  projectId: project.id,
                })
              }
            >
              <Card.Content style={styles.recommendationCardContent}>
                <Avatar.Image
                  size={60}
                  source={{ uri: project.thumbnail_url }}
                />
                <Text
                  style={[
                    styles.recommendationCardTitle,
                    {
                      color: theme.colors.onBackground,
                      ...typography.h6,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {project.title}
                </Text>
                <Text
                  style={[
                    styles.recommendationCardSubtitle,
                    {
                      color: theme.colors.onSurfaceVariant,
                      ...typography.caption,
                    },
                  ]}
                  numberOfLines={1}
                >
                  by {project.creator}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      <Divider style={styles.recommendationDivider} />

      {/* Recommended Squads */}
      <View style={styles.recommendationSection}>
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.recommendationTitle,
              { color: theme.colors.onBackground, ...typography.h5 },
            ]}
          >
            Recommended Squads
          </Text>
          <Button
            mode="text"
            onPress={() => parentNavigation?.navigate("Squads")}
            textColor={colors.primary}
            style={styles.seeAllButton}
          >
            See All
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recommendationList}
          contentContainerStyle={styles.recommendationListContent}
        >
          {recommendations.squads?.map((squad: any) => (
            <Card
              key={squad.id}
              style={[
                styles.recommendationCard,
                { backgroundColor: theme.colors.surface, ...shadows.small },
              ]}
              onPress={() =>
                parentNavigation?.navigate("SquadDetails", {
                  squadId: squad.id,
                })
              }
            >
              <Card.Content style={styles.recommendationCardContent}>
                <Avatar.Image size={60} source={{ uri: squad.avatar_url }} />
                <Text
                  style={[
                    styles.recommendationCardTitle,
                    {
                      color: theme.colors.onBackground,
                      ...typography.h6,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {squad.name}
                </Text>
                <Text
                  style={[
                    styles.recommendationCardSubtitle,
                    {
                      color: theme.colors.onSurfaceVariant,
                      ...typography.caption,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {squad.member_count} members
                </Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      <Divider style={styles.recommendationDivider} />

      {/* Recommended Challenges */}
      <View style={styles.recommendationSection}>
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.recommendationTitle,
              { color: theme.colors.onBackground, ...typography.h5 },
            ]}
          >
            Recommended Challenges
          </Text>
          <Button
            mode="text"
            onPress={() => parentNavigation?.navigate("Challenges")}
            textColor={colors.primary}
            style={styles.seeAllButton}
          >
            See All
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recommendationList}
          contentContainerStyle={styles.recommendationListContent}
        >
          {recommendations.challenges?.map((challenge: any) => (
            <Card
              key={challenge.id}
              style={[
                styles.recommendationCard,
                { backgroundColor: theme.colors.surface, ...shadows.small },
              ]}
              onPress={() =>
                parentNavigation?.navigate("ChallengeDetails", {
                  challengeId: challenge.id,
                })
              }
            >
              <Card.Content style={styles.recommendationCardContent}>
                <Avatar.Icon
                  size={60}
                  icon="trophy"
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                />
                <Text
                  style={[
                    styles.recommendationCardTitle,
                    {
                      color: theme.colors.onBackground,
                      ...typography.h6,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {challenge.title}
                </Text>
                <Text
                  style={[
                    styles.recommendationCardSubtitle,
                    {
                      color: theme.colors.onSurfaceVariant,
                      ...typography.caption,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {challenge.participants} participants
                </Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Render trending content
  const renderTrending = () => (
    <View style={styles.trendingContainer}>
      <MaterialIcons
        name="trending-up"
        size={64}
        color={colors.primary}
        style={styles.trendingIcon}
      />
      <Text
        style={[
          styles.trendingText,
          { color: theme.colors.onSurface, ...typography.h5 },
        ]}
      >
        Trending Content
      </Text>
      <Text
        style={[
          styles.trendingSubtext,
          {
            color: theme.colors.onSurfaceVariant,
            ...typography.body1,
            textAlign: "center",
          },
        ]}
      >
        This section would show the most popular projects, challenges, and squad
        discussions based on engagement and activity.
      </Text>
      <Button
        mode="outlined"
        onPress={() => parentNavigation?.navigate("Projects")} // Fixed to navigate to Projects screen
        style={styles.trendingButton}
        textColor={colors.primary}
      >
        Explore Trending
      </Button>
    </View>
  );

  if (loading && feed.length === 0) {
    return (
      <View
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
            Loading feed...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header - Simplified Twitter-like design */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top + spacing.md,
          },
        ]}
      >
        <Text
          style={[
            styles.appName,
            {
              color: theme.colors.onBackground,
              ...typography.h4,
            },
          ]}
        >
          Hobbyverse
        </Text>
      </View>

      {/* Tab Selector - Streamlined design */}
      <View
        style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === "forYou" && styles.activeTab]}
          onPress={() => setActiveTab("forYou")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "forYou"
                ? { color: theme.colors.primary, ...typography.h6 }
                : { color: theme.colors.onSurfaceVariant, ...typography.body1 },
            ]}
          >
            For You
          </Text>
          {activeTab === "forYou" && (
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "trending" && styles.activeTab]}
          onPress={() => setActiveTab("trending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "trending"
                ? { color: theme.colors.primary, ...typography.h6 }
                : { color: theme.colors.onSurfaceVariant, ...typography.body1 },
            ]}
          >
            Trending
          </Text>
          {activeTab === "trending" && (
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "discover" && styles.activeTab]}
          onPress={() => setActiveTab("discover")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "discover"
                ? { color: theme.colors.primary, ...typography.h6 }
                : { color: theme.colors.onSurfaceVariant, ...typography.body1 },
            ]}
          >
            Discover
          </Text>
          {activeTab === "discover" && (
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      <Divider />

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
        {activeTab === "forYou" && (
          <>
            {feed.length > 0 ? (
              <View style={styles.feedContainer}>
                {feed.map((item) => (
                  <View key={item.id} style={styles.feedItemWrapper}>
                    {renderFeedItem({ item })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.centered}>
                <MaterialIcons
                  name="rss-feed"
                  size={64}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  style={{
                    marginTop: spacing.md,
                    color: theme.colors.onBackground,
                    ...typography.h5,
                  }}
                >
                  No Feed Content
                </Text>
                <Text
                  style={{
                    marginTop: spacing.sm,
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                    ...typography.body1,
                    maxWidth: 300,
                    lineHeight: 22,
                  }}
                >
                  Follow projects, join squads, and participate in challenges to
                  see personalized content here.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => parentNavigation?.navigate("Projects")}
                  style={styles.exploreButton}
                  buttonColor={theme.colors.primary}
                >
                  Explore Projects
                </Button>
              </View>
            )}
          </>
        )}

        {activeTab === "trending" && renderTrending()}

        {activeTab === "discover" && renderRecommendations()}
      </ScrollView>

      <FAB
        icon="plus"
        color="#FFFFFF"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: spacing.md + insets.bottom,
          },
        ]}
        onPress={() => {
          // Navigate to create general post screen
          parentNavigation?.navigate("CreateGeneralPost");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    // No extra padding needed
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  header: {
    // paddingTop will be applied inline using insets.top + spacing.md
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  appName: {
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  tabText: {
    fontWeight: "600",
  },
  activeTab: {
    // No additional styling needed
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "50%",
    borderRadius: 2,
  },
  feedContainer: {
    // No padding needed for cleaner look
  },
  feedItemWrapper: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  feedItemContainer: {
    padding: spacing.md,
  },
  feedItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  feedItemUserInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  feedItemUserName: {
    ...typography.h6,
    fontWeight: "600",
  },
  feedItemTime: {
    ...typography.caption,
    color: colors.placeholder,
  },
  feedItemTypeBadge: {
    padding: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
  },
  feedItemContent: {
    marginBottom: spacing.sm,
  },
  feedItemTitle: {
    ...typography.h5,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  feedItemText: {
    ...typography.body1,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  feedItemThumbnail: {
    alignSelf: "flex-start",
    borderRadius: 8,
  },
  feedItemActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.divider,
  },
  feedItemAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedItemActionText: {
    marginLeft: spacing.xs,
    ...typography.caption,
    color: colors.placeholder,
  },
  trendingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  trendingIcon: {
    marginBottom: spacing.lg,
  },
  trendingText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  trendingSubtext: {
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
    maxWidth: 300,
  },
  trendingButton: {
    borderRadius: 8,
  },
  recommendationsContainer: {
    padding: spacing.md,
  },
  recommendationSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  recommendationTitle: {
    marginBottom: 0,
  },
  seeAllButton: {
    padding: 0,
  },
  recommendationList: {
    flexDirection: "row",
  },
  recommendationListContent: {
    paddingRight: spacing.sm,
  },
  recommendationCard: {
    width: 150,
    marginRight: spacing.md,
    borderRadius: 16,
  },
  recommendationCardContent: {
    alignItems: "center",
    padding: spacing.md,
  },
  recommendationCardTitle: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  recommendationCardSubtitle: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  recommendationDivider: {
    marginVertical: spacing.lg,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 28,
  },
  exploreButton: {
    marginTop: spacing.lg,
    borderRadius: 8,
  },
  // Post item styles
  postCard: {
    margin: spacing.md,
    borderRadius: 8,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  postAvatar: {
    marginRight: spacing.sm,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontWeight: "600",
  },
  postTime: {
    color: colors.placeholder,
    fontSize: 12,
  },
  postMenuButton: {
    margin: 0,
    padding: 0,
  },
  postContent: {
    marginBottom: spacing.md,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
  },
  actionText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    color: colors.placeholder,
  },
});

export default HomeScreen;
