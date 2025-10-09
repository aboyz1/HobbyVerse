import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import {
  authenticate,
  generateTokens,
  verifyRefreshToken,
} from "../middleware/auth";
import { query } from "../config/database";
import {
  User as AppUser,
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
} from "../types/user";
import { body, validationResult } from "express-validator";

const router = Router();

// Validation rules
const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("display_name")
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be 2-50 characters"),
  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Register new user
router.post(
  "/register",
  registerValidation,
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

      const { email, password, display_name, bio, skills }: CreateUserRequest =
        req.body;

      // Check if user already exists
      const existingUser = await query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: "User with this email already exists",
        });
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, display_name, bio, skills, email_verified) 
       VALUES ($1, $2, $3, $4, $5, false) 
       RETURNING id, email, display_name, avatar_url, bio, skills, total_points, level, created_at`,
        [email, password_hash, display_name, bio || null, skills || []]
      );

      const user = result.rows[0];

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Store refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        [
          user.id,
          refreshTokenHash,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ] // 30 days
      );

      // Award "First Post" badge (if it exists)
      try {
        await query(
          `INSERT INTO user_badges (user_id, badge_id) 
         SELECT $1, id FROM badges WHERE name = 'Early Adopter' 
         ON CONFLICT (user_id, badge_id) DO NOTHING`,
          [user.id]
        );
      } catch (error) {
        console.log("Badge assignment failed (non-critical):", error);
      }

      const response: AuthResponse = {
        success: true,
        user,
        accessToken,
        refreshToken,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Login user
router.post(
  "/login",
  loginValidation,
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

      passport.authenticate(
        "local",
        async (err: any, user: AppUser | false, info: any) => {
          if (err) {
            return next(err);
          }

          if (!user) {
            return res.status(401).json({
              success: false,
              error: info?.message || "Invalid credentials",
            });
          }

          // Update last active timestamp
          await query(
            "UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1",
            [user.id]
          );

          // Generate tokens
          const { accessToken, refreshToken } = generateTokens(user.id);

          // Store refresh token
          const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
          await query(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
            [
              user.id,
              refreshTokenHash,
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            ]
          );

          const response: AuthResponse = {
            success: true,
            user,
            accessToken,
            refreshToken,
          };

          res.json(response);
        }
      )(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);

    // Check if refresh token exists and is valid
    const storedTokens = await query(
      "SELECT token_hash FROM refresh_tokens WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP",
      [decoded.id]
    );

    let validToken = false;
    for (const tokenRow of storedTokens.rows) {
      if (await bcrypt.compare(refreshToken, tokenRow.token_hash)) {
        validToken = true;
        break;
      }
    }

    if (!validToken) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    // Get user data
    const userResult = await query(
      "SELECT id, email, display_name, avatar_url, bio, skills, total_points, level, created_at FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id
    );

    // Store new refresh token
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [
        user.id,
        newRefreshTokenHash,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ]
    );

    // Clean up old refresh tokens for this user
    await query(
      "DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < CURRENT_TIMESTAMP",
      [user.id]
    );

    const response: AuthResponse = {
      success: true,
      user,
      accessToken,
      refreshToken: newRefreshToken,
    };

    res.json(response);
  } catch (error: any) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }
    next(error);
  }
});

// Logout
router.post(
  "/logout",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const userId = req.user!.id;

      if (refreshToken) {
        // Remove specific refresh token
        const storedTokens = await query(
          "SELECT id, token_hash FROM refresh_tokens WHERE user_id = $1",
          [userId]
        );

        for (const tokenRow of storedTokens.rows) {
          if (await bcrypt.compare(refreshToken, tokenRow.token_hash)) {
            await query("DELETE FROM refresh_tokens WHERE id = $1", [
              tokenRow.id,
            ]);
            break;
          }
        }
      } else {
        // Remove all refresh tokens for user (logout from all devices)
        await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
      }

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AppUser;

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Store refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        [
          user.id,
          refreshTokenHash,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ]
      );

      // Redirect to frontend with tokens (in production, use secure method)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:19006";
      res.redirect(
        `${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Get user with stats
      const userResult = await query(
        `SELECT 
        u.*,
        COUNT(DISTINCT sm.squad_id) as squads_joined,
        COUNT(DISTINCT p.id) as projects_created,
        COUNT(DISTINCT ub.badge_id) as badges_earned,
        COUNT(DISTINCT cs.id) as challenges_completed
       FROM users u
       LEFT JOIN squad_members sm ON u.id = sm.user_id
       LEFT JOIN projects p ON u.id = p.created_by
       LEFT JOIN user_badges ub ON u.id = ub.user_id
       LEFT JOIN challenge_submissions cs ON u.id = cs.user_id AND cs.status = 'approved'
       WHERE u.id = $1
       GROUP BY u.id`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const user = userResult.rows[0];
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify email (placeholder for email verification)
router.post(
  "/verify-email",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      // In a real implementation, you would verify the email token
      // For now, we'll just return success
      res.json({
        success: true,
        message: "Email verification not implemented yet",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Forgot password (placeholder)
router.post(
  "/forgot-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      // In a real implementation, you would send a password reset email
      res.json({
        success: true,
        message: "Password reset not implemented yet",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
