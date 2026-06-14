import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { ValidationError } from "../utils/errors.js";

type RequestSource = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, source: RequestSource = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`,
        );
        next(new ValidationError("Validation failed", messages));
        return;
      }
      next(error);
    }
  };
