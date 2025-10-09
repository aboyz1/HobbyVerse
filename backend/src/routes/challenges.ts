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
  CreateChallengeRequest,
  SubmitChallengeRequest,
  Challenge,
  ChallengeSubmission,
} from "../types/project";

const router = Router();

// Validation rules
const createChallengeValidation = [
  body("title")
    .isLength({ min: 5, max: 200 })
    .withMessage("Challenge title must be 5-200 characters"),
  body("description")
    .isLength({ min: 20, max: 5000 })
    .withMessage("Description must be 20-5000 characters"),
  body("tags").isArray().withMessage("Tags must be an array"),
  body("difficulty_level")
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),
  body("points_reward")
    .isInt({ min: 1 })
    .withMessage("Points reward must be a positive number"),
  body("badge_reward")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Badge reward must be less than 100 characters"),
  body("start_date")
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
  body("end_date").isISO8601().withMessage("End date must be a valid ISO date"),
  body("max_participants")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max participants must be a positive number"),
  body("requirements").isArray().withMessage("Requirements must be an array"),
  body("submission_guidelines")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Submission guidelines must be 10-2000 characters"),
];

const submitChallengeValidation = [
  body("title")
    .isLength({ min: 3, max: 200 })
    .withMessage("Submission title must be 3-200 characters"),
  body("description")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Submission description must be 10-2000 characters"),
  body("submission_files")
    .isArray()
    .withMessage("Submission files must be an array"),
  body("github_url").optional().isURL().withMessage("Invalid GitHub URL"),
  body("live_demo_url").optional().isURL().withMessage("Invalid live demo URL"),
];

const challengeIdValidation = [
  param("id").isUUID().withMessage("Invalid challenge ID"),
];

const submissionIdValidation = [
  param("submissionId").isUUID().withMessage("Invalid submission ID"),
];

