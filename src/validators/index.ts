import { z } from "zod";
import {
  AvailableTaskStatuses,
  AvailableUserRoles,
} from "../utils/constants.js";

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
  fullName: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().trim().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addMemberSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(AvailableUserRoles as [string, ...string[]], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

export const updateMemberRoleSchema = z.object({
  newRole: z.enum(AvailableUserRoles as [string, ...string[]], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().trim().optional(),
  assignedTo: z.string().optional(),
  status: z
    .enum(AvailableTaskStatuses as [string, ...string[]])
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  assignedTo: z.string().optional(),
  status: z
    .enum(AvailableTaskStatuses as [string, ...string[]])
    .optional(),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).trim().optional(),
  isCompleted: z.boolean().optional(),
});

export const createNoteSchema = z.object({
  content: z.string().min(1, "Content is required").trim(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const taskQuerySchema = paginationSchema.extend({
  status: z
    .enum(AvailableTaskStatuses as [string, ...string[]])
    .optional(),
  assignedTo: z.string().optional(),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});

export const taskIdParamSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
});

export const subtaskIdParamSchema = z.object({
  projectId: z.string().min(1),
  subTaskId: z.string().min(1),
});

export const noteIdParamSchema = z.object({
  projectId: z.string().min(1),
  noteId: z.string().min(1),
});

export const memberIdParamSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
});

export const verificationTokenParamSchema = z.object({
  verificationToken: z.string().min(1),
});

export const resetTokenParamSchema = z.object({
  resetToken: z.string().min(1),
});
