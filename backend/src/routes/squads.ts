import { Router, Request, Response, NextFunction } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { query } from "../config/database";
import {
  body,
  validationResult,
  param,
  query as queryValidator,
} from "express-validator";
import {
  CreateSquadRequest,
  UpdateSquadRequest,
  JoinSquadRequest,
  CreatePostRequest,
  CreateCommentRequest,
} from "../types/squad";
import {
  cacheSquadDetails,
  getCachedSquadDetails,
  invalidateSquadCache,
  cacheSquadMembers,
  getCachedSquadMembers,
  addUserToOnlineSet,
  removeUserFromOnlineSet,
} from "../services/cacheService";
import { deleteCache } from "../config/redis";

const router = Router();

// Validation rules
const createSquadValidation = [
  body("name")
    .isLength({ min: 3, max: 100 })
    .withMessage("Squad name must be 3-100 characters"),
  body("description")
    .isLength({ max: 1000 })
    .withMessage("Description must be less than 1000 characters"),
  body("tags").isArray().withMessage("Tags must be an array"),
  body("privacy")
    .isIn(["public", "private", "invite_only"])
    .withMessage("Invalid privacy setting"),
  body("avatar_url").optional().isURL().withMessage("Invalid avatar URL"),
  body("banner_url").optional().isURL().withMessage("Invalid banner URL"),
];

const updateSquadValidation = [
  body("name")
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage("Squad name must be 3-100 characters"),
  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description must be less than 1000 characters"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("privacy")
    .optional()
    .isIn(["public", "private", "invite_only"])
    .withMessage("Invalid privacy setting"),
  body("avatar_url").optional().isURL().withMessage("Invalid avatar URL"),
  body("banner_url").optional().isURL().withMessage("Invalid banner URL"),
];

const joinSquadValidation = [
  body("message")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Message must be less than 500 characters"),
];

