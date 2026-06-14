import type { Request, Response } from "express";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const healthCheck = asyncHandler(
  async (_req: Request, res: Response) => {
    res
      .status(200)
      .json(new ApiResponse(200, { status: "ok" }, "Server is running"));
  },
);
