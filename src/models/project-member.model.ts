import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import {
  AvailableUserRoles,
  UserRolesEnum,
  type UserRole,
} from "../utils/constants.js";

export interface IProjectMemberDocument extends Document {
  user: Types.ObjectId;
  project: Types.ObjectId;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMemberDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.MEMBER,
    },
  },
  { timestamps: true },
);

projectMemberSchema.index({ user: 1, project: 1 }, { unique: true });

export const ProjectMember: Model<IProjectMemberDocument> =
  mongoose.model<IProjectMemberDocument>("ProjectMember", projectMemberSchema);
