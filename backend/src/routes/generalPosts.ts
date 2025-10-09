import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { query } from "../config/database";
import { body, validationResult } from "express-validator";
import { io } from "../services/socketService"; // Import the Socket.IO server instance

const router = Router();

// Validation rules for creating a post
const createPostValidation = [
  body("content")
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Post content must be between 1 and 2000 characters"),
];

// Create a new general post
router.post(
  "/",
  authenticate,
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

      const { content, attachments = [] } = req.body;
      const userId = req.user!.id;

      // Insert the new post
      const insertPostQuery = `
        INSERT INTO general_posts (user_id, content, attachments)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, content, attachments, like_count, comment_count, created_at, updated_at
      `;

      const result = await query(insertPostQuery, [
        userId,
        content,
        attachments,
      ]);

      if (result.rowCount === 0) {
        return res.status(500).json({
          success: false,
          error: "Failed to create post",
        });
      }

      const newPost = result.rows[0];

      res.status(201).json({
        success: true,
        data: newPost,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get general posts with pagination
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const offset = (Number(page) - 1) * Number(limit);
      const userId = req.user!.id;

      // Get general posts with user information
      const getPostsQuery = `
        SELECT 
          gp.id,
          gp.content,
          gp.attachments,
          gp.like_count,
          gp.comment_count,
          gp.created_at,
          gp.updated_at,
          u.id as user_id,
          u.display_name as user_display_name,
          u.avatar_url as user_avatar_url
        FROM general_posts gp
        JOIN users u ON gp.user_id = u.id
        ORDER BY gp.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await query(getPostsQuery, [limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.rowCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get a specific general post by ID
router.get(
  "/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get the post with user information
      const getPostQuery = `
        SELECT 
          gp.id,
          gp.content,
          gp.attachments,
          gp.like_count,
          gp.comment_count,
          gp.created_at,
          gp.updated_at,
          u.id as user_id,
          u.display_name as user_display_name,
          u.avatar_url as user_avatar_url
        FROM general_posts gp
        JOIN users u ON gp.user_id = u.id
        WHERE gp.id = $1
      `;

      const result = await query(getPostQuery, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Like a general post
router.post(
  "/:id/like",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if the post exists
      const postExistsQuery = `
        SELECT id FROM general_posts WHERE id = $1
      `;
      const postExistsResult = await query(postExistsQuery, [id]);

      if (postExistsResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      // Check if user already liked the post
      const likeExistsQuery = `
        SELECT id FROM general_post_likes WHERE post_id = $1 AND user_id = $2
      `;
      const likeExistsResult = await query(likeExistsQuery, [id, userId]);

      let likeCount = 0;
      let liked = false;

      if (likeExistsResult.rowCount > 0) {
        // Unlike the post
        const unlikeQuery = `
          DELETE FROM general_post_likes WHERE post_id = $1 AND user_id = $2
        `;
        await query(unlikeQuery, [id, userId]);

        // Get updated like count
        const countQuery = `
          SELECT COUNT(*) as like_count FROM general_post_likes WHERE post_id = $1
        `;
        const countResult = await query(countQuery, [id]);
        likeCount = parseInt(countResult.rows[0].like_count);
        liked = false;
      } else {
        // Like the post
        const likeQuery = `
          INSERT INTO general_post_likes (post_id, user_id)
          VALUES ($1, $2)
        `;
        await query(likeQuery, [id, userId]);

        // Get updated like count
        const countQuery = `
          SELECT COUNT(*) as like_count FROM general_post_likes WHERE post_id = $1
        `;
        const countResult = await query(countQuery, [id]);
        likeCount = parseInt(countResult.rows[0].like_count);
        liked = true;
      }

      // Emit a WebSocket event for the like update
      if (io) {
        io.emit("general_post_update", {
          type: "LIKE_UPDATE",
          postId: id,
          likeCount: likeCount,
          liked: liked,
          likedBy: userId,
        });
      }

      res.json({
        success: true,
        message: liked ? "Post liked" : "Post unliked",
        liked: liked,
        likeCount: likeCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get comments for a general post
router.get(
  "/:id/comments",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      // Check if the post exists
      const postExistsQuery = `
        SELECT id FROM general_posts WHERE id = $1
      `;
      const postExistsResult = await query(postExistsQuery, [id]);

      if (postExistsResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      // Get comments with user information
      const getCommentsQuery = `
        SELECT 
          gpc.id,
          gpc.content,
          gpc.like_count,
          gpc.created_at,
          gpc.updated_at,
          gpc.parent_comment_id,
          u.id as user_id,
          u.display_name as user_display_name,
          u.avatar_url as user_avatar_url
        FROM general_post_comments gpc
        JOIN users u ON gpc.user_id = u.id
        WHERE gpc.post_id = $1
        ORDER BY gpc.created_at ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await query(getCommentsQuery, [id, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.rowCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a comment on a general post
router.post(
  "/:id/comments",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { content, parent_comment_id } = req.body;
      const userId = req.user!.id;

      // Validate content
      if (!content || content.trim().length === 0 || content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: "Comment content must be between 1 and 1000 characters",
        });
      }

      // Check if the post exists
      const postExistsQuery = `
        SELECT id FROM general_posts WHERE id = $1
      `;
      const postExistsResult = await query(postExistsQuery, [id]);

      if (postExistsResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      // Insert the new comment
      const insertCommentQuery = `
        INSERT INTO general_post_comments (post_id, user_id, content, parent_comment_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, post_id, user_id, content, parent_comment_id, like_count, created_at, updated_at
      `;

      const result = await query(insertCommentQuery, [
        id,
        userId,
        content.trim(),
        parent_comment_id || null,
      ]);

      if (result.rowCount === 0) {
        return res.status(500).json({
          success: false,
          error: "Failed to create comment",
        });
      }

      const newComment = result.rows[0];

      // Emit a WebSocket event for the new comment
      if (io) {
        io.emit("general_post_update", {
          type: "NEW_COMMENT",
          postId: id,
          comment: newComment,
        });
      }

      res.status(201).json({
        success: true,
        data: newComment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Repost a general post
router.post(
  "/:id/repost",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { content } = req.body; // Optional comment when reposting
      const userId = req.user!.id;

      // Check if the post exists
      const postExistsQuery = `
        SELECT id FROM general_posts WHERE id = $1
      `;
      const postExistsResult = await query(postExistsQuery, [id]);

      if (postExistsResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      // Check if user already reposted the post
      const repostExistsQuery = `
        SELECT id FROM reposts WHERE user_id = $1 AND post_type = 'general_post' AND post_id = $2
      `;
      const repostExistsResult = await query(repostExistsQuery, [userId, id]);

      if (repostExistsResult.rowCount > 0) {
        return res.status(400).json({
          success: false,
          error: "You have already reposted this post",
        });
      }

      // Create the repost
      const insertRepostQuery = `
        INSERT INTO reposts (user_id, post_type, post_id, original_post_id, content)
        VALUES ($1, 'general_post', $2, $2, $3)
        RETURNING id, created_at
      `;

      const result = await query(insertRepostQuery, [
        userId,
        id,
        content || null,
      ]);

      if (result.rowCount === 0) {
        return res.status(500).json({
          success: false,
          error: "Failed to repost",
        });
      }

      const newRepost = result.rows[0];

      // Get updated repost count
      const countQuery = `
        SELECT repost_count FROM general_posts WHERE id = $1
      `;
      const countResult = await query(countQuery, [id]);
      const repostCount = parseInt(countResult.rows[0].repost_count);

      // Emit a WebSocket event for the repost
      if (io) {
        io.emit("general_post_update", {
          type: "REPOST_UPDATE",
          postId: id,
          repostCount: repostCount,
        });
      }

      res.status(201).json({
        success: true,
        message: "Post reposted successfully",
        repostCount: repostCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get reposts for a general post
router.get(
  "/:id/reposts",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      // Check if the post exists
      const postExistsQuery = `
        SELECT id FROM general_posts WHERE id = $1
      `;
      const postExistsResult = await query(postExistsQuery, [id]);

      if (postExistsResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      // Get reposts with user information
      const getRepostsQuery = `
        SELECT 
          r.id,
          r.content,
          r.created_at,
          u.id as user_id,
          u.display_name as user_display_name,
          u.avatar_url as user_avatar_url
        FROM reposts r
        JOIN users u ON r.user_id = u.id
        WHERE r.post_type = 'general_post' AND r.post_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await query(getRepostsQuery, [id, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.rowCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
