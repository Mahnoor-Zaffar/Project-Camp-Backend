export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
} as const;

export type UserRole = (typeof UserRolesEnum)[keyof typeof UserRolesEnum];

export const AvailableUserRoles: UserRole[] = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

export type TaskStatus = (typeof TaskStatusEnum)[keyof typeof TaskStatusEnum];

export const AvailableTaskStatuses: TaskStatus[] =
  Object.values(TaskStatusEnum);

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
] as const;

export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;