const createPostValidation = [
  body("content")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Post content must be 1-5000 characters"),
  body("thread_id").optional().isUUID().withMessage("Invalid thread ID"),
  body("attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),
];

const createCommentValidation = [
  body("content")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment content must be 1-2000 characters"),
  body("parent_comment_id")
    .optional()
    .isUUID()
    .withMessage("Invalid parent comment ID"),
];

const squadIdValidation = [
  param("id").isUUID().withMessage("Invalid squad ID"),
];

const postIdValidation = [
  param("postId").isUUID().withMessage("Invalid post ID"),
];

const commentIdValidation = [
  param("commentId").isUUID().withMessage("Invalid comment ID"),
];

// Get all squads with filtering and pagination
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, tags, privacy, page = 1, limit = 20 } = req.query as any;
      const currentUserId = req.user?.id;

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Search filter
      if (search) {
        whereConditions.push(
          `(s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Tags filter
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        whereConditions.push(`s.tags && $${paramIndex}`);
        queryParams.push(tagsArray);
        paramIndex++;
      }

      // Privacy filter
      if (privacy) {
        whereConditions.push(`s.privacy = $${paramIndex}`);
        queryParams.push(privacy);
        paramIndex++;
      }

      // For non-public squads, only show squads the user is a member of
      if (!currentUserId) {
        whereConditions.push(`s.privacy = 'public'`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get squads with member count and user membership status
      const squadsResult = await query(
        `SELECT 
        s.*,
        CASE 
          WHEN sm.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_member
       FROM squads s
       LEFT JOIN squad_members sm ON s.id = sm.squad_id AND sm.user_id = $${paramIndex}
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
        [...queryParams, currentUserId || null, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM squads s
       ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        squads: squadsResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get squad by ID
router.get(
  "/:id",
  optionalAuth,
  squadIdValidation,
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

      // Try to get generic squad data from cache first
      // Note: We don't cache user-specific data to avoid cross-user data leakage
      let squad: any = null;

      // Always fetch fresh data from DB to ensure user-specific fields are correct
      // Get squad details
      const squadResult = await query(
        `SELECT 
        s.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar
       FROM squads s
       JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`,
        [id]
      );

      if (squadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Squad not found",
        });
      }

      squad = squadResult.rows[0];

      // Add user-specific membership information
      if (currentUserId) {
        const memberResult = await query(
          `SELECT 
          CASE 
            WHEN sm.user_id IS NOT NULL THEN true 
            ELSE false 
          END as is_member,
          sm.role as member_role
         FROM squads s
         LEFT JOIN squad_members sm ON s.id = sm.squad_id AND sm.user_id = $2
         WHERE s.id = $1`,
          [id, currentUserId]
        );

        if (memberResult.rows.length > 0) {
          squad.is_member = memberResult.rows[0].is_member;
          squad.member_role = memberResult.rows[0].member_role;
        } else {
          squad.is_member = false;
          squad.member_role = null;
        }
      } else {
        squad.is_member = false;
        squad.member_role = null;
      }

      // Check privacy settings
      if (squad.privacy !== "public" && !squad.is_member) {
        return res.status(403).json({
          success: false,
          error: "This squad is private. You must be a member to view it.",
        });
      }

      // Get squad threads
      const threadsResult = await query(
        `SELECT 
        st.*,
        u.display_name as creator_name,
        COUNT(sp.id) as post_count
       FROM squad_threads st
       JOIN users u ON st.created_by = u.id
       LEFT JOIN squad_posts sp ON st.id = sp.thread_id
       WHERE st.squad_id = $1
       GROUP BY st.id, u.display_name
       ORDER BY st.is_pinned DESC, st.created_at DESC
       LIMIT 10`,
        [id]
      );

      // Get recent posts
      const postsResult = await query(
        `SELECT 
        sp.*,
        u.display_name as user_name,
        u.avatar_url as user_avatar,
        st.title as thread_title
       FROM squad_posts sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN squad_threads st ON sp.thread_id = st.id
       WHERE sp.squad_id = $1
       ORDER BY sp.created_at DESC
       LIMIT 10`,
        [id]
      );

      // Get squad members count from cache or database
      let members = await getCachedSquadMembers(id);
      if (!members) {
        const membersResult = await query(
          `SELECT 
          u.id, u.display_name, u.avatar_url, sm.role, sm.joined_at
         FROM squad_members sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.squad_id = $1
         ORDER BY sm.role DESC, sm.joined_at ASC`,
          [id]
        );
        members = membersResult.rows;

        // Cache the members
        if (members) {
          await cacheSquadMembers(id, members);
        }
      }

      // Get online users count
      // Note: This would be implemented with Redis in a real application
      const onlineCount = 0;

      res.json({
        success: true,
        squad: {
          ...squad,
          threads: threadsResult.rows,
          recent_posts: postsResult.rows,
          members: members ? members.slice(0, 10) : [], // Return first 10 members or empty array
          member_count: members ? members.length : 0,
          online_count: onlineCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a new squad
router.post(
  "/",
  authenticate,
  createSquadValidation,
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

      const {
        name,
        description,
        tags,
        privacy,
        avatar_url,
        banner_url,
      }: CreateSquadRequest = req.body;
      const userId = req.user!.id;

      // Create squad
      const squadResult = await query(
        `INSERT INTO squads (name, description, tags, privacy, avatar_url, banner_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
        [name, description, tags, privacy, avatar_url, banner_url, userId]
      );

      const squad = squadResult.rows[0];

      // Add creator as admin member
      await query(
        `INSERT INTO squad_members (squad_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
        [squad.id, userId]
      );

      res.status(201).json({
        success: true,
        squad,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update squad
router.put(
  "/:id",
  authenticate,
  squadIdValidation,
  updateSquadValidation,
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
      const updateData: UpdateSquadRequest = req.body;
      const userId = req.user!.id;

      // Check if user is admin of the squad
      const memberResult = await query(
        `SELECT role FROM squad_members 
       WHERE squad_id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (
        memberResult.rows.length === 0 ||
        memberResult.rows[0].role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Only squad admins can update squad settings",
        });
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(updateData.name);
        paramIndex++;
      }

      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(updateData.description);
        paramIndex++;
      }

      if (updateData.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex}`);
        updateValues.push(updateData.tags);
        paramIndex++;
      }

      if (updateData.privacy !== undefined) {
        updateFields.push(`privacy = $${paramIndex}`);
        updateValues.push(updateData.privacy);
        paramIndex++;
      }

      if (updateData.avatar_url !== undefined) {
        updateFields.push(`avatar_url = $${paramIndex}`);
        updateValues.push(updateData.avatar_url);
        paramIndex++;
      }

      if (updateData.banner_url !== undefined) {
        updateFields.push(`banner_url = $${paramIndex}`);
        updateValues.push(updateData.banner_url);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid fields to update",
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const updateQuery = `
      UPDATE squads 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

      const result = await query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Squad not found",
        });
      }

      res.json({
        success: true,
        squad: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete squad (only admin can delete)
router.delete(
  "/:id",
  authenticate,
  squadIdValidation,
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
      const userId = req.user!.id;

      // Check if user is admin of the squad
      const memberResult = await query(
        `SELECT role FROM squad_members 
       WHERE squad_id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (
        memberResult.rows.length === 0 ||
        memberResult.rows[0].role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Only squad admins can delete the squad",
        });
      }

      // Delete squad (will cascade delete all related data)
      await query("DELETE FROM squads WHERE id = $1", [id]);

      res.json({
        success: true,
        message: "Squad deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Join squad
router.post(
  "/:id/join",
  authenticate,
  squadIdValidation,
  joinSquadValidation,
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
      const { message } = req.body;
      const userId = req.user!.id;

      // Check if squad exists and get privacy setting
      const squadResult = await query(
        "SELECT privacy, created_by FROM squads WHERE id = $1",
        [id]
      );

      if (squadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Squad not found",
        });
      }

      const squad = squadResult.rows[0];

      // Check if user is already a member
      const existingMember = await query(
        "SELECT id FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [id, userId]
      );

      if (existingMember.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: "You are already a member of this squad",
        });
      }

      // Handle privacy settings
      if (squad.privacy === "private") {
        return res.status(403).json({
          success: false,
          error:
            "This squad is private. You cannot join without an invitation.",
        });
      }

      // Add user to squad
      const memberResult = await query(
        `INSERT INTO squad_members (squad_id, user_id, role)
       VALUES ($1, $2, 'member')
       RETURNING *`,
        [id, userId]
      );

      // Invalidate squad cache
      await invalidateSquadCache(id);

      // Also invalidate the squad members cache
      await deleteCache(`squad_members:${id}`);

      // Get updated squad information
      const updatedSquadResult = await query(
        `SELECT 
        s.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar,
        CASE 
          WHEN sm.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_member,
        sm.role as member_role
       FROM squads s
       JOIN users u ON s.created_by = u.id
       LEFT JOIN squad_members sm ON s.id = sm.squad_id AND sm.user_id = $2
       WHERE s.id = $1`,
        [id, userId]
      );

      const updatedSquad = updatedSquadResult.rows[0];

      res.status(201).json({
        success: true,
        member: memberResult.rows[0],
        message: "Successfully joined squad",
        squad: updatedSquad,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Leave squad
router.post(
  "/:id/leave",
  authenticate,
  squadIdValidation,
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
      const userId = req.user!.id;

      // Check if user is a member
      const memberResult = await query(
        "SELECT role FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [id, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: "You are not a member of this squad",
        });
      }

      // Check if user is the admin (can't leave if only admin)
      if (memberResult.rows[0].role === "admin") {
        const adminCountResult = await query(
          `SELECT COUNT(*) as admin_count 
         FROM squad_members 
         WHERE squad_id = $1 AND role = 'admin'`,
          [id]
        );

        if (parseInt(adminCountResult.rows[0].admin_count) <= 1) {
          return res.status(400).json({
            success: false,
            error:
              "You cannot leave the squad as the only admin. Please transfer admin rights first.",
          });
        }
      }

      // Remove user from squad
      await query(
        "DELETE FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [id, userId]
      );

      // Invalidate squad cache to ensure fresh data
      await invalidateSquadCache(id);

      // Also invalidate the squad members cache
      await deleteCache(`squad_members:${id}`);

      // Get updated squad information
      const squadResult = await query(
        `SELECT 
        s.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar,
        CASE 
          WHEN sm.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_member,
        sm.role as member_role
       FROM squads s
       JOIN users u ON s.created_by = u.id
       LEFT JOIN squad_members sm ON s.id = sm.squad_id AND sm.user_id = $2
       WHERE s.id = $1`,
        [id, userId]
      );

      const updatedSquad = squadResult.rows[0];

      res.json({
        success: true,
        message: "Successfully left the squad",
        squad: updatedSquad,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get squad members
router.get(
  "/:id/members",
  optionalAuth,
  squadIdValidation,
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
      const { page = 1, limit = 20 } = req.query as any;
      const currentUserId = req.user?.id;

      const offset = (Number(page) - 1) * Number(limit);

      // Check if squad exists and is accessible
      const squadResult = await query(
        `SELECT privacy FROM squads WHERE id = $1`,
        [id]
      );

      if (squadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Squad not found",
        });
      }

      const squad = squadResult.rows[0];

      // Check privacy for non-members
      if (squad.privacy !== "public") {
        const memberResult = await query(
          "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
          [id, currentUserId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error:
              "This squad is private. You must be a member to view members.",
          });
        }
      }

      // Get members with user details
      const membersResult = await query(
        `SELECT 
        sm.*,
        u.display_name,
        u.avatar_url,
        u.total_points,
        u.level
       FROM squad_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.squad_id = $1
       ORDER BY sm.role DESC, sm.joined_at ASC
       LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        "SELECT COUNT(*) as total FROM squad_members WHERE squad_id = $1",
        [id]
      );

      res.json({
        success: true,
        members: membersResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a post in squad
router.post(
  "/:id/posts",
  authenticate,
  squadIdValidation,
  createPostValidation,
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
      const { content, thread_id, attachments }: CreatePostRequest = req.body;
      const userId = req.user!.id;

      // Check if user is a member of the squad
      const memberResult = await query(
        "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [id, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "You must be a member of this squad to post",
        });
      }

      // If thread_id is provided, verify it belongs to this squad
      if (thread_id) {
        const threadResult = await query(
          "SELECT * FROM squad_threads WHERE id = $1 AND squad_id = $2",
          [thread_id, id]
        );

        if (threadResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Invalid thread ID for this squad",
          });
        }
      }

      // Create post
      const postResult = await query(
        `INSERT INTO squad_posts (squad_id, thread_id, user_id, content, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
        [id, thread_id || null, userId, content, attachments || []]
      );

      const post = postResult.rows[0];

      // Award points for creating a post
      await query(
        `INSERT INTO points_history (user_id, squad_id, points, reason, source_type, source_id)
       VALUES ($1, $2, 5, 'Created post', 'post', $3)`,
        [userId, id, post.id]
      );

      // Update user's total points
      await query(
        "UPDATE users SET total_points = total_points + 5 WHERE id = $1",
        [userId]
      );

      // Emit real-time update
      const { io } = require("../server");
      const { emitSquadUpdate } = require("../services/socketService");

      // Get additional post details for real-time update
      const postDetailsResult = await query(
        `SELECT 
          sp.*,
          u.display_name as user_name,
          u.avatar_url as user_avatar,
          s.name as squad_name
         FROM squad_posts sp
         JOIN users u ON sp.user_id = u.id
         JOIN squads s ON sp.squad_id = s.id
         WHERE sp.id = $1`,
        [post.id]
      );

      const postDetails = postDetailsResult.rows[0];

      emitSquadUpdate(io, id, {
        type: "NEW_POST",
        post: postDetails,
      });

      res.status(201).json({
        success: true,
        post,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get squad posts with pagination
router.get(
  "/:id/posts",
  optionalAuth,
  squadIdValidation,
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
      const { thread_id, page = 1, limit = 20 } = req.query as any;
      const currentUserId = req.user?.id;

      const offset = (Number(page) - 1) * Number(limit);

      // Check if squad exists and is accessible
      const squadResult = await query(
        `SELECT privacy FROM squads WHERE id = $1`,
        [id]
      );

      if (squadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Squad not found",
        });
      }

      const squad = squadResult.rows[0];

      // Check privacy for non-members
      if (squad.privacy !== "public") {
        const memberResult = await query(
          "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
          [id, currentUserId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: "This squad is private. You must be a member to view posts.",
          });
        }
      }

      // Build query for posts
      let whereConditions = "sp.squad_id = $1";
      let queryParams: any[] = [id];
      let paramIndex = 2;

      if (thread_id) {
        whereConditions += ` AND sp.thread_id = $${paramIndex}`;
        queryParams.push(thread_id);
        paramIndex++;
      }

      queryParams.push(limit, offset);

      // Get posts with user details
      const postsResult = await query(
        `SELECT 
        sp.*,
        u.display_name as user_name,
        u.avatar_url as user_avatar,
        st.title as thread_title,
        CASE 
          WHEN hv.id IS NOT NULL THEN true 
          ELSE false 
        END as has_voted
       FROM squad_posts sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN squad_threads st ON sp.thread_id = st.id
       LEFT JOIN helpful_votes hv ON hv.target_type = 'post' AND hv.target_id = sp.id AND hv.user_id = $${
         paramIndex - 2
       }
       WHERE ${whereConditions}
       ORDER BY sp.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM squad_posts sp
       WHERE ${whereConditions}`,
        queryParams.slice(0, -2)
      );

      res.json({
        success: true,
        posts: postsResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get post by ID
router.get(
  "/posts/:postId",
  optionalAuth,
  postIdValidation,
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

      const { postId } = req.params;
      const currentUserId = req.user?.id;

      // Get post with user and squad details
      const postResult = await query(
        `SELECT 
        sp.*,
        u.display_name as user_name,
        u.avatar_url as user_avatar,
        s.name as squad_name,
        s.privacy as squad_privacy,
        st.title as thread_title,
        CASE 
          WHEN hv.id IS NOT NULL THEN true 
          ELSE false 
        END as has_voted
       FROM squad_posts sp
       JOIN users u ON sp.user_id = u.id
       JOIN squads s ON sp.squad_id = s.id
       LEFT JOIN squad_threads st ON sp.thread_id = st.id
       LEFT JOIN helpful_votes hv ON hv.target_type = 'post' AND hv.target_id = sp.id AND hv.user_id = $2
       WHERE sp.id = $1`,
        [postId, currentUserId]
      );

      if (postResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      const post = postResult.rows[0];

      // Check privacy for non-members
      if (post.squad_privacy !== "public") {
        const memberResult = await query(
          "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
          [post.squad_id, currentUserId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error:
              "This post is in a private squad. You must be a member to view it.",
          });
        }
      }

      // Get comments for the post
      const commentsResult = await query(
        `SELECT 
        sc.*,
        u.display_name as user_name,
        u.avatar_url as user_avatar,
        CASE 
          WHEN hv.id IS NOT NULL THEN true 
          ELSE false 
        END as has_voted
       FROM squad_comments sc
       JOIN users u ON sc.user_id = u.id
       LEFT JOIN helpful_votes hv ON hv.target_type = 'comment' AND hv.target_id = sc.id AND hv.user_id = $2
       WHERE sc.post_id = $1
       ORDER BY sc.created_at ASC`,
        [postId, currentUserId]
      );

      res.json({
        success: true,
        post: {
          ...post,
          comments: commentsResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a comment on a post
router.post(
  "/posts/:postId/comments",
  authenticate,
  postIdValidation,
  createCommentValidation,
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

      const { postId } = req.params;
      const { content, parent_comment_id }: CreateCommentRequest = req.body;
      const userId = req.user!.id;

      // Get post and verify squad membership
      const postResult = await query(
        `SELECT sp.squad_id, s.privacy
       FROM squad_posts sp
       JOIN squads s ON sp.squad_id = s.id
       WHERE sp.id = $1`,
        [postId]
      );

      if (postResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      const post = postResult.rows[0];

      // Check if user is a member of the squad
      const memberResult = await query(
        "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [post.squad_id, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "You must be a member of this squad to comment",
        });
      }

      // If parent_comment_id is provided, verify it exists
      if (parent_comment_id) {
        const parentResult = await query(
          "SELECT * FROM squad_comments WHERE id = $1 AND post_id = $2",
          [parent_comment_id, postId]
        );

        if (parentResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Invalid parent comment ID",
          });
        }
      }

      // Create comment
      const commentResult = await query(
        `INSERT INTO squad_comments (post_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [postId, userId, content, parent_comment_id || null]
      );

      const comment = commentResult.rows[0];

      // Award points for creating a comment
      await query(
        `INSERT INTO points_history (user_id, squad_id, points, reason, source_type, source_id)
       VALUES ($1, $2, 2, 'Created comment', 'comment', $3)`,
        [userId, post.squad_id, comment.id]
      );

      // Update user's total points
      await query(
        "UPDATE users SET total_points = total_points + 2 WHERE id = $1",
        [userId]
      );

      // Emit real-time update
      const { io } = require("../server");
      const { emitSquadUpdate } = require("../services/socketService");

      // Get additional comment details for real-time update
      const commentDetailsResult = await query(
        `SELECT 
          sc.*,
          u.display_name as user_name,
          u.avatar_url as user_avatar
         FROM squad_comments sc
         JOIN users u ON sc.user_id = u.id
         WHERE sc.id = $1`,
        [comment.id]
      );

      const commentDetails = commentDetailsResult.rows[0];

      emitSquadUpdate(io, post.squad_id, {
        type: "NEW_COMMENT",
        comment: commentDetails,
        postId: postId,
      });

      res.status(201).json({
        success: true,
        comment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Vote on a post as helpful
router.post(
  "/posts/:postId/vote",
  authenticate,
  postIdValidation,
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

      const { postId } = req.params;
      const userId = req.user!.id;

      // Get post and verify squad membership
      const postResult = await query(
        `SELECT sp.user_id as post_creator_id, sp.squad_id, s.privacy
       FROM squad_posts sp
       JOIN squads s ON sp.squad_id = s.id
       WHERE sp.id = $1`,
        [postId]
      );

      if (postResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      const post = postResult.rows[0];

      // Check if user is a member of the squad
      const memberResult = await query(
        "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [post.squad_id, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "You must be a member of this squad to vote",
        });
      }

      // Check if user has already voted
      const voteResult = await query(
        `SELECT * FROM helpful_votes 
       WHERE user_id = $1 AND target_type = 'post' AND target_id = $2`,
        [userId, postId]
      );

      if (voteResult.rows.length > 0) {
        // Remove vote
        await query(
          `DELETE FROM helpful_votes 
         WHERE user_id = $1 AND target_type = 'post' AND target_id = $2`,
          [userId, postId]
        );

        // Remove points
        await query(
          `DELETE FROM points_history 
         WHERE user_id = $1 AND source_type = 'helpful_vote' AND source_id = $2`,
          [post.post_creator_id, postId]
        );

        // Update user's total points
        await query(
          "UPDATE users SET total_points = total_points - 3 WHERE id = $1",
          [post.post_creator_id]
        );

        // Emit real-time update
        const { io } = require("../server");
        const { emitSquadUpdate } = require("../services/socketService");

        emitSquadUpdate(io, post.squad_id, {
          type: "POST_VOTE_REMOVED",
          postId: postId,
          userId: userId,
        });

        res.json({
          success: true,
          message: "Vote removed",
          voted: false,
        });
      } else {
        // Add vote
        await query(
          `INSERT INTO helpful_votes (user_id, target_type, target_id)
         VALUES ($1, 'post', $2)`,
          [userId, postId]
        );

        // Award points to post creator
        await query(
          `INSERT INTO points_history (user_id, squad_id, points, reason, source_type, source_id)
         VALUES ($1, $2, 3, 'Received helpful vote', 'helpful_vote', $3)`,
          [post.post_creator_id, post.squad_id, postId]
        );

        // Update user's total points
        await query(
          "UPDATE users SET total_points = total_points + 3 WHERE id = $1",
          [post.post_creator_id]
        );

        // Emit real-time update
        const { io } = require("../server");
        const { emitSquadUpdate } = require("../services/socketService");

        // Get updated post details
        const updatedPostResult = await query(
          `SELECT helpful_votes FROM squad_posts WHERE id = $1`,
          [postId]
        );

        const helpfulVotes = updatedPostResult.rows[0]?.helpful_votes || 0;

        emitSquadUpdate(io, post.squad_id, {
          type: "POST_VOTE_ADDED",
          postId: postId,
          userId: userId,
          helpfulVotes: helpfulVotes,
        });

        res.json({
          success: true,
          message: "Vote added",
          voted: true,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Vote on a comment as helpful
router.post(
  "/comments/:commentId/vote",
  authenticate,
  commentIdValidation,
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

      const { commentId } = req.params;
      const userId = req.user!.id;

      // Get comment and verify squad membership
      const commentResult = await query(
        `SELECT sc.user_id as comment_creator_id, sp.squad_id, s.privacy
       FROM squad_comments sc
       JOIN squad_posts sp ON sc.post_id = sp.id
       JOIN squads s ON sp.squad_id = s.id
       WHERE sc.id = $1`,
        [commentId]
      );

      if (commentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        });
      }

      const comment = commentResult.rows[0];

      // Check if user is a member of the squad
      const memberResult = await query(
        "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [comment.squad_id, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "You must be a member of this squad to vote",
        });
      }

      // Check if user has already voted
      const voteResult = await query(
        `SELECT * FROM helpful_votes 
       WHERE user_id = $1 AND target_type = 'comment' AND target_id = $2`,
        [userId, commentId]
      );

      if (voteResult.rows.length > 0) {
        // Remove vote
        await query(
          `DELETE FROM helpful_votes 
         WHERE user_id = $1 AND target_type = 'comment' AND target_id = $2`,
          [userId, commentId]
        );

        // Remove points
        await query(
          `DELETE FROM points_history 
         WHERE user_id = $1 AND source_type = 'helpful_vote' AND source_id = $2`,
          [comment.comment_creator_id, commentId]
        );

        // Update user's total points
        await query(
          "UPDATE users SET total_points = total_points - 3 WHERE id = $1",
          [comment.comment_creator_id]
        );

        // Emit real-time update
        const { io } = require("../server");
        const { emitSquadUpdate } = require("../services/socketService");

        emitSquadUpdate(io, comment.squad_id, {
          type: "COMMENT_VOTE_REMOVED",
          commentId: commentId,
          userId: userId,
        });

        res.json({
          success: true,
          message: "Vote removed",
          voted: false,
        });
      } else {
        // Add vote
        await query(
          `INSERT INTO helpful_votes (user_id, target_type, target_id)
         VALUES ($1, 'comment', $2)`,
          [userId, commentId]
        );

        // Award points to comment creator
        await query(
          `INSERT INTO points_history (user_id, squad_id, points, reason, source_type, source_id)
         VALUES ($1, $2, 3, 'Received helpful vote', 'helpful_vote', $3)`,
          [comment.comment_creator_id, comment.squad_id, commentId]
        );

        // Update user's total points
        await query(
          "UPDATE users SET total_points = total_points + 3 WHERE id = $1",
          [comment.comment_creator_id]
        );

        // Emit real-time update
        const { io } = require("../server");
        const { emitSquadUpdate } = require("../services/socketService");

        // Get updated comment details
        const updatedCommentResult = await query(
          `SELECT helpful_votes FROM squad_comments WHERE id = $1`,
          [commentId]
        );

        const helpfulVotes = updatedCommentResult.rows[0]?.helpful_votes || 0;

        emitSquadUpdate(io, comment.squad_id, {
          type: "COMMENT_VOTE_ADDED",
          commentId: commentId,
          userId: userId,
          helpfulVotes: helpfulVotes,
        });

        res.json({
          success: true,
          message: "Vote added",
          voted: true,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Create a thread in squad
router.post(
  "/:id/threads",
  authenticate,
  squadIdValidation,
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
      const {
        title,
        description,
        type = "general",
        is_pinned = false,
      } = req.body;
      const userId = req.user!.id;

      // Validate input
      if (!title || title.length < 3 || title.length > 200) {
        return res.status(400).json({
          success: false,
          error: "Thread title must be 3-200 characters",
        });
      }

      // Check if user is a member of the squad
      const memberResult = await query(
        "SELECT role FROM squad_members WHERE squad_id = $1 AND user_id = $2",
        [id, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "You must be a member of this squad to create a thread",
        });
      }

      // Only admins and moderators can pin threads
      const canPin =
        is_pinned &&
        (memberResult.rows[0].role === "admin" ||
          memberResult.rows[0].role === "moderator");

      // Create thread
      const threadResult = await query(
        `INSERT INTO squad_threads (squad_id, title, description, type, is_pinned, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
        [id, title, description, type, canPin ? is_pinned : false, userId]
      );

      const thread = threadResult.rows[0];

      res.status(201).json({
        success: true,
        thread,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get squad threads
router.get(
  "/:id/threads",
  optionalAuth,
  squadIdValidation,
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
      const { type, page = 1, limit = 20 } = req.query as any;
      const currentUserId = req.user?.id;

      const offset = (Number(page) - 1) * Number(limit);

      // Check if squad exists and is accessible
      const squadResult = await query(
        `SELECT privacy FROM squads WHERE id = $1`,
        [id]
      );

      if (squadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Squad not found",
        });
      }

      const squad = squadResult.rows[0];

      // Check privacy for non-members
      if (squad.privacy !== "public") {
        const memberResult = await query(
          "SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2",
          [id, currentUserId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error:
              "This squad is private. You must be a member to view threads.",
          });
        }
      }

      // Build query for threads
      let whereConditions = "st.squad_id = $1";
      let queryParams: any[] = [id];
      let paramIndex = 2;

      if (type) {
        whereConditions += ` AND st.type = $${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
      }

      queryParams.push(limit, offset);

      // Get threads with creator details and post count
      const threadsResult = await query(
        `SELECT 
        st.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar,
        COUNT(sp.id) as post_count
       FROM squad_threads st
       JOIN users u ON st.created_by = u.id
       LEFT JOIN squad_posts sp ON st.id = sp.thread_id
       WHERE ${whereConditions}
       GROUP BY st.id, u.display_name, u.avatar_url
       ORDER BY st.is_pinned DESC, st.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM squad_threads st
       WHERE ${whereConditions}`,
        queryParams.slice(0, -2)
      );

      res.json({
        success: true,
        threads: threadsResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
