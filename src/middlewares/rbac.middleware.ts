import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ProjectMember } from "../models/project-member.model.js";
import type { UserRole } from "../utils/constants.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRouteParam } from "../utils/params.js";

export const requireProjectRole =
  (allowedRoles: UserRole[]) =>
  asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
      const { projectId } = req.params;

      if (!projectId) {
        throw new BadRequestError("Project id is missing");
      }

      if (!req.user) {
        throw new ForbiddenError();
      }

      const membership = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(getRouteParam(projectId)),
        user: req.user._id,
      });

      if (!membership) {
        throw new NotFoundError("Project not found or access denied");
      }

      req.projectRole = membership.role;

      if (!allowedRoles.includes(membership.role)) {
        throw new ForbiddenError(
          "You do not have permission to perform this action",
        );
      }

      next();
    },
  );

export const attachProjectRole = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    if (!projectId || !req.user) {
      return next();
    }

    const membership = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(getRouteParam(projectId)),
      user: req.user._id,
    });

    if (membership) {
      req.projectRole = membership.role;
    }

    next();
  },
);
