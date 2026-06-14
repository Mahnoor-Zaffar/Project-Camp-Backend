import mongoose, { Schema, type Model } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";
import type { IUser, IUserDocument, IUserMethods } from "../types/express.js";

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    avatar: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: "https://placehold.co/200x200",
        localPath: "",
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: String,
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const tokenOptions = (expiresIn: string): SignOptions => ({
  expiresIn: expiresIn as SignOptions["expiresIn"],
});

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username },
    env.ACCESS_TOKEN_SECRET,
    tokenOptions(env.ACCESS_TOKEN_EXPIRY),
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign({ _id: this._id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
  } as SignOptions);
};

userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  const tokenExpiry = Date.now() + 20 * 60 * 1000;
  return { unHashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model<IUser, UserModel>("User", userSchema);

export const sanitizeUser = (user: IUserDocument) => {
  const obj = user.toObject() as unknown as Record<string, unknown>;
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpiry;
  delete obj.forgotPasswordToken;
  delete obj.forgotPasswordExpiry;
  return obj;
};
