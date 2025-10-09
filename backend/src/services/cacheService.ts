import {
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
} from "../config/redis";
import { query } from "../config/database";

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  USER_PROFILE: 3600, // 1 hour
  SQUAD_DETAILS: 1800, // 30 minutes
  PROJECT_LIST: 1800, // 30 minutes
  CHALLENGE_LIST: 1800, // 30 minutes
  LEADERBOARD: 300, // 5 minutes
  SQUAD_MEMBERS: 600, // 10 minutes
  USER_STATS: 600, // 10 minutes
  RECENT_ACTIVITY: 300, // 5 minutes
};

/**
 * Cache user profile data
 */
export const cacheUserProfile = async (
  userId: string,
  profile: any
): Promise<void> => {
  const key = `user_profile:${userId}`;
  await setCache(key, profile, CACHE_TTL.USER_PROFILE);
};

/**
 * Get cached user profile
 */
export const getCachedUserProfile = async (
  userId: string
): Promise<any | null> => {
  const key = `user_profile:${userId}`;
  return await getCache(key);
};

/**
 * Invalidate user profile cache
 */
export const invalidateUserProfileCache = async (
  userId: string
): Promise<void> => {
  const key = `user_profile:${userId}`;
  await deleteCache(key);
};

/**
 * Cache squad details
 */
export const cacheSquadDetails = async (
  squadId: string,
  squad: any
): Promise<void> => {
  const key = `squad_details:${squadId}`;
  await setCache(key, squad, CACHE_TTL.SQUAD_DETAILS);
};

/**
 * Get cached squad details
 */
export const getCachedSquadDetails = async (
  squadId: string
): Promise<any | null> => {
  const key = `squad_details:${squadId}`;
  return await getCache(key);
};

/**
 * Invalidate squad details cache
 */
export const invalidateSquadCache = async (squadId: string): Promise<void> => {
  const key = `squad_details:${squadId}`;
  await deleteCache(key);

  // Also invalidate squad members cache
  await deleteCache(`squad_members:${squadId}`);

  // Invalidate related project cache
  await deleteCachePattern(`project_list:squad:${squadId}*`);
};

/**
 * Cache squad members
 */
export const cacheSquadMembers = async (
  squadId: string,
  members: any[]
): Promise<void> => {
  const key = `squad_members:${squadId}`;
  await setCache(key, members, CACHE_TTL.SQUAD_MEMBERS);
};

/**
 * Get cached squad members
 */
export const getCachedSquadMembers = async (
  squadId: string
): Promise<any[] | null> => {
  const key = `squad_members:${squadId}`;
  return await getCache(key);
};

/**
 * Cache project list
 */
export const cacheProjectList = async (
  cacheKey: string,
  projects: any[]
): Promise<void> => {
  const key = `project_list:${cacheKey}`;
  await setCache(key, projects, CACHE_TTL.PROJECT_LIST);
};

/**
 * Get cached project list
 */
export const getCachedProjectList = async (
  cacheKey: string
): Promise<any[] | null> => {
  const key = `project_list:${cacheKey}`;
  return await getCache(key);
};

/**
 * Cache challenge list
 */
export const cacheChallengeList = async (
  cacheKey: string,
  challenges: any[]
): Promise<void> => {
  const key = `challenge_list:${cacheKey}`;
  await setCache(key, challenges, CACHE_TTL.CHALLENGE_LIST);
};

/**
 * Get cached challenge list
 */
export const getCachedChallengeList = async (
  cacheKey: string
): Promise<any[] | null> => {
  const key = `challenge_list:${cacheKey}`;
  return await getCache(key);
};

/**
 * Cache leaderboard data
 */
export const cacheLeaderboard = async (
  type: string,
  scope: string,
  leaderboard: any[]
): Promise<void> => {
  const key = `leaderboard:${type}:${scope}`;
  await setCache(key, leaderboard, CACHE_TTL.LEADERBOARD);
};

/**
 * Get cached leaderboard data
 */
export const getCachedLeaderboard = async (
  type: string,
  scope: string
): Promise<any[] | null> => {
  const key = `leaderboard:${type}:${scope}`;
  return await getCache(key);
};

/**
 * Cache user statistics
 */
export const cacheUserStats = async (
  userId: string,
  stats: any
): Promise<void> => {
  const key = `user_stats:${userId}`;
  await setCache(key, stats, CACHE_TTL.USER_STATS);
};

/**
 * Get cached user statistics
 */
export const getCachedUserStats = async (
  userId: string
): Promise<any | null> => {
  const key = `user_stats:${userId}`;
  return await getCache(key);
};

