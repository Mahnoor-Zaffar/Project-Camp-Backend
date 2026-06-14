import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ApiResponse } from "../utils/api-response.js";
import { AppError } from "../utils/errors.js";

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(404, "Route not found"));
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: string[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    errors = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = "Database validation failed";
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (env.NODE_ENV === "development" && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json(new ApiResponse(statusCode, { errors }, message));
};
