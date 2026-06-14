import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { UnauthorizedError } from "../utils/errors.js";
import { asyncHandler } from "../utils/async-handler.js";

export const verifyToken = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedError("Unauthorized request");
    }

    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as {
        _id: string;
      };
      const user = await User.findById(decoded._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry",
      );

      if (!user) {
        throw new UnauthorizedError("Invalid access token");
      }

      req.user = user;
      next();
    } catch {
      throw new UnauthorizedError("Invalid access token");
    }
  },
);
