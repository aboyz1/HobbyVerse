import { Router, Request, Response, NextFunction } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { query } from "../config/database";
import { User as AppUser, UpdateUserRequest } from "../types/user";
import { body, validationResult, param } from "express-validator";
import bcrypt from "bcryptjs";

const router = Router();

// Validation rules
const updateProfileValidation = [
  body("display_name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be 2-50 characters"),
  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("portfolio_links")
    .optional()
    .isArray()
    .withMessage("Portfolio links must be an array"),
  body("notification_preferences")
    .optional()
    .isObject()
    .withMessage("Notification preferences must be an object"),
  body("privacy_settings")
    .optional()
    .isObject()
    .withMessage("Privacy settings must be an object"),
];

const updatePasswordValidation = [
  body("current_password")
    .notEmpty()
    .withMessage("Current password is required"),
  body("new_password")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

const userIdValidation = [
  param("id").isUUID().withMessage("Valid user ID is required"),
];

// Get user profile by ID
router.get(
  "/:id",
  userIdValidation,
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const currentUserId = req.user?.id;

      // Get user profile with stats
      const userResult = await query(
        `SELECT 
        u.id, u.email, u.display_name, u.avatar_url, u.bio, u.skills, 
        u.portfolio_links, u.total_points, u.level, u.created_at,
        u.privacy_settings,
        COUNT(DISTINCT sm.squad_id) as squads_joined,
        COUNT(DISTINCT p.id) as projects_created,
        COUNT(DISTINCT ub.badge_id) as badges_earned,
        COUNT(DISTINCT cs.id) as challenges_completed,
        COUNT(DISTINCT sp.id) as posts_count,
        COUNT(DISTINCT sc.id) as comments_count,
        COUNT(DISTINCT f1.id) as followers_count,
        COUNT(DISTINCT f2.id) as following_count
       FROM users u
       LEFT JOIN squad_members sm ON u.id = sm.user_id
       LEFT JOIN projects p ON u.id = p.created_by
       LEFT JOIN user_badges ub ON u.id = ub.user_id
       LEFT JOIN challenge_submissions cs ON u.id = cs.user_id AND cs.status = 'approved'
       LEFT JOIN squad_posts sp ON u.id = sp.user_id
       LEFT JOIN squad_comments sc ON u.id = sc.user_id
       LEFT JOIN follows f1 ON u.id = f1.following_id
       LEFT JOIN follows f2 ON u.id = f2.follower_id
       WHERE u.id = $1
       GROUP BY u.id`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const user = userResult.rows[0];
      const privacySettings = user.privacy_settings || {};

      // Check privacy settings
      const isOwnProfile = currentUserId === id;
      const isPublic = privacySettings.profile_visibility === "public";
      const isSquadMember =
        currentUserId && privacySettings.profile_visibility === "squads_only";

      if (!isOwnProfile && !isPublic && !isSquadMember) {
        return res.status(403).json({
          success: false,
          error: "This profile is private",
        });
      }

      // Hide email based on privacy settings
      if (!isOwnProfile && privacySettings.email_visibility !== "public") {
        delete user.email;
      }

      // Get user's badges
      const badgesResult = await query(
        `SELECT b.id, b.name, b.description, b.icon_url, b.rarity, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
        [id]
      );

      // Get recent projects (public or own)
      let projectsQuery = `
      SELECT id, title, description, tags, status, difficulty_level, 
             thumbnail_url, created_at, like_count, view_count
      FROM projects 
      WHERE created_by = $1 AND (visibility = 'public' OR $2 = $1)
      ORDER BY created_at DESC 
      LIMIT 5
    `;

      const projectsResult = await query(projectsQuery, [
        id,
        currentUserId || null,
      ]);

      // Check if current user is following this user
      let isFollowing = false;
      if (currentUserId && currentUserId !== id) {
        const followResult = await query(
          "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
          [currentUserId, id]
        );
        isFollowing = followResult.rows.length > 0;
      }

      res.json({
        success: true,
        user: {
          ...user,
          badges: badgesResult.rows,
          recent_projects: projectsResult.rows,
          is_following: isFollowing,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user profile
router.put(
  "/profile",
  authenticate,
  updateProfileValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const userId = req.user!.id;
      const updateData: UpdateUserRequest = req.body;

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateData.display_name !== undefined) {
        updateFields.push(`display_name = $${paramIndex}`);
        updateValues.push(updateData.display_name);
        paramIndex++;
      }

      if (updateData.bio !== undefined) {
        updateFields.push(`bio = $${paramIndex}`);
        updateValues.push(updateData.bio);
        paramIndex++;
      }

      if (updateData.avatar_url !== undefined) {
        updateFields.push(`avatar_url = $${paramIndex}`);
        updateValues.push(updateData.avatar_url);
        paramIndex++;
      }

      if (updateData.skills !== undefined) {
        updateFields.push(`skills = $${paramIndex}`);
        updateValues.push(updateData.skills);
        paramIndex++;
      }

      if (updateData.portfolio_links !== undefined) {
        updateFields.push(`portfolio_links = $${paramIndex}`);
        updateValues.push(updateData.portfolio_links);
        paramIndex++;
      }

      if (updateData.notification_preferences !== undefined) {
        updateFields.push(`notification_preferences = $${paramIndex}`);
        updateValues.push(JSON.stringify(updateData.notification_preferences));
        paramIndex++;
      }

      if (updateData.privacy_settings !== undefined) {
        updateFields.push(`privacy_settings = $${paramIndex}`);
        updateValues.push(JSON.stringify(updateData.privacy_settings));
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid fields to update",
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(userId);

      const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, display_name, avatar_url, bio, skills, 
                portfolio_links, total_points, level, notification_preferences, 
                privacy_settings, created_at, updated_at
    `;

      const result = await query(updateQuery, updateValues);

      res.json({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update password
router.put(
  "/password",
  authenticate,
  updatePasswordValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const userId = req.user!.id;
      const { current_password, new_password } = req.body;

      // Get current password hash
      const userResult = await query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const user = userResult.rows[0];

      // Check if user has a password (not OAuth-only user)
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          error: "Cannot update password for OAuth-only accounts",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        current_password,
        user.password_hash
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

      // Update password
      await query(
        "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newPasswordHash, userId]
      );

      // Invalidate all refresh tokens (force re-login on all devices)
      await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);

      res.json({
        success: true,
        message: "Password updated successfully. Please log in again.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update Expo push token
router.post(
  "/push-token",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { expo_push_token } = req.body;

      if (!expo_push_token) {
        return res.status(400).json({
          success: false,
          error: "Expo push token is required",
        });
      }

      await query(
        "UPDATE users SET expo_push_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [expo_push_token, userId]
      );

      res.json({
        success: true,
        message: "Push token updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Follow/Unfollow user
router.post(
  "/:id/follow",
  authenticate,
  userIdValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const followerId = req.user!.id;
      const followingId = req.params.id;

      if (followerId === followingId) {
        return res.status(400).json({
          success: false,
          error: "Cannot follow yourself",
        });
      }

      // Check if target user exists
      const targetUserResult = await query(
        "SELECT id FROM users WHERE id = $1",
        [followingId]
      );
      if (targetUserResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Check if already following
      const existingFollow = await query(
        "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
        [followerId, followingId]
      );

      if (existingFollow.rows.length > 0) {
        // Unfollow
        await query(
          "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
          [followerId, followingId]
        );

        res.json({
          success: true,
          message: "Unfollowed successfully",
          is_following: false,
        });
      } else {
        // Follow
        await query(
          "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
          [followerId, followingId]
        );

        res.json({
          success: true,
          message: "Followed successfully",
          is_following: true,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get user's followers
router.get(
  "/:id/followers",
  userIdValidation,
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const followersResult = await query(
        `SELECT u.id, u.display_name, u.avatar_url, u.bio, u.total_points, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      const totalResult = await query(
        "SELECT COUNT(*) as total FROM follows WHERE following_id = $1",
        [id]
      );

      res.json({
        success: true,
        followers: followersResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(totalResult.rows[0].total),
          pages: Math.ceil(parseInt(totalResult.rows[0].total) / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's following
router.get(
  "/:id/following",
  userIdValidation,
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const followingResult = await query(
        `SELECT u.id, u.display_name, u.avatar_url, u.bio, u.total_points, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      const totalResult = await query(
        "SELECT COUNT(*) as total FROM follows WHERE follower_id = $1",
        [id]
      );

      res.json({
        success: true,
        following: followingResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(totalResult.rows[0].total),
          pages: Math.ceil(parseInt(totalResult.rows[0].total) / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Search users
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, skills, page = 1, limit = 20 } = req.query;

      if (!search && !skills) {
        return res.status(400).json({
          success: false,
          error: "Search query or skills filter is required",
        });
      }

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(
          `(u.display_name ILIKE $${paramIndex} OR u.bio ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        whereConditions.push(`u.skills && $${paramIndex}`);
        queryParams.push(skillsArray);
        paramIndex++;
      }

      queryParams.push(limit, offset);

      const usersResult = await query(
        `SELECT u.id, u.display_name, u.avatar_url, u.bio, u.skills, u.total_points, u.level,
              COUNT(DISTINCT sm.squad_id) as squads_joined,
              COUNT(DISTINCT p.id) as projects_created,
              COUNT(DISTINCT ub.badge_id) as badges_earned
       FROM users u
       LEFT JOIN squad_members sm ON u.id = sm.user_id
       LEFT JOIN projects p ON u.id = p.created_by
       LEFT JOIN user_badges ub ON u.id = ub.user_id
       WHERE ${whereConditions.join(" AND ")}
       GROUP BY u.id
       ORDER BY u.total_points DESC, u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams
      );

      const totalResult = await query(
        `SELECT COUNT(DISTINCT u.id) as total
       FROM users u
       WHERE ${whereConditions.join(" AND ")}`,
        queryParams.slice(0, -2)
      );

      res.json({
        success: true,
        users: usersResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(totalResult.rows[0].total),
          pages: Math.ceil(parseInt(totalResult.rows[0].total) / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
