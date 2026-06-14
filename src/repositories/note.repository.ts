import mongoose from "mongoose";
import { ProjectNote } from "../models/note.model.js";

export class NoteRepository {
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
