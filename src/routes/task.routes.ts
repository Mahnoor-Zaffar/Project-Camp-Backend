import { Router } from "express";
import {
  createSubtask,
  createTask,
  deleteSubtask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubtask,
  updateTask,
} from "../controllers/task.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  requireProjectRole,
  attachProjectRole,
} from "../middlewares/rbac.middleware.js";
import { uploadAttachments } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createSubtaskSchema,
  createTaskSchema,
  projectIdParamSchema,
  subtaskIdParamSchema,
  taskIdParamSchema,
  updateSubtaskSchema,
  updateTaskSchema,
} from "../validators/index.js";
import {
  AvailableUserRoles,
  UserRolesEnum,
} from "../utils/constants.js";

const router = Router();

router.use(verifyToken);

const adminRoles = [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN];

router.get(
  "/:projectId",
  validate(projectIdParamSchema, "params"),
  requireProjectRole(AvailableUserRoles),
  getTasks,
);

router.post(
  "/:projectId",
  validate(projectIdParamSchema, "params"),
  requireProjectRole(adminRoles),
  uploadAttachments,
  validate(createTaskSchema),
  createTask,
);

router.get(
  "/:projectId/t/:taskId",
  validate(taskIdParamSchema, "params"),
  requireProjectRole(AvailableUserRoles),
  getTaskById,
);

router.put(
  "/:projectId/t/:taskId",
  validate(taskIdParamSchema, "params"),
  requireProjectRole(adminRoles),
  uploadAttachments,
  validate(updateTaskSchema),
  updateTask,
);

router.delete(
  "/:projectId/t/:taskId",
  validate(taskIdParamSchema, "params"),
  requireProjectRole(adminRoles),
  deleteTask,
);

router.post(
  "/:projectId/t/:taskId/subtasks",
  validate(taskIdParamSchema, "params"),
  requireProjectRole(adminRoles),
  validate(createSubtaskSchema),
  createSubtask,
);

router.put(
  "/:projectId/st/:subTaskId",
  validate(subtaskIdParamSchema, "params"),
  attachProjectRole,
  requireProjectRole(AvailableUserRoles),
  validate(updateSubtaskSchema),
  updateSubtask,
);

router.delete(
  "/:projectId/st/:subTaskId",
  validate(subtaskIdParamSchema, "params"),
  requireProjectRole(adminRoles),
  deleteSubtask,
);

export default router;
