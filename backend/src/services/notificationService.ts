import { query } from "../config/database";
import { createNotification } from "../routes/notifications";
import { emitNewNotification } from "./socketService";
import { Server as SocketIOServer } from "socket.io";

// Notification types
const NOTIFICATION_TYPES = {
  SQUAD_POST: "squad_post",
  SQUAD_MEMBER_JOIN: "squad_member_join",
  PROJECT_UPDATE: "project_update",
  CHALLENGE_DEADLINE: "challenge_deadline",
  BADGE_EARNED: "badge_earned",
  FOLLOW_USER: "follow_user",
  COMMENT_REPLY: "comment_reply",
  POST_MENTION: "post_mention",
  CHAT_MESSAGE: "chat_message",
};

// Notification titles
const NOTIFICATION_TITLES = {
  [NOTIFICATION_TYPES.SQUAD_POST]: "New Squad Post",
  [NOTIFICATION_TYPES.SQUAD_MEMBER_JOIN]: "New Squad Member",
  [NOTIFICATION_TYPES.PROJECT_UPDATE]: "Project Update",
  [NOTIFICATION_TYPES.CHALLENGE_DEADLINE]: "Challenge Deadline",
  [NOTIFICATION_TYPES.BADGE_EARNED]: "Badge Earned!",
  [NOTIFICATION_TYPES.FOLLOW_USER]: "New Follower",
  [NOTIFICATION_TYPES.COMMENT_REPLY]: "New Reply",
  [NOTIFICATION_TYPES.POST_MENTION]: "You Were Mentioned",
  [NOTIFICATION_TYPES.CHAT_MESSAGE]: "New Message",
};

let io: SocketIOServer;

export const setSocketIO = (socketIO: SocketIOServer) => {
  io = socketIO;
};

/**
 * Create and send a notification to a user
 */
