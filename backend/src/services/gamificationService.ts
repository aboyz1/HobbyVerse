import { query } from "../config/database";

// Point values for different activities
const POINT_VALUES = {
  POST_CREATED: 10,
  COMMENT_CREATED: 5,
  POST_HELPFUL: 15,
  COMMENT_HELPFUL: 10,
  PROJECT_CREATED: 50,
  PROJECT_LIKED: 5,
  CHALLENGE_COMPLETED: 100,
  SQUAD_JOINED: 20,
  SQUAD_POST_CREATED: 15,
  SQUAD_COMMENT_CREATED: 7,
};

// Badge criteria
interface BadgeCriteria {
  posts?: number;
  messages?: number;
  projects?: number;
  challenges?: number;
  helpful_votes?: number;
  squad_members?: number;
}

const BADGE_CRITERIA: Record<string, BadgeCriteria> = {
  FIRST_POST: { posts: 1 },
  CHAT_ACTIVE: { messages: 50 },
  PROJECT_ENTHUSIAST: { projects: 5 },
  CHALLENGE_MASTER: { challenges: 10 },
  HELPFUL_USER: { helpful_votes: 20 },
  COMMUNITY_LEADER: { squad_members: 100 },
};

export interface GamificationEvent {
  userId: string;
  eventType: string;
  points: number;
  reason: string;
  sourceType?: string;
  sourceId?: string;
  squadId?: string;
}

/**
 * Award points to a user for an activity
 */
