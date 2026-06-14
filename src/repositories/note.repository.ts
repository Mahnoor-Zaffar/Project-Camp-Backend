import mongoose from "mongoose";
import { ProjectNote } from "../models/note.model.js";

export class NoteRepository {
  async findByProjectPaginated(projectId: string, page: number, limit: number) {
    const query = { project: new mongoose.Types.ObjectId(projectId) };
    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      ProjectNote.find(query)
        .populate("createdBy", "avatar username fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProjectNote.countDocuments(query),
    ]);
    return { notes, total, page, totalPages: Math.ceil(total / limit) };
  }

  findByProject(projectId: string) {
    return ProjectNote.find({
      project: new mongoose.Types.ObjectId(projectId),
    })
      .populate("createdBy", "avatar username fullName email")
      .sort({ createdAt: -1 });
  }

  findById(noteId: string) {
    return ProjectNote.findById(noteId).populate(
      "createdBy",
      "avatar username fullName email",
    );
  }

  create(data: { projectId: string; createdBy: string; content: string }) {
    return ProjectNote.create({
      project: new mongoose.Types.ObjectId(data.projectId),
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
      content: data.content,
    });
  }

  update(noteId: string, content: string) {
    return ProjectNote.findByIdAndUpdate(
      noteId,
      { content },
      { new: true },
    ).populate("createdBy", "avatar username fullName email");
  }

  delete(noteId: string) {
    return ProjectNote.findByIdAndDelete(noteId);
  }
}

export const noteRepository = new NoteRepository();
