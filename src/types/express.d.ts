import type { HydratedDocument, Types } from "mongoose";
import type { UserRole } from "../utils/constants.js";

export interface IUser {
  avatar: { url: string; localPath: string };
  username: string;
  email: string;
  fullName?: string;
  password: string;
  isEmailVerified: boolean;
  refreshToken?: string;
  forgotPasswordToken?: string;
  forgotPasswordExpiry?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateTemporaryToken(): {
    unHashedToken: string;
    hashedToken: string;
    tokenExpiry: number;
  };
}

export type IUserDocument = HydratedDocument<IUser, IUserMethods>;

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      projectRole?: UserRole;
    }
  }
}

export type AuthenticatedRequest = Request & {
  user: IUserDocument;
};

export type ProjectScopedRequest = AuthenticatedRequest & {
  projectRole: UserRole;
};

export type ObjectIdLike = Types.ObjectId | string;
