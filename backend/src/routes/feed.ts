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
const feedQueryValidation = [
  expressQuery("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  expressQuery("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const trendingQueryValidation = [
  expressQuery("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  expressQuery("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

// Get user's personalized feed
router.get(
  "/",
  authenticate,
  feedQueryValidation,
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

      const { page = 1, limit = 20 } = req.query as any;
      const userId = req.user!.id;
      const offset = (Number(page) - 1) * Number(limit);

      // Get user's feed based on their follows, squad memberships, and interests
      const feedQuery = `
        WITH user_follows AS (
          SELECT following_id as target_user_id
          FROM follows
          WHERE follower_id = $1
        ),
        user_squads AS (
          SELECT squad_id
          FROM squad_members
          WHERE user_id = $1
        ),
        feed_items AS (
          -- Projects from followed users
          SELECT 
            'project' as type,
            p.id::text,
            p.title,
            p.description,
            p.thumbnail_url,
            p.like_count,
            NULL as comment_count,
            p.created_at,
            p.created_by::text,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar,
            p.squad_id::text,
            s.name as squad_name,
            NULL::text as challenge_id,
            c.title as challenge_title,
            CASE 
              WHEN pl.user_id IS NOT NULL THEN true 
              ELSE false 
            END as is_liked
          FROM projects p
          JOIN users u ON p.created_by = u.id
          LEFT JOIN squads s ON p.squad_id = s.id
          LEFT JOIN challenges c ON p.id = c.id
          LEFT JOIN project_likes pl ON p.id = pl.project_id AND pl.user_id = $1
          WHERE p.visibility = 'public' OR p.created_by = $1
          
          UNION ALL
          
          -- Squad posts from user's squads
          SELECT 
            'squad_post' as type,
            sp.id::text,
            st.title,
            sp.content,
            NULL as thumbnail_url,
            sp.helpful_votes as like_count,
            sp.reply_count as comment_count,
            sp.created_at,
            sp.user_id::text as created_by,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar,
            sp.squad_id::text,
            s.name as squad_name,
            NULL::text as challenge_id,
            NULL as challenge_title,
            false as is_liked
          FROM squad_posts sp
          JOIN users u ON sp.user_id = u.id
          JOIN squads s ON sp.squad_id = s.id
          JOIN squad_threads st ON sp.thread_id = st.id
          
          UNION ALL
          
          -- Challenge submissions from followed users
          SELECT 
            'challenge_submission' as type,
            cs.id::text,
            cs.title,
            cs.description,
            cs.submission_files[1] as thumbnail_url,
            0 as like_count,
            0 as comment_count,
            cs.submitted_at as created_at,
            cs.user_id::text as created_by,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar,
            NULL::text as squad_id,
            NULL as squad_name,
            cs.challenge_id::text,
            c.title as challenge_title,
            false as is_liked
          FROM challenge_submissions cs
          JOIN users u ON cs.user_id = u.id
          JOIN challenges c ON cs.challenge_id = c.id
          WHERE cs.status = 'approved'
          
          UNION ALL
          
          -- General posts from followed users and self
          SELECT 
            'general_post' as type,
            gp.id::text,
            NULL as title,
            gp.content as description,
            NULL as thumbnail_url,
            gp.like_count,
            gp.comment_count,
            gp.created_at,
            gp.user_id::text as created_by,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar,
            NULL::text as squad_id,
            NULL as squad_name,
            NULL::text as challenge_id,
            NULL as challenge_title,
            CASE 
              WHEN gpl.user_id IS NOT NULL THEN true 
              ELSE false 
            END as is_liked
          FROM general_posts gp
          JOIN users u ON gp.user_id = u.id
          LEFT JOIN follows f ON f.following_id = gp.user_id AND f.follower_id = $1
          LEFT JOIN general_post_likes gpl ON gp.id = gpl.post_id AND gpl.user_id = $1
          WHERE gp.user_id = $1 OR f.follower_id IS NOT NULL
        )
        SELECT *
        FROM feed_items
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const feedResult = await query(feedQuery, [userId, limit, offset]);

      res.json({
        success: true,
        data: feedResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: feedResult.rowCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get global trending feed
router.get(
  "/global",
  trendingQueryValidation,
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

      const { page = 1, limit = 20 } = req.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      // Get trending content across the platform
      const trendingQuery = `
        WITH trending_projects AS (
          SELECT 
            p.id::text,
            p.title,
            p.description,
            p.thumbnail_url,
            p.like_count,
            p.view_count,
            NULL as comment_count,
            p.created_at,
            p.created_by::text,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar,
            NULL::text as squad_id,
            NULL as squad_name,
            NULL::text as challenge_id,
            NULL as challenge_title,
            (p.like_count * 2 + p.view_count) as score,
            CASE 
              WHEN pl.user_id IS NOT NULL THEN true 
              ELSE false 
            END as is_liked
          FROM projects p
          JOIN users u ON p.created_by = u.id
          LEFT JOIN project_likes pl ON p.id = pl.project_id AND pl.user_id = $3
          WHERE p.visibility = 'public'
          AND p.created_at > NOW() - INTERVAL '30 days'
        ),
        trending_squad_posts AS (
          SELECT 
            sp.id::text,
            st.title,
            sp.content,
            NULL as thumbnail_url,
            sp.helpful_votes as like_count,
            sp.reply_count as comment_count,
            sp.created_at,
            sp.user_id::text as created_by,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar,
            sp.squad_id::text,
            s.name as squad_name,
            NULL::text as challenge_id,
            NULL as challenge_title,
            (sp.helpful_votes * 3 + sp.reply_count * 2) as score,
            false as is_liked
          FROM squad_posts sp
          JOIN users u ON sp.user_id = u.id
          JOIN squads s ON sp.squad_id = s.id
          JOIN squad_threads st ON sp.thread_id = st.id
          WHERE sp.created_at > NOW() - INTERVAL '30 days'
        ),
        trending_challenges AS (
          SELECT 
            c.id::text,
            c.title,
            c.description,
            NULL as thumbnail_url,
            c.current_participants as like_count,
            0 as comment_count,
            c.created_at,
            c.created_by::text,
            u.display_name as creator_name,
            u.avatar_url as creator_avatar,
            NULL::text as squad_id,
            NULL as squad_name,
            c.id::text as challenge_id,
            c.title as challenge_title,
            (c.current_participants * 5) as score,
            false as is_liked
          FROM challenges c
          JOIN users u ON c.created_by = u.id
          WHERE c.status = 'active'
        )
        SELECT 
          'project' as type,
          id,
          title,
          description,
          thumbnail_url,
          like_count,
          comment_count,
          created_at,
          created_by,
          creator_name,
          creator_avatar,
          squad_id,
          squad_name,
          challenge_id,
          challenge_title,
          score,
          is_liked
        FROM trending_projects
        
        UNION ALL
        
        SELECT 
          'squad_post' as type,
          id,
          title,
          content as description,
          thumbnail_url,
          like_count,
          comment_count,
          created_at,
          created_by,
          creator_name,
          creator_avatar,
          squad_id,
          squad_name,
          challenge_id,
          challenge_title,
          score,
          is_liked
        FROM trending_squad_posts
        
        UNION ALL
        
        SELECT 
          'challenge' as type,
          id,
          title,
          description,
          thumbnail_url,
          like_count,
          comment_count,
          created_at,
          created_by,
          creator_name,
          creator_avatar,
          squad_id,
          squad_name,
          challenge_id,
          challenge_title,
          score,
          is_liked
        FROM trending_challenges
        
        ORDER BY score DESC, created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const userId = req.user?.id || null;
      const trendingResult = await query(trendingQuery, [
        limit,
        offset,
        userId,
      ]);

      res.json({
        success: true,
        data: trendingResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: trendingResult.rowCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get trending projects
router.get(
  "/trending/projects",
  trendingQueryValidation,
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

      const { page = 1, limit = 20 } = req.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      const trendingProjectsQuery = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.thumbnail_url,
          p.like_count,
          p.view_count,
          p.created_at,
          p.created_by,
          u.display_name as creator_name,
          u.avatar_url as creator_avatar,
          (p.like_count * 2 + p.view_count) as score
        FROM projects p
        JOIN users u ON p.created_by = u.id
        WHERE p.visibility = 'public'
        AND p.created_at > NOW() - INTERVAL '30 days'
        ORDER BY (p.like_count * 2 + p.view_count) DESC, p.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await query(trendingProjectsQuery, [limit, offset]);

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

// Get trending challenges
router.get(
  "/trending/challenges",
  trendingQueryValidation,
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

      const { page = 1, limit = 20 } = req.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      const trendingChallengesQuery = `
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
          u.avatar_url as creator_avatar,
          (c.current_participants * 5) as score
        FROM challenges c
        JOIN users u ON c.created_by = u.id
        WHERE c.status = 'active'
        ORDER BY (c.current_participants * 5) DESC, c.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await query(trendingChallengesQuery, [limit, offset]);

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

// Get trending squads
router.get(
  "/trending/squads",
  trendingQueryValidation,
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

      const { page = 1, limit = 20 } = req.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      const trendingSquadsQuery = `
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
          u.avatar_url as creator_avatar,
          (s.member_count * 3) as score
        FROM squads s
        JOIN users u ON s.created_by = u.id
        WHERE s.privacy = 'public'
        ORDER BY (s.member_count * 3) DESC, s.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await query(trendingSquadsQuery, [limit, offset]);

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

// Get personalized recommendations
router.get(
  "/recommendations",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Get user's interests from their projects and challenges
      const userInterestsQuery = `
        WITH user_interests AS (
          SELECT DISTINCT unnest(p.tags) as tag
          FROM projects p
          WHERE p.created_by = $1
          
          UNION
          
          SELECT DISTINCT unnest(c.tags) as tag
          FROM challenge_submissions cs
          JOIN challenges c ON cs.challenge_id = c.id
          WHERE cs.user_id = $1
        )
        SELECT tag FROM user_interests LIMIT 10
      `;

      const interestsResult = await query(userInterestsQuery, [userId]);
      const userTags = interestsResult.rows.map((row: any) => row.tag);

      // Get recommended projects based on user interests
      let recommendedProjectsQuery = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.thumbnail_url,
          p.like_count,
          p.created_by,
          u.display_name as creator,
          p.tags,
          CASE 
            WHEN pl.user_id IS NOT NULL THEN true 
            ELSE false 
          END as is_liked
        FROM projects p
        JOIN users u ON p.created_by = u.id
        LEFT JOIN project_likes pl ON p.id = pl.project_id AND pl.user_id = $1
        WHERE p.visibility = 'public'
      `;

      let recommendedChallengesQuery = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.points_reward,
          c.current_participants as participants
        FROM challenges c
        WHERE c.status = 'active'
      `;

      let recommendedSquadsQuery = `
        SELECT 
          s.id,
          s.name,
          s.description,
          s.member_count,
          s.avatar_url
        FROM squads s
        WHERE s.privacy = 'public'
      `;

      // Add tag filtering if user has interests
      if (userTags.length > 0) {
        const tagFilter = userTags
          .map((tag: string, index: number) => `p.tags @> ARRAY['${tag}']`)
          .join(" OR ");

        recommendedProjectsQuery += ` AND (${tagFilter})`;
        recommendedChallengesQuery += ` AND (${tagFilter.replace(
          /p\./g,
          "c."
        )})`;
        recommendedSquadsQuery += ` AND (${tagFilter.replace(/p\./g, "s.")})`;
      }

      recommendedProjectsQuery += ` ORDER BY p.like_count DESC LIMIT 5`;
      recommendedChallengesQuery += ` ORDER BY c.current_participants DESC LIMIT 5`;
      recommendedSquadsQuery += ` ORDER BY s.member_count DESC LIMIT 5`;

      const [projectsResult, challengesResult, squadsResult] =
        await Promise.all([
          query(recommendedProjectsQuery, [userId]),
          query(recommendedChallengesQuery),
          query(recommendedSquadsQuery),
        ]);

      res.json({
        success: true,
        data: {
          projects: projectsResult.rows,
          challenges: challengesResult.rows,
          squads: squadsResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
