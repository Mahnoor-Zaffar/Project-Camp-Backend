import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface INoteDocument extends Document {
  project: Types.ObjectId;
  createdBy: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INoteDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const ProjectNote: Model<INoteDocument> = mongoose.model<INoteDocument>(
  "ProjectNote",
  noteSchema,
);