export const awardPoints = async (event: GamificationEvent): Promise<void> => {
  try {
    // Update user's total points
    await query(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
      [event.points, event.userId]
    );

    // Add to points history
    await query(
      `INSERT INTO points_history (user_id, squad_id, points, reason, source_type, source_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.userId,
        event.squadId || null,
        event.points,
        event.reason,
        event.sourceType || null,
        event.sourceId || null,
      ]
    );

    // Update squad member contribution points if applicable
    if (event.squadId) {
      await query(
        `UPDATE squad_members 
         SET contribution_points = contribution_points + $1 
         WHERE squad_id = $2 AND user_id = $3`,
        [event.points, event.squadId, event.userId]
      );
    }

    // Check for badge eligibility
    await checkBadgeEligibility(event.userId);
  } catch (error) {
    console.error("Error awarding points:", error);
    throw error;
  }
};

/**
 * Check if user is eligible for any badges
 */
export const checkBadgeEligibility = async (userId: string): Promise<void> => {
  try {
    // Get user stats
    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT sp.id) as posts_count,
        COUNT(DISTINCT sc.id) as comments_count,
        COUNT(DISTINCT p.id) as projects_count,
        COUNT(DISTINCT cs.id) as challenges_count,
        COUNT(DISTINCT hv.id) as helpful_votes_count,
        COUNT(DISTINCT sm.id) as squad_members_count
       FROM users u
       LEFT JOIN squad_posts sp ON u.id = sp.user_id
       LEFT JOIN squad_comments sc ON u.id = sc.user_id
       LEFT JOIN projects p ON u.id = p.created_by
       LEFT JOIN challenge_submissions cs ON u.id = cs.user_id AND cs.status = 'approved'
       LEFT JOIN helpful_votes hv ON u.id = hv.user_id
       LEFT JOIN squad_members sm ON u.id = sm.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0];

    // Check each badge criteria
    for (const [badgeName, criteria] of Object.entries(BADGE_CRITERIA)) {
      let eligible = false;

      if (criteria.posts && stats.posts_count >= criteria.posts) {
        eligible = true;
      } else if (
        criteria.messages &&
        stats.messages_count >= criteria.messages
      ) {
        eligible = true;
      } else if (
        criteria.projects &&
        stats.projects_count >= criteria.projects
      ) {
        eligible = true;
      } else if (
        criteria.challenges &&
        stats.challenges_count >= criteria.challenges
      ) {
        eligible = true;
      } else if (
        criteria.helpful_votes &&
        stats.helpful_votes_count >= criteria.helpful_votes
      ) {
        eligible = true;
      } else if (
        criteria.squad_members &&
        stats.squad_members_count >= criteria.squad_members
      ) {
        eligible = true;
      }

      if (eligible) {
        // Award badge if not already earned
        const badgeResult = await query(
          `SELECT id FROM badges WHERE name = $1`,
          [badgeName]
        );

        if (badgeResult.rows.length > 0) {
          await query(
            `INSERT INTO user_badges (user_id, badge_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, badge_id) DO NOTHING`,
            [userId, badgeResult.rows[0].id]
          );
        }
      }
    }
  } catch (error) {
    console.error("Error checking badge eligibility:", error);
    throw error;
  }
};

/**
 * Get user's current level based on points
 */
export const calculateUserLevel = (totalPoints: number): number => {
  // Simple level calculation: every 100 points = 1 level
  return Math.floor(totalPoints / 100) + 1;
};

/**
 * Update user's level if needed
 */
export const updateUserLevel = async (userId: string): Promise<void> => {
  try {
    const userResult = await query(
      `SELECT total_points, level FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const newLevel = calculateUserLevel(user.total_points);

      if (newLevel > user.level) {
        await query(`UPDATE users SET level = $1 WHERE id = $2`, [
          newLevel,
          userId,
        ]);

        // Award "Level Up" badge for significant level achievements
        if (newLevel % 5 === 0) {
          const badgeResult = await query(
            `SELECT id FROM badges WHERE name = 'Level Up'`,
            []
          );

          if (badgeResult.rows.length > 0) {
            await query(
              `INSERT INTO user_badges (user_id, badge_id) 
               VALUES ($1, $2) 
               ON CONFLICT (user_id, badge_id) DO NOTHING`,
              [userId, badgeResult.rows[0].id]
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error updating user level:", error);
    throw error;
  }
};

/**
 * Award points for creating a post
 */
export const awardPostPoints = async (
  userId: string,
  postId: string,
  squadId?: string
): Promise<void> => {
  const points = squadId
    ? POINT_VALUES.SQUAD_POST_CREATED
    : POINT_VALUES.POST_CREATED;
  const reason = squadId ? "Squad post created" : "Post created";
  const sourceType = squadId ? "squad_post" : "post";

  await awardPoints({
    userId,
    eventType: "POST_CREATED",
    points,
    reason,
    sourceType,
    sourceId: postId,
    squadId,
  });
};

/**
 * Award points for creating a comment
 */
export const awardCommentPoints = async (
  userId: string,
  commentId: string,
  squadId?: string
): Promise<void> => {
  const points = squadId
    ? POINT_VALUES.SQUAD_COMMENT_CREATED
    : POINT_VALUES.COMMENT_CREATED;
  const reason = squadId ? "Squad comment created" : "Comment created";
  const sourceType = squadId ? "squad_comment" : "comment";

  await awardPoints({
    userId,
    eventType: "COMMENT_CREATED",
    points,
    reason,
    sourceType,
    sourceId: commentId,
    squadId,
  });
};

/**
 * Award points for helpful votes
 */
export const awardHelpfulVotePoints = async (
  userId: string,
  targetUserId: string,
  targetType: string,
  targetId: string
): Promise<void> => {
  const points =
    targetType === "post"
      ? POINT_VALUES.POST_HELPFUL
      : POINT_VALUES.COMMENT_HELPFUL;
  const reason =
    targetType === "post"
      ? "Post marked as helpful"
      : "Comment marked as helpful";
  const sourceType = targetType;

  // Award points to the user who received the helpful vote
  await awardPoints({
    userId: targetUserId,
    eventType: "HELPFUL_VOTE_RECEIVED",
    points,
    reason,
    sourceType,
    sourceId: targetId,
  });

  // Award smaller points to the user who gave the helpful vote
  await awardPoints({
    userId,
    eventType: "HELPFUL_VOTE_GIVEN",
    points: 2,
    reason: "Gave helpful vote",
    sourceType,
    sourceId: targetId,
  });
};

/**
 * Award points for creating a project
 */
export const awardProjectPoints = async (
  userId: string,
  projectId: string
): Promise<void> => {
  await awardPoints({
    userId,
    eventType: "PROJECT_CREATED",
    points: POINT_VALUES.PROJECT_CREATED,
    reason: "Project created",
    sourceType: "project",
    sourceId: projectId,
  });
};

/**
 * Award points for project likes
 */
export const awardProjectLikePoints = async (
  userId: string,
  targetUserId: string,
  projectId: string
): Promise<void> => {
  // Award points to the project creator
  await awardPoints({
    userId: targetUserId,
    eventType: "PROJECT_LIKED",
    points: POINT_VALUES.PROJECT_LIKED,
    reason: "Project liked",
    sourceType: "project_like",
    sourceId: projectId,
  });

  // Award smaller points to the user who liked the project
  await awardPoints({
    userId,
    eventType: "PROJECT_LIKED_GIVEN",
    points: 1,
    reason: "Liked a project",
    sourceType: "project_like",
    sourceId: projectId,
  });
};

/**
 * Award points for completing a challenge
 */
export const awardChallengePoints = async (
  userId: string,
  challengeId: string,
  pointsAwarded: number
): Promise<void> => {
  await awardPoints({
    userId,
    eventType: "CHALLENGE_COMPLETED",
    points: pointsAwarded,
    reason: "Challenge completed",
    sourceType: "challenge",
    sourceId: challengeId,
  });
};

/**
 * Award points for joining a squad
 */
export const awardSquadJoinPoints = async (
  userId: string,
  squadId: string
): Promise<void> => {
  await awardPoints({
    userId,
    eventType: "SQUAD_JOINED",
    points: POINT_VALUES.SQUAD_JOINED,
    reason: "Joined squad",
    sourceType: "squad_join",
    sourceId: squadId,
    squadId,
  });
};

export default {
  awardPoints,
  checkBadgeEligibility,
  calculateUserLevel,
  updateUserLevel,
  awardPostPoints,
  awardCommentPoints,
  awardHelpfulVotePoints,
  awardProjectPoints,
  awardProjectLikePoints,
  awardChallengePoints,
  awardSquadJoinPoints,
};
