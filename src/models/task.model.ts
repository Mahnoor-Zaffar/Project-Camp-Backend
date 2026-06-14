import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import {
  AvailableTaskStatuses,
  TaskStatusEnum,
  type TaskStatus,
} from "../utils/constants.js";

export interface ITaskAttachment {
  url: string;
  mimetype: string;
  size: number;
}

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  project: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedBy?: Types.ObjectId;
  status: TaskStatus;
  attachments: ITaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: AvailableTaskStatuses,
      default: TaskStatusEnum.TODO,
    },
    attachments: {
      type: [
        {
          url: String,
          mimetype: String,
          size: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Task: Model<ITaskDocument> = mongoose.model<ITaskDocument>(
  "Task",
  taskSchema,
);
