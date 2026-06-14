import crypto from "crypto";
import type { IUserDocument } from "../types/express.js";
import { User, sanitizeUser } from "../models/user.model.js";

export class UserRepository {
  findByEmailOrUsername(email: string, username: string) {
    return User.findOne({ $or: [{ email }, { username }] });
  }

  findByEmail(email: string) {
    return User.findOne({ email });
  }

  findById(id: string) {
    return User.findById(id);
  }

  findByIdSafe(id: string) {
    return User.findById(id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry",
    );
  }

  create(data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }) {
    return User.create(data);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    return User.findByIdAndUpdate(
      userId,
      { refreshToken },
      { new: true },
    );
  }

  clearRefreshToken(userId: string) {
    return User.findByIdAndUpdate(userId, { refreshToken: "" });
  }

  findByEmailVerificationToken(unHashedToken: string) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(unHashedToken)
      .digest("hex");
    return User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });
  }

  findByForgotPasswordToken(unHashedToken: string) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(unHashedToken)
      .digest("hex");
    return User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });
  }

  async saveUser(user: IUserDocument) {
    await user.save({ validateBeforeSave: false });
    return sanitizeUser(user);
  }
}

export const userRepository = new UserRepository();