export const sendNotification = async (
  userId: string,
  type: string,
  message: string,
  data?: any,
  actionUrl?: string
): Promise<void> => {
  try {
    const title = NOTIFICATION_TITLES[type] || "Notification";

    // Create notification in database
    await createNotification(userId, title, message, type, data, actionUrl);

    // Emit real-time notification if io is set
    if (io) {
      // Get notification with proper data format
      const notificationResult = await query(
        `SELECT *, 
         CASE 
           WHEN data IS NOT NULL THEN data::jsonb 
           ELSE '{}'::jsonb 
         END as data
         FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (notificationResult.rows.length > 0) {
        const notification = notificationResult.rows[0];
        emitNewNotification(io, userId, notification);
      }
    }

    // Send push notification if user has Expo push token
    const userResult = await query(
      `SELECT expo_push_token, notification_preferences FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const prefs = user.notification_preferences || {};

      // Check if user has enabled this type of notification
      const shouldSendPush =
        prefs.push_notifications !== false &&
        prefs[`${type}_notifications`] !== false;

      if (user.expo_push_token && shouldSendPush) {
        await sendPushNotification(user.expo_push_token, title, message);
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Send push notification via Expo
 */
const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string
): Promise<void> => {
  try {
    // In a real implementation, you would use the Expo SDK to send push notifications
    // For now, we'll just log it
    console.log(`Push notification to ${expoPushToken}: ${title} - ${body}`);

    // Example implementation with Expo:
    /*
    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();
    
    const messages = [{
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: { title, body }
    }];
    
    const ticket = await expo.sendPushNotificationsAsync(messages);
    console.log('Push notification ticket:', ticket);
    */
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

/**
 * Send notification to all squad members
 */
export const sendSquadNotification = async (
  squadId: string,
  type: string,
  message: string,
  data?: any,
  excludeUserId?: string
): Promise<void> => {
  try {
    // Get all squad members
    const membersResult = await query(
      `SELECT user_id FROM squad_members WHERE squad_id = $1`,
      [squadId]
    );

    // Send notification to each member (except excluded user)
    for (const member of membersResult.rows) {
      if (member.user_id !== excludeUserId) {
        await sendNotification(member.user_id, type, message, data);
      }
    }
  } catch (error) {
    console.error("Error sending squad notification:", error);
    throw error;
  }
};

/**
 * Send notification when a new post is created
 */
export const sendNewPostNotification = async (
  squadId: string,
  postId: string,
  userId: string,
  postContent: string
): Promise<void> => {
  try {
    // Get post creator info
    const userResult = await query(
      `SELECT display_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].display_name;
    const message = `${userName} posted in the squad`;
    const data = { squadId, postId, userId };
    const actionUrl = `/squads/${squadId}/posts/${postId}`;

    await sendSquadNotification(
      squadId,
      NOTIFICATION_TYPES.SQUAD_POST,
      message,
      data,
      userId
    );
  } catch (error) {
    console.error("Error sending new post notification:", error);
    throw error;
  }
};

/**
 * Send notification when a user joins a squad
 */
export const sendSquadJoinNotification = async (
  squadId: string,
  newUserId: string
): Promise<void> => {
  try {
    // Get squad info
    const squadResult = await query(
      `SELECT name, created_by FROM squads WHERE id = $1`,
      [squadId]
    );

    if (squadResult.rows.length === 0) return;

    const squad = squadResult.rows[0];
    const squadName = squad.name;

    // Get new user info
    const userResult = await query(
      `SELECT display_name FROM users WHERE id = $1`,
      [newUserId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].display_name;
    const message = `${userName} joined ${squadName}`;
    const data = { squadId, userId: newUserId };
    const actionUrl = `/squads/${squadId}`;

    // Notify squad creator
    await sendNotification(
      squad.created_by,
      NOTIFICATION_TYPES.SQUAD_MEMBER_JOIN,
      message,
      data,
      actionUrl
    );
  } catch (error) {
    console.error("Error sending squad join notification:", error);
    throw error;
  }
};

/**
 * Send notification when a project is updated
 */
export const sendProjectUpdateNotification = async (
  projectId: string,
  updateId: string,
  updaterId: string,
  updateTitle: string
): Promise<void> => {
  try {
    // Get project info
    const projectResult = await query(
      `SELECT title, created_by, collaborators FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) return;

    const project = projectResult.rows[0];
    const projectName = project.title;

    // Get updater info
    const userResult = await query(
      `SELECT display_name FROM users WHERE id = $1`,
      [updaterId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].display_name;
    const message = `${userName} updated project: ${projectName}`;
    const data = { projectId, updateId, userId: updaterId };
    const actionUrl = `/projects/${projectId}`;

    // Notify project creator and collaborators
    const recipients = [project.created_by, ...project.collaborators].filter(
      (id) => id !== updaterId
    );

    for (const recipientId of recipients) {
      await sendNotification(
        recipientId,
        NOTIFICATION_TYPES.PROJECT_UPDATE,
        message,
        data,
        actionUrl
      );
    }
  } catch (error) {
    console.error("Error sending project update notification:", error);
    throw error;
  }
};

/**
 * Send notification when a user earns a badge
 */
export const sendBadgeEarnedNotification = async (
  userId: string,
  badgeName: string,
  badgeId: string
): Promise<void> => {
  try {
    const message = `Congratulations! You've earned the "${badgeName}" badge.`;
    const data = { badgeId };
    const actionUrl = `/profile/${userId}/badges`;

    await sendNotification(
      userId,
      NOTIFICATION_TYPES.BADGE_EARNED,
      message,
      data,
      actionUrl
    );
  } catch (error) {
    console.error("Error sending badge earned notification:", error);
    throw error;
  }
};

/**
 * Send notification when a user is followed
 */
export const sendFollowNotification = async (
  followerId: string,
  followingId: string
): Promise<void> => {
  try {
    // Get follower info
    const userResult = await query(
      `SELECT display_name FROM users WHERE id = $1`,
      [followerId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].display_name;
    const message = `${userName} is now following you`;
    const data = { followerId };
    const actionUrl = `/profile/${followerId}`;

    await sendNotification(
      followingId,
      NOTIFICATION_TYPES.FOLLOW_USER,
      message,
      data,
      actionUrl
    );
  } catch (error) {
    console.error("Error sending follow notification:", error);
    throw error;
  }
};

/**
 * Send notification when a user receives a reply
 */
export const sendReplyNotification = async (
  postId: string,
  commentId: string,
  replierId: string,
  originalUserId: string
): Promise<void> => {
  try {
    // Don't notify if user is replying to their own post/comment
    if (replierId === originalUserId) return;

    // Get replier info
    const userResult = await query(
      `SELECT display_name FROM users WHERE id = $1`,
      [replierId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].display_name;
    const message = `${userName} replied to your post`;
    const data = { postId, commentId, replierId };
    const actionUrl = `/posts/${postId}`;

    await sendNotification(
      originalUserId,
      NOTIFICATION_TYPES.COMMENT_REPLY,
      message,
      data,
      actionUrl
    );
  } catch (error) {
    console.error("Error sending reply notification:", error);
    throw error;
  }
};

export default {
  setSocketIO,
  sendNotification,
  sendSquadNotification,
  sendNewPostNotification,
  sendSquadJoinNotification,
  sendProjectUpdateNotification,
  sendBadgeEarnedNotification,
  sendFollowNotification,
  sendReplyNotification,
};