/**
 * Cache recent activity
 */
export const cacheRecentActivity = async (
  userId: string,
  activity: any[]
): Promise<void> => {
  const key = `recent_activity:${userId}`;
  await setCache(key, activity, CACHE_TTL.RECENT_ACTIVITY);
};

/**
 * Get cached recent activity
 */
export const getCachedRecentActivity = async (
  userId: string
): Promise<any[] | null> => {
  const key = `recent_activity:${userId}`;
  return await getCache(key);
};

/**
 * Invalidate all user-related caches
 */
export const invalidateUserCaches = async (userId: string): Promise<void> => {
  // Invalidate user profile
  await invalidateUserProfileCache(userId);

  // Invalidate user stats
  await deleteCache(`user_stats:${userId}`);

  // Invalidate recent activity
  await deleteCache(`recent_activity:${userId}`);

  // Invalidate related project caches
  await deleteCachePattern(`project_list:created_by:${userId}*`);

  // Invalidate related challenge caches
  await deleteCachePattern(`challenge_list:created_by:${userId}*`);
};

/**
 * Invalidate all project-related caches
 */
export const invalidateProjectCaches = async (
  projectId: string
): Promise<void> => {
  // Invalidate project list caches
  await deleteCachePattern(`project_list:*`);

  // Invalidate user project caches
  await deleteCachePattern(`project_list:created_by:*`);
};

/**
 * Invalidate all challenge-related caches
 */
export const invalidateChallengeCaches = async (
  challengeId: string
): Promise<void> => {
  // Invalidate challenge list caches
  await deleteCachePattern(`challenge_list:*`);

  // Invalidate user challenge caches
  await deleteCachePattern(`challenge_list:created_by:*`);
};

/**
 * Get online users count for a squad
 */
export const getOnlineUsersCount = async (squadId: string): Promise<number> => {
  try {
    const redis = getRedisClient();
    const count = await redis.sCard(`squad_online:${squadId}`);
    return count;
  } catch (error) {
    console.error("Error getting online users count:", error);
    return 0;
  }
};

/**
 * Add user to online users set for a squad
 */
export const addUserToOnlineSet = async (
  squadId: string,
  userId: string
): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.sAdd(`squad_online:${squadId}`, userId);
    // Expire in 1 hour
    await redis.expire(`squad_online:${squadId}`, 3600);
  } catch (error) {
    console.error("Error adding user to online set:", error);
  }
};

/**
 * Remove user from online users set for a squad
 */
export const removeUserFromOnlineSet = async (
  squadId: string,
  userId: string
): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.sRem(`squad_online:${squadId}`, userId);
  } catch (error) {
    console.error("Error removing user from online set:", error);
  }
};

/**
 * Get typing users for a squad
 */
export const getTypingUsers = async (squadId: string): Promise<string[]> => {
  try {
    const redis = getRedisClient();
    const users = await redis.sMembers(`squad_typing:${squadId}`);
    return users;
  } catch (error) {
    console.error("Error getting typing users:", error);
    return [];
  }
};

/**
 * Add user to typing set for a squad
 */
export const addUserToTypingSet = async (
  squadId: string,
  userId: string
): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.sAdd(`squad_typing:${squadId}`, userId);
    // Expire in 10 seconds
    await redis.expire(`squad_typing:${squadId}`, 10);
  } catch (error) {
    console.error("Error adding user to typing set:", error);
  }
};

/**
 * Remove user from typing set for a squad
 */
export const removeUserFromTypingSet = async (
  squadId: string,
  userId: string
): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.sRem(`squad_typing:${squadId}`, userId);
  } catch (error) {
    console.error("Error removing user from typing set:", error);
  }
};

export default {
  cacheUserProfile,
  getCachedUserProfile,
  invalidateUserProfileCache,
  cacheSquadDetails,
  getCachedSquadDetails,
  invalidateSquadCache,
  cacheSquadMembers,
  getCachedSquadMembers,
  cacheProjectList,
  getCachedProjectList,
  cacheChallengeList,
  getCachedChallengeList,
  cacheLeaderboard,
  getCachedLeaderboard,
  cacheUserStats,
  getCachedUserStats,
  cacheRecentActivity,
  getCachedRecentActivity,
  invalidateUserCaches,
  invalidateProjectCaches,
  invalidateChallengeCaches,
  getOnlineUsersCount,
  addUserToOnlineSet,
  removeUserFromOnlineSet,
  getTypingUsers,
  addUserToTypingSet,
  removeUserFromTypingSet,
  deleteCache, // Add this line to export deleteCache
};
