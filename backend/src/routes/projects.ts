import { Router, Request, Response, NextFunction } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { query } from "../config/database";
import {
  body,
  validationResult,
  param,
  query as expressQuery,
} from "express-validator";
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  Project,
  ProjectFile,
  ProjectUpdate,
} from "../types/project";

const router = Router();

// Validation rules
const createProjectValidation = [
  body("title")
    .isLength({ min: 3, max: 200 })
    .withMessage("Project title must be 3-200 characters"),
  body("description")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be 10-5000 characters"),
  body("tags").isArray().withMessage("Tags must be an array"),
  body("squad_id").optional().isUUID().withMessage("Invalid squad ID"),
  body("visibility")
    .isIn(["public", "squad_only", "private"])
    .withMessage("Invalid visibility setting"),
  body("difficulty_level")
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),
  body("estimated_hours")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Estimated hours must be a positive number"),
  body("thumbnail_url").optional().isURL().withMessage("Invalid thumbnail URL"),
];

const updateProjectValidation = [
  body("title")
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage("Project title must be 3-200 characters"),
  body("description")
    .optional()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be 10-5000 characters"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("status")
    .optional()
    .isIn(["planning", "in_progress", "completed", "on_hold"])
    .withMessage("Invalid status"),
  body("visibility")
    .optional()
    .isIn(["public", "squad_only", "private"])
    .withMessage("Invalid visibility setting"),
  body("difficulty_level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),
  body("estimated_hours")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Estimated hours must be a positive number"),
  body("actual_hours")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Actual hours must be a non-negative number"),
  body("thumbnail_url").optional().isURL().withMessage("Invalid thumbnail URL"),
];

const projectIdValidation = [
  param("id").isUUID().withMessage("Invalid project ID"),
];

const projectFileValidation = [
  body("filename")
    .isLength({ min: 1, max: 255 })
    .withMessage("Filename is required and must be less than 255 characters"),
  body("file_url").isURL().withMessage("Valid file URL is required"),
  body("file_type")
    .isLength({ min: 1, max: 100 })
    .withMessage("File type is required"),
  body("file_size")
    .isInt({ min: 1 })
    .withMessage("File size must be a positive number"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
];

const projectUpdateValidation = [
  body("title")
    .isLength({ min: 3, max: 200 })
    .withMessage("Update title must be 3-200 characters"),
  body("content")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Update content must be 10-2000 characters"),
  body("attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),
  body("progress_percentage")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress percentage must be between 0-100"),
  body("hours_logged")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Hours logged must be a non-negative number"),
];

// Get all projects with filtering and pagination
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        search,
        tags,
        status,
        difficulty,
        visibility,
        page = 1,
        limit = 20,
      } = req.query as any;
      const currentUserId = req.user?.id;

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions: string[] = ["p.visibility = $1"];
      let queryParams: any[] = ["public"];
      let paramIndex = 2;

      // For authenticated users, show public projects and their own projects
      if (currentUserId) {
        whereConditions = ["(p.visibility = $1 OR p.created_by = $2)"];
        queryParams = ["public", currentUserId];
        paramIndex = 3;
      }

      // Search filter
      if (search) {
        whereConditions.push(
          `(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Tags filter
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        whereConditions.push(`p.tags && $${paramIndex}`);
        queryParams.push(tagsArray);
        paramIndex++;
      }

      // Status filter
      if (status) {
        whereConditions.push(`p.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      // Difficulty filter
      if (difficulty) {
        whereConditions.push(`p.difficulty_level = $${paramIndex}`);
        queryParams.push(difficulty);
        paramIndex++;
      }

      // Visibility filter (only for authenticated users)
      if (visibility && currentUserId) {
        whereConditions.push(`p.visibility = $${paramIndex}`);
        queryParams.push(visibility);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // The like check parameter is always the next parameter after the where conditions
      const likeCheckParamIndex = paramIndex;

      // Calculate final parameter indices for LIMIT and OFFSET
      const limitParamIndex = paramIndex + 1;
      const offsetParamIndex = paramIndex + 2;

      // Get projects with creator info
      const projectsResult = await query(
        `SELECT 
        p.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar,
        COUNT(pl.id) as like_count,
        CASE 
          WHEN pl2.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_liked
       FROM projects p
       JOIN users u ON p.created_by = u.id
       LEFT JOIN project_likes pl ON p.id = pl.project_id
       LEFT JOIN project_likes pl2 ON p.id = pl2.project_id AND pl2.user_id = $${likeCheckParamIndex}
       ${whereClause}
       GROUP BY p.id, u.display_name, u.avatar_url, pl2.user_id
       ORDER BY p.created_at DESC
       LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
        [...queryParams, currentUserId, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM projects p
       ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        projects: projectsResult.rows,
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

// Get project by ID
router.get(
  "/:id",
  optionalAuth,
  projectIdValidation,
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

      // Get project details
      const projectResult = await query(
        `SELECT 
        p.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar,
        u.bio as creator_bio,
        COUNT(pl.id) as like_count,
        CASE 
          WHEN pl2.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_liked
       FROM projects p
       JOIN users u ON p.created_by = u.id
       LEFT JOIN project_likes pl ON p.id = pl.project_id
       LEFT JOIN project_likes pl2 ON p.id = pl2.project_id AND pl2.user_id = $2
       WHERE p.id = $1
       GROUP BY p.id, u.display_name, u.avatar_url, u.bio, pl2.user_id`,
        [id, currentUserId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      const project = projectResult.rows[0];

      // Check visibility
      if (
        project.visibility !== "public" &&
        project.created_by !== currentUserId &&
        !currentUserId
      ) {
        return res.status(403).json({
          success: false,
          error:
            "This project is private. You must be logged in and have permission to view it.",
        });
      }

      // Get project files
      const filesResult = await query(
        `SELECT * FROM project_files WHERE project_id = $1 ORDER BY uploaded_at DESC`,
        [id]
      );

      // Get project updates
      const updatesResult = await query(
        `SELECT pu.*, u.display_name as user_name, u.avatar_url as user_avatar
       FROM project_updates pu
       JOIN users u ON pu.user_id = u.id
       WHERE pu.project_id = $1
       ORDER BY pu.created_at DESC`,
        [id]
      );

      // Get collaborators
      if (project.collaborators && project.collaborators.length > 0) {
        const collaboratorsResult = await query(
          `SELECT id, display_name, avatar_url FROM users WHERE id = ANY($1)`,
          [project.collaborators]
        );
        project.collaborators = collaboratorsResult.rows;
      }

      res.json({
        success: true,
        project: {
          ...project,
          files: filesResult.rows,
          updates: updatesResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a new project
router.post(
  "/",
  authenticate,
  createProjectValidation,
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

      const projectData: CreateProjectRequest = req.body;
      const userId = req.user!.id;

      // Create project
      const projectResult = await query(
        `INSERT INTO projects (
        title, description, tags, squad_id, created_by, collaborators, 
        status, visibility, difficulty_level, estimated_hours, thumbnail_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
        [
          projectData.title,
          projectData.description,
          projectData.tags,
          projectData.squad_id,
          userId,
          [userId], // Add creator as collaborator
          "planning",
          projectData.visibility,
          projectData.difficulty_level,
          projectData.estimated_hours,
          projectData.thumbnail_url,
        ]
      );

      const project = projectResult.rows[0];

      res.status(201).json({
        success: true,
        project,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update project
router.put(
  "/:id",
  authenticate,
  projectIdValidation,
  updateProjectValidation,
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
      const updateData: UpdateProjectRequest = req.body;
      const userId = req.user!.id;

      // Check if user is the project creator
      const projectResult = await query(
        `SELECT created_by FROM projects WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      if (projectResult.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only the project creator can update the project",
        });
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateData.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateValues.push(updateData.title);
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

      if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(updateData.status);
        paramIndex++;
      }

      if (updateData.visibility !== undefined) {
        updateFields.push(`visibility = $${paramIndex}`);
        updateValues.push(updateData.visibility);
        paramIndex++;
      }

      if (updateData.difficulty_level !== undefined) {
        updateFields.push(`difficulty_level = $${paramIndex}`);
        updateValues.push(updateData.difficulty_level);
        paramIndex++;
      }

      if (updateData.estimated_hours !== undefined) {
        updateFields.push(`estimated_hours = $${paramIndex}`);
        updateValues.push(updateData.estimated_hours);
        paramIndex++;
      }

      if (updateData.actual_hours !== undefined) {
        updateFields.push(`actual_hours = $${paramIndex}`);
        updateValues.push(updateData.actual_hours);
        paramIndex++;
      }

      if (updateData.thumbnail_url !== undefined) {
        updateFields.push(`thumbnail_url = $${paramIndex}`);
        updateValues.push(updateData.thumbnail_url);
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
      UPDATE projects 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

      const result = await query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      res.json({
        success: true,
        project: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete project (only creator can delete)
router.delete(
  "/:id",
  authenticate,
  projectIdValidation,
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

      // Check if user is the project creator
      const projectResult = await query(
        `SELECT created_by FROM projects WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      if (projectResult.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only the project creator can delete the project",
        });
      }

      // Delete project (cascading will delete related records)
      await query("DELETE FROM projects WHERE id = $1", [id]);

      res.json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add file to project
router.post(
  "/:id/files",
  authenticate,
  projectIdValidation,
  projectFileValidation,
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
      const fileData = req.body;
      const userId = req.user!.id;

      // Check if user is the project creator or collaborator
      const projectResult = await query(
        `SELECT created_by, collaborators FROM projects WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      const project = projectResult.rows[0];
      const isAuthorized =
        project.created_by === userId ||
        (project.collaborators && project.collaborators.includes(userId));

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: "Only project creators and collaborators can add files",
        });
      }

      // Add file to project
      const fileResult = await query(
        `INSERT INTO project_files (
        project_id, filename, file_url, file_type, file_size, description, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
        [
          id,
          fileData.filename,
          fileData.file_url,
          fileData.file_type,
          fileData.file_size,
          fileData.description,
          userId,
        ]
      );

      res.status(201).json({
        success: true,
        file: fileResult.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete project file
router.delete(
  "/:id/files/:fileId",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fileId } = req.params;
      const userId = req.user!.id;

      // Check if user is the project creator or collaborator
      const projectResult = await query(
        `SELECT created_by, collaborators FROM projects WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      const project = projectResult.rows[0];
      const isAuthorized =
        project.created_by === userId ||
        (project.collaborators && project.collaborators.includes(userId));

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: "Only project creators and collaborators can delete files",
        });
      }

      // Delete file
      const fileResult = await query(
        `DELETE FROM project_files WHERE id = $1 AND project_id = $2 RETURNING *`,
        [fileId, id]
      );

      if (fileResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "File not found",
        });
      }

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add project update
router.post(
  "/:id/updates",
  authenticate,
  projectIdValidation,
  projectUpdateValidation,
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
      const updateData = req.body;
      const userId = req.user!.id;

      // Check if user is the project creator or collaborator
      const projectResult = await query(
        `SELECT created_by, collaborators FROM projects WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      const project = projectResult.rows[0];
      const isAuthorized =
        project.created_by === userId ||
        (project.collaborators && project.collaborators.includes(userId));

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: "Only project creators and collaborators can add updates",
        });
      }

      // Add update to project
      const updateResult = await query(
        `INSERT INTO project_updates (
        project_id, user_id, title, content, attachments, progress_percentage, hours_logged
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
        [
          id,
          userId,
          updateData.title,
          updateData.content,
          updateData.attachments || [],
          updateData.progress_percentage,
          updateData.hours_logged || 0,
        ]
      );

      // Update project's actual hours if provided
      if (updateData.hours_logged && updateData.hours_logged > 0) {
        await query(
          `UPDATE projects SET actual_hours = COALESCE(actual_hours, 0) + $1 WHERE id = $2`,
          [updateData.hours_logged, id]
        );
      }

      res.status(201).json({
        success: true,
        update: updateResult.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Like/unlike project
router.post(
  "/:id/like",
  authenticate,
  projectIdValidation,
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

      // Check if project exists and is public or user has access
      const projectResult = await query(
        `SELECT visibility, created_by FROM projects WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      const project = projectResult.rows[0];
      if (project.visibility !== "public" && project.created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to like this project",
        });
      }

      // Check if user already liked the project
      const existingLike = await query(
        `SELECT id FROM project_likes WHERE user_id = $1 AND project_id = $2`,
        [userId, id]
      );

      let liked = false;
      if (existingLike.rows.length > 0) {
        // Unlike the project
        await query(
          `DELETE FROM project_likes WHERE user_id = $1 AND project_id = $2`,
          [userId, id]
        );

        // Update project like count
        await query(
          `UPDATE projects SET like_count = like_count - 1 WHERE id = $1`,
          [id]
        );

        liked = false;
      } else {
        // Like the project
        await query(
          `INSERT INTO project_likes (user_id, project_id) VALUES ($1, $2)`,
          [userId, id]
        );

        // Update project like count
        await query(
          `UPDATE projects SET like_count = like_count + 1 WHERE id = $1`,
          [id]
        );

        liked = true;
      }

      // Get updated like count
      const updatedProjectResult = await query(
        `SELECT like_count FROM projects WHERE id = $1`,
        [id]
      );

      const likeCount = updatedProjectResult.rows[0]?.like_count || 0;

      // Emit real-time update
      const { io } = require("../server");
      const { emitProjectUpdate } = require("../services/socketService");

      emitProjectUpdate(io, id, {
        type: "LIKE_UPDATE",
        projectId: id,
        likeCount: likeCount,
        likedBy: userId,
        liked: liked,
      });

      res.status(200).json({
        success: true,
        message: liked
          ? "Project liked successfully"
          : "Project unliked successfully",
        liked: liked,
        likeCount: likeCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Repost project
router.post(
  "/:id/repost",
  authenticate,
  projectIdValidation,
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

      // Check if project exists and is public or user has access
      const projectResult = await query(
        `SELECT visibility, created_by FROM projects WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      const project = projectResult.rows[0];
      if (project.visibility !== "public" && project.created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to repost this project",
        });
      }

      // Check if user already reposted the project
      const existingRepost = await query(
        `SELECT id FROM reposts WHERE user_id = $1 AND post_type = 'project' AND post_id = $2`,
        [userId, id]
      );

      if (existingRepost.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: "You have already reposted this project",
        });
      }

      // Create the repost
      const insertRepostQuery = `
        INSERT INTO reposts (user_id, post_type, post_id, original_post_id)
        VALUES ($1, 'project', $2, $2)
        RETURNING id, created_at
      `;

      const result = await query(insertRepostQuery, [userId, id]);

      if (result.rowCount === 0) {
        return res.status(500).json({
          success: false,
          error: "Failed to repost",
        });
      }

      // Get updated repost count
      const countQuery = `
        SELECT repost_count FROM projects WHERE id = $1
      `;
      const countResult = await query(countQuery, [id]);
      const repostCount = parseInt(countResult.rows[0].repost_count);

      // Emit a WebSocket event for the repost
      const { io } = require("../server");
      const { emitProjectUpdate } = require("../services/socketService");

      emitProjectUpdate(io, id, {
        type: "REPOST_UPDATE",
        projectId: id,
        repostCount: repostCount,
      });

      res.status(201).json({
        success: true,
        message: "Project reposted successfully",
        repostCount: repostCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
