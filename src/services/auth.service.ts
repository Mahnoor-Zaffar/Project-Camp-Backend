import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";
export class AuthService {
  private async generateAccessAndRefreshTokens(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  }

  async register(input: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
    verificationBaseUrl: string;
  }) {
    const existing = await userRepository.findByEmailOrUsername(
      input.email,
      input.username,
    );
    if (existing) {
      throw new ConflictError("User with email or username already exists");
    }

    const user = await userRepository.create(input);
    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        user.username,
        `${input.verificationBaseUrl}/${unHashedToken}`,
      ),
    });

    const createdUser = await userRepository.findByIdSafe(user._id.toString());
    if (!createdUser) {
      throw new AppError(500, "Something went wrong while registering user");
    }

    return createdUser;
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestError("Invalid credentials");
    }

    const isValid = await user.isPasswordCorrect(password);
    if (!isValid) {
      throw new BadRequestError("Invalid credentials");
    }

    const tokens = await this.generateAccessAndRefreshTokens(
      user._id.toString(),
    );
    const loggedInUser = await userRepository.findByIdSafe(
      user._id.toString(),
    );

    return { user: loggedInUser, ...tokens };
  }

  async logout(userId: string) {
    await userRepository.clearRefreshToken(userId);
  }

  async verifyEmail(verificationToken: string) {
    const user =
      await userRepository.findByEmailVerificationToken(verificationToken);
    if (!user) {
      throw new BadRequestError("Token is invalid or expired");
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return { isEmailVerified: true };
  }

  async resendEmailVerification(userId: string, verificationBaseUrl: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }
    if (user.isEmailVerified) {
      throw new ConflictError("Email is already verified");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        user.username,
        `${verificationBaseUrl}/${unHashedToken}`,
      ),
    });
  }

  async refreshAccessToken(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new UnauthorizedError("Unauthorized access");
    }

    try {
      const decoded = jwt.verify(
        incomingRefreshToken,
        env.REFRESH_TOKEN_SECRET,
      ) as { _id: string };

      const user = await userRepository.findById(decoded._id);
      if (!user || incomingRefreshToken !== user.refreshToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      return this.generateAccessAndRefreshTokens(user._id.toString());
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    const resetUrl = env.FORGOT_PASSWORD_REDIRECT_URL
      ? `${env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
      : `${env.SERVER_URL}/api/v1/auth/reset-password/${unHashedToken}`;

    await sendEmail({
      email: user.email,
      subject: "Password reset request",
      mailgenContent: forgotPasswordMailgenContent(user.username, resetUrl),
    });
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const user = await userRepository.findByForgotPasswordToken(resetToken);
    if (!user) {
      throw new BadRequestError("Token is invalid or expired");
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isValid = await user.isPasswordCorrect(oldPassword);
    if (!isValid) {
      throw new BadRequestError("Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  }

  getCurrentUser(userId: string) {
    return userRepository.findByIdSafe(userId);
  }
}

export const authService = new AuthService();
