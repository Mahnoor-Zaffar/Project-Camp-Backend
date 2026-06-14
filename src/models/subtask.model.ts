import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ISubtaskDocument extends Document {
  title: string;
  task: Types.ObjectId;
  isCompleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    isCompleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Subtask: Model<ISubtaskDocument> = mongoose.model<ISubtaskDocument>(
  "Subtask",
  subtaskSchema,
);
