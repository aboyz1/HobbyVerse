import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { query } from "../config/database";
import {
  param,
  query as expressQuery,
  validationResult,
} from "express-validator";

const router = Router();

// Validation rules
const searchQueryValidation = [
  expressQuery("q")
    .isLength({ min: 1 })
    .withMessage("Search query is required"),
  expressQuery("type")
    .optional()
    .isIn(["projects", "challenges", "squads", "users"])
    .withMessage("Invalid search type"),
  expressQuery("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),
  expressQuery("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  expressQuery("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

// Search across projects, challenges, squads, and users
router.get(
  "/",
  authenticate,
  searchQueryValidation,
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

      const { q, type, tags, page = 1, limit = 20 } = req.query as any;
      const userId = req.user!.id;
      const offset = (Number(page) - 1) * Number(limit);

      let results: any = {
        projects: [],
        challenges: [],
        squads: [],
        users: [],
      };

      // Search projects
      if (!type || type === "projects") {
        let projectsQuery = `
          SELECT 
            p.id,
            p.title,
            p.description,
            p.thumbnail_url,
            p.like_count,
            p.created_at,
            p.created_by,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar
          FROM projects p
          JOIN users u ON p.created_by = u.id
          WHERE (p.visibility = 'public' OR p.created_by = $1)
          AND (p.title ILIKE $2 OR p.description ILIKE $2)
        `;

        const queryParams: any[] = [userId, `%${q}%`];
        let paramIndex = 3;

        // Add tag filtering if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
          projectsQuery += ` AND p.tags && $${paramIndex}`;
          queryParams.push(tags);
          paramIndex++;
        }

        projectsQuery += ` ORDER BY p.like_count DESC, p.created_at DESC LIMIT $${paramIndex} OFFSET $${
          paramIndex + 1
        }`;
        queryParams.push(limit, offset);

        const projectsResult = await query(projectsQuery, queryParams);
        results.projects = projectsResult.rows;
      }

      // Search challenges
      if (!type || type === "challenges") {
        let challengesQuery = `
          SELECT 
            c.id,
            c.title,
            c.description,
            c.points_reward,
            c.badge_reward,
            c.current_participants,
            c.created_at,
            c.created_by,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar
          FROM challenges c
          JOIN users u ON c.created_by = u.id
          WHERE (c.title ILIKE $1 OR c.description ILIKE $1)
        `;

        const queryParams: any[] = [`%${q}%`];
        let paramIndex = 2;

        // Add tag filtering if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
          challengesQuery += ` AND c.tags && $${paramIndex}`;
          queryParams.push(tags);
          paramIndex++;
        }

        challengesQuery += ` ORDER BY c.current_participants DESC, c.created_at DESC LIMIT $${paramIndex} OFFSET $${
          paramIndex + 1
        }`;
        queryParams.push(limit, offset);

        const challengesResult = await query(challengesQuery, queryParams);
        results.challenges = challengesResult.rows;
      }

      // Search squads
      if (!type || type === "squads") {
        let squadsQuery = `
          SELECT 
            s.id,
            s.name,
            s.description,
            s.tags,
            s.avatar_url,
            s.member_count,
            s.created_at,
            s.created_by,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar
          FROM squads s
          JOIN users u ON s.created_by = u.id
          WHERE s.privacy = 'public'
          AND (s.name ILIKE $1 OR s.description ILIKE $1)
        `;

        const queryParams: any[] = [`%${q}%`];
        let paramIndex = 2;

        // Add tag filtering if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
          squadsQuery += ` AND s.tags && $${paramIndex}`;
          queryParams.push(tags);
          paramIndex++;
        }

        squadsQuery += ` ORDER BY s.member_count DESC, s.created_at DESC LIMIT $${paramIndex} OFFSET $${
          paramIndex + 1
        }`;
        queryParams.push(limit, offset);

        const squadsResult = await query(squadsQuery, queryParams);
        results.squads = squadsResult.rows;
      }

      // Search users
      if (!type || type === "users") {
        let usersQuery = `
          SELECT 
            u.id,
            u.display_name,
            u.avatar_url,
            u.bio,
            u.skills
          FROM users u
          WHERE u.id != $1
          AND (u.display_name ILIKE $2 OR u.bio ILIKE $2)
        `;

        const queryParams: any[] = [userId, `%${q}%`];
        let paramIndex = 3;

        // Add skill filtering if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
          usersQuery += ` AND u.skills && $${paramIndex}`;
          queryParams.push(tags);
          paramIndex++;
        }

        usersQuery += ` ORDER BY u.last_active DESC LIMIT $${paramIndex} OFFSET $${
          paramIndex + 1
        }`;
        queryParams.push(limit, offset);

        const usersResult = await query(usersQuery, queryParams);
        results.users = usersResult.rows;
      }

      res.json({
        success: true,
        data: results,
        query: q,
        filters: {
          type: type || null,
          tags: tags || null,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
