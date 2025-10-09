import { Router, Request, Response, NextFunction } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { query } from "../config/database";
import { param, query as expressQuery } from "express-validator";
import { validationResult } from "express-validator";

const router = Router();

// Validation rules
const badgeIdValidation = [
  param("id").isUUID().withMessage("Invalid badge ID"),
];

// Get all badges
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, rarity } = req.query as any;

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Rarity filter
      if (rarity) {
        whereConditions.push(`b.rarity = $${paramIndex}`);
        queryParams.push(rarity);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get badges
      const badgesResult = await query(
        `SELECT 
        b.*,
        COUNT(ub.id) as earned_count
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id
       ${whereClause}
       GROUP BY b.id
       ORDER BY b.rarity DESC, b.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM badges b
       ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        badges: badgesResult.rows,
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

// Get badge by ID
router.get(
  "/:id",
  optionalAuth,
  badgeIdValidation,
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

      // Get badge details
      const badgeResult = await query(
        `SELECT 
        b.*,
        COUNT(ub.id) as earned_count
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id
       WHERE b.id = $1
       GROUP BY b.id`,
        [id]
      );

      if (badgeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Badge not found",
        });
      }

      const badge = badgeResult.rows[0];

      // Get recent earners
      const earnersResult = await query(
        `SELECT 
        u.id, u.display_name, u.avatar_url, ub.earned_at
       FROM user_badges ub
       JOIN users u ON ub.user_id = u.id
       WHERE ub.badge_id = $1
       ORDER BY ub.earned_at DESC
       LIMIT 10`,
        [id]
      );

      res.json({
        success: true,
        badge: {
          ...badge,
          recent_earners: earnersResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's badges
router.get(
  "/user/:userId",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query as any;

      const offset = (Number(page) - 1) * Number(limit);

      // Get user's badges
      const badgesResult = await query(
        `SELECT 
        b.*, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC
       LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM user_badges
       WHERE user_id = $1`,
        [userId]
      );

      res.json({
        success: true,
        badges: badgesResult.rows,
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
