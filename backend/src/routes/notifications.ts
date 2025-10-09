import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { query } from "../config/database";
import { param, body } from "express-validator";
import { validationResult } from "express-validator";
import { emitNewNotification } from "../services/socketService";

const router = Router();

// Validation rules
const notificationIdValidation = [
  param("id").isUUID().withMessage("Invalid notification ID"),
];

const markBulkReadValidation = [
  body("notificationIds")
    .isArray()
    .withMessage("Notification IDs must be an array"),
];

// Get user notifications
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, read } = req.query as any;
      const userId = req.user!.id;

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions = ["n.user_id = $1"];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      // Read status filter
      if (read !== undefined) {
        whereConditions.push(`n.read = $${paramIndex}`);
        queryParams.push(read === "true");
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get notifications
      const notificationsResult = await query(
        `SELECT 
        n.*,
        CASE 
          WHEN n.data IS NOT NULL THEN n.data::jsonb 
          ELSE '{}'::jsonb 
        END as data
       FROM notifications n
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total
       FROM notifications n
       ${whereClause}`,
        queryParams
      );

      res.json({
        success: true,
        notifications: notificationsResult.rows,
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

// Get unread notification count
router.get(
  "/unread-count",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const countResult = await query(
        `SELECT COUNT(*) as unread_count
       FROM notifications
       WHERE user_id = $1 AND read = false`,
        [userId]
      );

      res.json({
        success: true,
        unread_count: parseInt(countResult.rows[0].unread_count),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark notification as read
router.put(
  "/:id/read",
  authenticate,
  notificationIdValidation,
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

      // Update notification
      const result = await query(
        `UPDATE notifications 
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Notification not found",
        });
      }

      res.json({
        success: true,
        notification: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark multiple notifications as read
router.put(
  "/read-bulk",
  authenticate,
  markBulkReadValidation,
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

      const { notificationIds } = req.body;
      const userId = req.user!.id;

      // Update notifications
      const result = await query(
        `UPDATE notifications 
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND user_id = $2
       RETURNING *`,
        [notificationIds, userId]
      );

      res.json({
        success: true,
        updated_count: result.rowCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark all notifications as read
router.put(
  "/read-all",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Update all unread notifications
      const result = await query(
        `UPDATE notifications 
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND read = false`,
        [userId]
      );

      res.json({
        success: true,
        updated_count: result.rowCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete notification
router.delete(
  "/:id",
  authenticate,
  notificationIdValidation,
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

      // Delete notification
      const result = await query(
        `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Notification not found",
        });
      }

      res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a notification (internal use)
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  data?: any,
  actionUrl?: string
): Promise<void> => {
  try {
    // Insert notification into database
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, data, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        title,
        message,
        type,
        data ? JSON.stringify(data) : null,
        actionUrl,
      ]
    );

    const notification = result.rows[0];

    // Emit real-time notification if user is online
    // Note: This would require access to the io instance, which is handled in the server
    console.log(`Notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export default router;
