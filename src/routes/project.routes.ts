import { Router } from "express";
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  updateMemberRole,
  updateProject,
} from "../controllers/project.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireProjectRole } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addMemberSchema,
  createProjectSchema,
  memberIdParamSchema,
  projectIdParamSchema,
  updateMemberRoleSchema,
  updateProjectSchema,
} from "../validators/index.js";
import {
  AvailableUserRoles,
  UserRolesEnum,
} from "../utils/constants.js";

const router = Router();

router.use(verifyToken);

router.get("/", getProjects);
router.post("/", validate(createProjectSchema), createProject);

router.get(
  "/:projectId",
  validate(projectIdParamSchema, "params"),
  requireProjectRole(AvailableUserRoles),
  getProjectById,
);
router.put(
  "/:projectId",
  validate(projectIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  validate(updateProjectSchema),
  updateProject,
);
router.delete(
  "/:projectId",
  validate(projectIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  deleteProject,
);

router.get(
  "/:projectId/members",
  validate(projectIdParamSchema, "params"),
  requireProjectRole(AvailableUserRoles),
  getProjectMembers,
);
router.post(
  "/:projectId/members",
  validate(projectIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  validate(addMemberSchema),
  addProjectMember,
);
router.put(
  "/:projectId/members/:userId",
  validate(memberIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  validate(updateMemberRoleSchema),
  updateMemberRole,
);
router.delete(
  "/:projectId/members/:userId",
  validate(memberIdParamSchema, "params"),
  requireProjectRole([UserRolesEnum.ADMIN]),
  removeProjectMember,
);

export default router;
