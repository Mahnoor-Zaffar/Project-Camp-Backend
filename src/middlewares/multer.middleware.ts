import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "../utils/constants.js";
import { BadRequestError, ValidationError } from "../utils/errors.js";
import { AppError } from "../utils/errors.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "./public/images");
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (
    ALLOWED_MIME_TYPES.includes(
      file.mimetype as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type ${file.mimetype} is not allowed`));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

const handleUploadError = (
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(
        new ValidationError(
          `File size exceeds limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
        ),
      );
      return;
    }
    next(new BadRequestError(err.message));
    return;
  }

  if (err instanceof AppError) {
    next(err);
    return;
  }

  next(err);
};

export const uploadAttachments = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload.array("attachments", 5)(req, res, (err) => {
    if (err) {
      handleUploadError(err, req, res, next);
      return;
    }
    next();
  });
};

export const getAttachmentUrl = (filename: string): string => {
  return `${process.env.SERVER_URL ?? "http://localhost:8000"}/images/${path.basename(filename)}`;
};
