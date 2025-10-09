import { Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt, { SignOptions } from "jsonwebtoken";
import { User as AppUser } from "../types/user";

// Extend Request interface to include user
declare module "express-serve-static-core" {
  interface Request {
    user?: AppUser;
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: AppUser) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Invalid or missing token",
        });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: AppUser) => {
      if (err) {
        return next(err);
      }

      if (user) {
        req.user = user;
      }

      next();
    }
  )(req, res, next);
};

export const generateTokens = (userId: string) => {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  const accessExpiry: string | number = process.env.JWT_EXPIRES_IN || "7d";
  const refreshExpiry: string | number =
    process.env.JWT_REFRESH_EXPIRES_IN || "30d";

  const accessToken = jwt.sign({ id: userId }, secret, {
    expiresIn: accessExpiry,
  } as SignOptions);

  const refreshToken = jwt.sign({ id: userId, type: "refresh" }, secret, {
    expiresIn: refreshExpiry,
  } as SignOptions);

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
      (err, decoded: any) => {
        if (err) {
          reject(err);
        } else if (decoded.type !== "refresh") {
          reject(new Error("Invalid token type"));
        } else {
          resolve(decoded);
        }
      }
    );
  });
};