// Get all challenges with filtering and pagination
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        search,
        tags,
        difficulty,
        status,
        page = 1,
        limit = 20,
      } = req.query as any;
      const currentUserId = req.user?.id;

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Search filter
      if (search) {
        whereConditions.push(
          `(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Tags filter
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        whereConditions.push(`c.tags && $${paramIndex}`);
        queryParams.push(tagsArray);
        paramIndex++;
      }

      // Difficulty filter
      if (difficulty) {
        whereConditions.push(`c.difficulty_level = $${paramIndex}`);
        queryParams.push(difficulty);
        paramIndex++;
      }

      // Status filter
      if (status) {
        whereConditions.push(`c.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get challenges with creator info and user submission status
      const challengesResult = await query(
        `SELECT 
        c.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar,
        CASE 
          WHEN cs.id IS NOT NULL THEN true 
          ELSE false 
        END as has_submitted
       FROM challenges c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN challenge_submissions cs ON c.id = cs.challenge_id AND cs.user_id = $${paramIndex}
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
        [...queryParams, currentUserId || null, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM challenges c
       ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        data: challengesResult.rows.map((challenge: any) => ({
          ...challenge,
          creator: {
            display_name: challenge.creator_name || "Unknown User",
            avatar_url:
              challenge.creator_avatar || "https://via.placeholder.com/40",
          },
        })),
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

// Get challenge by ID
router.get(
  "/:id",
  optionalAuth,
  challengeIdValidation,
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

      // Get challenge details
      const challengeResult = await query(
        `SELECT 
        c.*,
        u.display_name as creator_name,
        u.avatar_url as creator_avatar
       FROM challenges c
       JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
        [id]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Challenge not found",
        });
      }

      const challenge = challengeResult.rows[0];

      // Get user submission if authenticated
      let userSubmission = null;
      let isParticipating = false;
      if (currentUserId) {
        const submissionResult = await query(
          `SELECT * FROM challenge_submissions WHERE challenge_id = $1 AND user_id = $2`,
          [id, currentUserId]
        );

        if (submissionResult.rows.length > 0) {
          userSubmission = submissionResult.rows[0];
          isParticipating = true;
        }
      }

      // Get submission count
      const submissionCountResult = await query(
        `SELECT COUNT(*) as submission_count FROM challenge_submissions WHERE challenge_id = $1 AND status = 'approved'`,
        [id]
      );

      res.json({
        success: true,
        data: {
          ...challenge,
          creator: {
            display_name: challenge.creator_name || "Unknown User",
            avatar_url:
              challenge.creator_avatar || "https://via.placeholder.com/40",
          },
          submission_count: parseInt(
            submissionCountResult.rows[0].submission_count
          ),
          user_submission: userSubmission,
          is_participating: isParticipating,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a new challenge
router.post(
  "/",
  authenticate,
  createChallengeValidation,
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

      const challengeData: CreateChallengeRequest = req.body;
      const userId = req.user!.id;

      // Validate date range
      if (
        new Date(challengeData.start_date) >= new Date(challengeData.end_date)
      ) {
        return res.status(400).json({
          success: false,
          error: "End date must be after start date",
        });
      }

      // Create challenge
      const challengeResult = await query(
        `INSERT INTO challenges (
        title, description, tags, difficulty_level, points_reward, badge_reward,
        start_date, end_date, max_participants, requirements, submission_guidelines, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
        [
          challengeData.title,
          challengeData.description,
          challengeData.tags,
          challengeData.difficulty_level,
          challengeData.points_reward,
          challengeData.badge_reward,
          challengeData.start_date,
          challengeData.end_date,
          challengeData.max_participants,
          challengeData.requirements,
          challengeData.submission_guidelines,
          userId,
        ]
      );

      const challenge = challengeResult.rows[0];

      res.status(201).json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update challenge (only creator can update)
router.put(
  "/:id",
  authenticate,
  challengeIdValidation,
  createChallengeValidation,
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
      const challengeData: CreateChallengeRequest = req.body;
      const userId = req.user!.id;

      // Validate date range
      if (
        new Date(challengeData.start_date) >= new Date(challengeData.end_date)
      ) {
        return res.status(400).json({
          success: false,
          error: "End date must be after start date",
        });
      }

      // Check if user is the challenge creator
      const challengeResult = await query(
        `SELECT created_by FROM challenges WHERE id = $1`,
        [id]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Challenge not found",
        });
      }

      if (challengeResult.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only the challenge creator can update the challenge",
        });
      }

      // Update challenge
      const updateResult = await query(
        `UPDATE challenges SET
        title = $1,
        description = $2,
        tags = $3,
        difficulty_level = $4,
        points_reward = $5,
        badge_reward = $6,
        start_date = $7,
        end_date = $8,
        max_participants = $9,
        requirements = $10,
        submission_guidelines = $11,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
        [
          challengeData.title,
          challengeData.description,
          challengeData.tags,
          challengeData.difficulty_level,
          challengeData.points_reward,
          challengeData.badge_reward,
          challengeData.start_date,
          challengeData.end_date,
          challengeData.max_participants,
          challengeData.requirements,
          challengeData.submission_guidelines,
          id,
        ]
      );

      res.json({
        success: true,
        data: updateResult.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete challenge (only creator can delete)
router.delete(
  "/:id",
  authenticate,
  challengeIdValidation,
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

      // Check if user is the challenge creator
      const challengeResult = await query(
        `SELECT created_by FROM challenges WHERE id = $1`,
        [id]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Challenge not found",
        });
      }

      if (challengeResult.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only the challenge creator can delete the challenge",
        });
      }

      // Delete challenge (cascading will delete related records)
      await query("DELETE FROM challenges WHERE id = $1", [id]);

      res.json({
        success: true,
        message: "Challenge deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Join challenge
router.post(
  "/:id/join",
  authenticate,
  challengeIdValidation,
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

      // Check if challenge exists and is active
      const challengeResult = await query(
        `SELECT * FROM challenges WHERE id = $1 AND status = 'active'`,
        [id]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Active challenge not found",
        });
      }

      const challenge = challengeResult.rows[0];

      // Check if user has already joined
      const existingParticipant = await query(
        `SELECT id FROM challenge_submissions WHERE challenge_id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (existingParticipant.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: "You have already joined this challenge",
        });
      }

      // Check participant limit
      if (challenge.max_participants) {
        const participantCountResult = await query(
          `SELECT COUNT(*) as count FROM challenge_submissions WHERE challenge_id = $1`,
          [id]
        );

        if (
          parseInt(participantCountResult.rows[0].count) >=
          challenge.max_participants
        ) {
          return res.status(400).json({
            success: false,
            error: "Challenge has reached maximum participants",
          });
        }
      }

      // Create a placeholder submission for the participant
      const submissionResult = await query(
        `INSERT INTO challenge_submissions (
        challenge_id, user_id, title, description, submission_files
      ) VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
        [id, userId, "Challenge Participation", "Joined the challenge", []]
      );

      // Update participant count
      await query(
        `UPDATE challenges SET current_participants = current_participants + 1 WHERE id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: "Successfully joined the challenge",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Leave challenge
router.post(
  "/:id/leave",
  authenticate,
  challengeIdValidation,
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

      // Check if user has joined the challenge
      const submissionResult = await query(
        `SELECT id FROM challenge_submissions WHERE challenge_id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (submissionResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: "You have not joined this challenge",
        });
      }

      // Delete the participant's submission
      await query(
        `DELETE FROM challenge_submissions WHERE challenge_id = $1 AND user_id = $2`,
        [id, userId]
      );

      // Update participant count
      await query(
        `UPDATE challenges SET current_participants = current_participants - 1 WHERE id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: "Successfully left the challenge",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Submit to challenge
router.post(
  "/:id/submit",
  authenticate,
  challengeIdValidation,
  submitChallengeValidation,
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
      const submissionData: SubmitChallengeRequest = req.body;
      const userId = req.user!.id;

      // Check if challenge exists and is active
      const challengeResult = await query(
        `SELECT * FROM challenges WHERE id = $1 AND status = 'active'`,
        [id]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Active challenge not found",
        });
      }

      const challenge = challengeResult.rows[0];

      // Check if user has already submitted
      const existingSubmission = await query(
        `SELECT id FROM challenge_submissions WHERE challenge_id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (existingSubmission.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: "You have already submitted to this challenge",
        });
      }

      // Check participant limit
      if (challenge.max_participants) {
        const participantCountResult = await query(
          `SELECT COUNT(*) as count FROM challenge_submissions WHERE challenge_id = $1`,
          [id]
        );

        if (
          parseInt(participantCountResult.rows[0].count) >=
          challenge.max_participants
        ) {
          return res.status(400).json({
            success: false,
            error: "Challenge has reached maximum participants",
          });
        }
      }

      // Create submission
      const submissionResult = await query(
        `INSERT INTO challenge_submissions (
        challenge_id, user_id, title, description, submission_files, github_url, live_demo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
        [
          id,
          userId,
          submissionData.title,
          submissionData.description,
          submissionData.submission_files,
          submissionData.github_url,
          submissionData.live_demo_url,
        ]
      );

      // Update participant count
      await query(
        `UPDATE challenges SET current_participants = current_participants + 1 WHERE id = $1`,
        [id]
      );

      // Emit real-time update
      const { io } = require("../server");
      const { emitChallengeUpdate } = require("../services/socketService");

      // Get additional submission details for real-time update
      const submissionDetailsResult = await query(
        `SELECT 
          cs.*,
          u.display_name as user_name,
          u.avatar_url as user_avatar,
          c.title as challenge_title
         FROM challenge_submissions cs
         JOIN users u ON cs.user_id = u.id
         JOIN challenges c ON cs.challenge_id = c.id
         WHERE cs.id = $1`,
        [submissionResult.rows[0].id]
      );

      const submissionDetails = submissionDetailsResult.rows[0];

      emitChallengeUpdate(io, id, {
        type: "NEW_SUBMISSION",
        submission: submissionDetails,
      });

      res.status(201).json({
        success: true,
        data: submissionResult.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get challenge submissions (for challenge creator)
router.get(
  "/:id/submissions",
  authenticate,
  challengeIdValidation,
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
      const { status, page = 1, limit = 20 } = req.query as any;
      const userId = req.user!.id;

      // Check if user is the challenge creator
      const challengeResult = await query(
        `SELECT created_by FROM challenges WHERE id = $1`,
        [id]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Challenge not found",
        });
      }

      if (challengeResult.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only the challenge creator can view submissions",
        });
      }

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions = [`cs.challenge_id = $1`];
      let queryParams: any[] = [id];
      let paramIndex = 2;

      // Status filter
      if (status) {
        whereConditions.push(`cs.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get submissions
      const submissionsResult = await query(
        `SELECT 
        cs.*,
        u.display_name as user_name,
        u.avatar_url as user_avatar
       FROM challenge_submissions cs
       JOIN users u ON cs.user_id = u.id
       ${whereClause}
       ORDER BY cs.submitted_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM challenge_submissions cs
       ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        data: submissionsResult.rows,
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

// Review challenge submission (for challenge creator)
router.put(
  "/:id/submissions/:submissionId/review",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, submissionId } = req.params;
      const { status, feedback, points_awarded } = req.body;
      const userId = req.user!.id;

      // Validate status
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status. Must be approved or rejected",
        });
      }

      // Check if user is the challenge creator
      const challengeResult = await query(
        `SELECT created_by, points_reward FROM challenges WHERE id = $1`,
        [id]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Challenge not found",
        });
      }

      if (challengeResult.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only the challenge creator can review submissions",
        });
      }

      // Update submission
      const submissionResult = await query(
        `UPDATE challenge_submissions 
       SET status = $1, feedback = $2, points_awarded = $3, reviewed_by = $4, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND challenge_id = $6
       RETURNING *`,
        [
          status,
          feedback || null,
          points_awarded ||
            (status === "approved" ? challengeResult.rows[0].points_reward : 0),
          userId,
          submissionId,
          id,
        ]
      );

      if (submissionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Submission not found",
        });
      }

      // If approved, award points to user
      if (status === "approved") {
        const submission = submissionResult.rows[0];

        // Update user points
        await query(
          `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
          [submission.points_awarded, submission.user_id]
        );

        // Add to points history
        await query(
          `INSERT INTO points_history (user_id, points, reason, source_type, source_id)
         VALUES ($1, $2, 'Challenge completion', 'challenge', $3)`,
          [submission.user_id, submission.points_awarded, id]
        );

        // Award badge if specified
        if (challengeResult.rows[0].badge_reward) {
          const badgeResult = await query(
            `SELECT id FROM badges WHERE name = $1`,
            [challengeResult.rows[0].badge_reward]
          );

          if (badgeResult.rows.length > 0) {
            await query(
              `INSERT INTO user_badges (user_id, badge_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, badge_id) DO NOTHING`,
              [submission.user_id, badgeResult.rows[0].id]
            );
          }
        }
      }

      res.json({
        success: true,
        data: submissionResult.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's challenge submissions
router.get(
  "/my-submissions",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const userId = req.user!.id;

      const offset = (Number(page) - 1) * Number(limit);

      // Get user's submissions
      const submissionsResult = await query(
        `SELECT 
        cs.*,
        c.title as challenge_title,
        c.difficulty_level as challenge_difficulty
       FROM challenge_submissions cs
       JOIN challenges c ON cs.challenge_id = c.id
       WHERE cs.user_id = $1
       ORDER BY cs.submitted_at DESC
       LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM challenge_submissions
       WHERE user_id = $1`,
        [userId]
      );

      res.json({
        success: true,
        data: submissionsResult.rows,
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
