import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IProjectDocument extends Document {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Project: Model<IProjectDocument> = mongoose.model<IProjectDocument>(
  "Project",
  projectSchema,
);
