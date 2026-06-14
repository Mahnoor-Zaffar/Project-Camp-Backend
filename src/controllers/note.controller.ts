import type { Request, Response } from "express";
import { noteService } from "../services/note.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRouteParam } from "../utils/params.js";

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const notes = await noteService.listNotes(
    req.user!._id.toString(),
    getRouteParam(req.params.projectId),
  );
  res
    .status(200)
    .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

export const createNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await noteService.createNote(
    req.user!._id.toString(),
    getRouteParam(req.params.projectId),
    req.body.content,
  );
  res
    .status(201)
    .json(new ApiResponse(201, note, "Note created successfully"));
});

export const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  const note = await noteService.getNote(
    req.user!._id.toString(),
    getRouteParam(req.params.projectId),
    getRouteParam(req.params.noteId),
  );
  res
    .status(200)
    .json(new ApiResponse(200, note, "Note fetched successfully"));
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await noteService.updateNote(
    getRouteParam(req.params.projectId),
    getRouteParam(req.params.noteId),
    req.body.content,
  );
  res
    .status(200)
    .json(new ApiResponse(200, note, "Note updated successfully"));
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await noteService.deleteNote(
    getRouteParam(req.params.projectId),
    getRouteParam(req.params.noteId),
  );
  res
    .status(200)
    .json(new ApiResponse(200, note, "Note deleted successfully"));
});
