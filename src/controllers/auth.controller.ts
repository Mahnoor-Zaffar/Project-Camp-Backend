import { getRouteParam } from "../utils/params.js";
import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { env } from "../config/env.js";
import { BadRequestError } from "../utils/errors.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const verificationBaseUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email`;
  const user = await authService.register({ ...req.body, verificationBaseUrl });
  res.status(201).json(new ApiResponse(201, { user }, "User registered successfully. Verification email sent."));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { user, accessToken, refreshToken }, "User logged in successfully"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!._id.toString());
  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    throw new BadRequestError("Avatar file is required");
  }
  const user = await authService.updateAvatar(req.user!._id.toString(), file, env.SERVER_URL);
  res.status(200).json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const verificationToken = getRouteParam(req.params.verificationToken);
  const result = await authService.verifyEmail(verificationToken);
  res.status(200).json(new ApiResponse(200, result, "Email verified successfully"));
});

export const resendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const verificationBaseUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email`;
  await authService.resendEmailVerification(req.user!._id.toString(), verificationBaseUrl);
  res.status(200).json(new ApiResponse(200, {}, "Verification email sent"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;
  const tokens = await authService.refreshAccessToken(incomingRefreshToken);
  res
    .status(200)
    .cookie("accessToken", tokens.accessToken, cookieOptions)
    .cookie("refreshToken", tokens.refreshToken, cookieOptions)
    .json(new ApiResponse(200, tokens, "Access token refreshed successfully"));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json(new ApiResponse(200, {}, "Password reset email sent"));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(getRouteParam(req.params.resetToken), req.body.newPassword);
  res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!._id.toString(), req.body.oldPassword, req.body.newPassword);
  res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});
