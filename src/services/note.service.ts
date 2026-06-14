import { noteRepository } from "../repositories/note.repository.js";
import { projectRepository } from "../repositories/project.repository.js";
import { NotFoundError } from "../utils/errors.js";

export class NoteService {
  async listNotes(userId: string, projectId: string) {
    const membership = await projectRepository.findMembership(userId, projectId);
    if (!membership) {
      throw new NotFoundError("Project not found or access denied");
    }
    return noteRepository.findByProject(projectId);
  }

  async getNote(userId: string, projectId: string, noteId: string) {
    await projectRepository.findMembership(userId, projectId);
    const note = await noteRepository.findById(noteId);
    if (!note || note.project.toString() !== projectId) {
      throw new NotFoundError("Note not found");
    }
    return note;
  }

  async createNote(userId: string, projectId: string, content: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return noteRepository.create({ projectId, createdBy: userId, content });
  }

  async updateNote(projectId: string, noteId: string, content: string) {
    const note = await noteRepository.findById(noteId);
    if (!note || note.project.toString() !== projectId) {
      throw new NotFoundError("Note not found");
    }
    const updated = await noteRepository.update(noteId, content);
    if (!updated) {
      throw new NotFoundError("Note not found");
    }
    return updated;
  }

  async deleteNote(projectId: string, noteId: string) {
    const note = await noteRepository.findById(noteId);
    if (!note || note.project.toString() !== projectId) {
      throw new NotFoundError("Note not found");
    }
    const deleted = await noteRepository.delete(noteId);
    if (!deleted) {
      throw new NotFoundError("Note not found");
    }
    return deleted;
  }
}

export const noteService = new NoteService();
