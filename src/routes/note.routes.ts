import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireProjectRole } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createNoteSchema,
  noteIdParamSchema,
  projectIdParamSchema,
  updateNoteSchema,
} from "../validators/index.js";
import {
  AvailableUserRoles,
  UserRolesEnum,
} from "../utils/constants.js";

const router = Router();

router.use(verifyToken);

router.get(
  "/:projectId",
  validate(projectIdParamSchema, "params"),
  requireProjectRole(AvailableUserRoles),
  getNotes,
);

router.post(
  "/:projectId",
  validate(projectIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  validate(createNoteSchema),
  createNote,
);

router.get(
  "/:projectId/n/:noteId",
  validate(noteIdParamSchema, "params"),
  requireProjectRole(AvailableUserRoles),
  getNoteById,
);

router.put(
  "/:projectId/n/:noteId",
  validate(noteIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  validate(updateNoteSchema),
  updateNote,
);

router.delete(
  "/:projectId/n/:noteId",
  validate(noteIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  deleteNote,
);

export default router;
