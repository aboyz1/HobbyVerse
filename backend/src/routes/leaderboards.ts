import { Router, Request, Response, NextFunction } from "express";
import { optionalAuth } from "../middleware/auth";
import { query } from "../config/database";
import { param } from "express-validator";
import { validationResult } from "express-validator";

const router = Router();

// Validation rules
const squadIdValidation = [
  param("id").isUUID().withMessage("Invalid squad ID"),
];

// Get global leaderboard
router.get(
  "/global",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, timeframe = "all" } = req.query as any;

      const offset = (Number(page) - 1) * Number(limit);

      // Determine time filter
      let timeCondition = "";
      const now = new Date();

      switch (timeframe) {
        case "week":
          timeCondition = `AND ph.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
          break;
        case "month":
          timeCondition = `AND ph.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
          break;
        case "year":
          timeCondition = `AND ph.created_at >= CURRENT_DATE - INTERVAL '365 days'`;
          break;
        default:
          // All time - no condition needed
          break;
      }

      // Get top users by points
      const leaderboardResult = await query(
        `SELECT 
        u.id, u.display_name, u.avatar_url, u.total_points, u.level,
        COUNT(ph.id) as activities_count
       FROM users u
       LEFT JOIN points_history ph ON u.id = ph.user_id ${timeCondition}
       WHERE u.total_points > 0
       GROUP BY u.id, u.display_name, u.avatar_url, u.total_points, u.level
       ORDER BY u.total_points DESC, activities_count DESC
       LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM users
       WHERE total_points > 0`
      );

      // Add rank to each user
      const leaderboardWithRank = leaderboardResult.rows.map(
        (user: any, index: number) => ({
          ...user,
          rank: offset + index + 1,
        })
      );

      res.json({
        success: true,
        leaderboard: leaderboardWithRank,
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

// Get squad leaderboard
router.get(
  "/squad/:id",
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
      const { page = 1, limit = 20, timeframe = "all" } = req.query as any;

      const offset = (Number(page) - 1) * Number(limit);

      // Determine time filter
      let timeCondition = "";
      switch (timeframe) {
        case "week":
          timeCondition = `AND ph.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
          break;
        case "month":
          timeCondition = `AND ph.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
          break;
        case "year":
          timeCondition = `AND ph.created_at >= CURRENT_DATE - INTERVAL '365 days'`;
          break;
        default:
          // All time - no condition needed
          break;
      }

      // Check if squad exists
      const squadResult = await query(
        `SELECT id, name, privacy FROM squads WHERE id = $1`,
        [id]
      );

      if (squadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Squad not found",
        });
      }

      // Get squad members leaderboard
      const leaderboardResult = await query(
        `SELECT 
        u.id, u.display_name, u.avatar_url,
        sm.contribution_points,
        COUNT(ph.id) as activities_count
       FROM squad_members sm
       JOIN users u ON sm.user_id = u.id
       LEFT JOIN points_history ph ON u.id = ph.user_id AND ph.squad_id = $1 ${timeCondition}
       WHERE sm.squad_id = $1
       GROUP BY u.id, u.display_name, u.avatar_url, sm.contribution_points
       ORDER BY sm.contribution_points DESC, activities_count DESC
       LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM squad_members
       WHERE squad_id = $1`,
        [id]
      );

      // Add rank to each user
      const leaderboardWithRank = leaderboardResult.rows.map(
        (user: any, index: number) => ({
          ...user,
          rank: offset + index + 1,
        })
      );

      res.json({
        success: true,
        leaderboard: leaderboardWithRank,
        squad: squadResult.rows[0],
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
