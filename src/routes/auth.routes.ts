import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refreshToken,
  register,
  resendEmailVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetTokenParamSchema,
  verificationTokenParamSchema,
} from "../validators/index.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get(
  "/verify-email/:verificationToken",
  validate(verificationTokenParamSchema, "params"),
  verifyEmail,
);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post(
  "/reset-password/:resetToken",
  validate(resetTokenParamSchema, "params"),
  validate(resetPasswordSchema),
  resetPassword,
);

router.post("/logout", verifyToken, logout);
router.get("/current-user", verifyToken, getCurrentUser);
router.post(
  "/change-password",
  verifyToken,
  validate(changePasswordSchema),
  changePassword,
);
router.post("/resend-email-verification", verifyToken, resendEmailVerification);

export default router;
