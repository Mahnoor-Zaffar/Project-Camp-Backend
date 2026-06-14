const bearerAuth = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
};

const errorSchema = {
  type: "object",
  properties: {
    statusCode: { type: "integer" },
    data: {
      type: "object",
      properties: { errors: { type: "array", items: { type: "string" } } },
    },
    message: { type: "string" },
    success: { type: "boolean", example: false },
  },
};

const userSchema = {
  type: "object",
  properties: {
    _id: { type: "string" },
    username: { type: "string" },
    email: { type: "string", format: "email" },
    fullName: { type: "string" },
    isEmailVerified: { type: "boolean" },
    avatar: {
      type: "object",
      properties: {
        url: { type: "string" },
        localPath: { type: "string" },
      },
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const projectSchema = {
  type: "object",
  properties: {
    _id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    createdBy: { type: "string" },
    members: { type: "integer", description: "Total member count (in list view)" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const taskSchema = {
  type: "object",
  properties: {
    _id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    project: { type: "string" },
    assignedTo: { $ref: "#/components/schemas/User" },
    assignedBy: { type: "string" },
    status: { type: "string", enum: ["todo", "in_progress", "done"] },
    attachments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          url: { type: "string" },
          mimetype: { type: "string" },
          size: { type: "integer" },
        },
      },
    },
    createdAt: { type: "string", format: "date-time" },
  },
};

const subtaskSchema = {
  type: "object",
  properties: {
    _id: { type: "string" },
    title: { type: "string" },
    task: { type: "string" },
    isCompleted: { type: "boolean" },
    createdBy: { $ref: "#/components/schemas/User" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const noteSchema = {
  type: "object",
  properties: {
    _id: { type: "string" },
    project: { type: "string" },
    content: { type: "string" },
    createdBy: { $ref: "#/components/schemas/User" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const paginationParams = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
    description: "Page number (1-indexed)",
  },
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
    description: "Items per page (max 50)",
  },
];

const successResponse = (description: string, dataSchema: object) => ({
  200: {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 200 },
            data: dataSchema,
            message: { type: "string" },
            success: { type: "boolean", example: true },
          },
        },
      },
    },
  },
  401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  403: { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  422: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
});

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Project Camp API",
    version: "1.0.0",
    description:
      "Production-ready RESTful API for collaborative project management. Supports projects, tasks, subtasks, notes, and role-based access control.",
    contact: { name: "Project Camp" },
  },
  servers: [
    { url: "http://localhost:8000", description: "Local development" },
    { url: "https://your-production-url.com", description: "Production" },
  ],
  components: {
    securitySchemes: bearerAuth,
    schemas: {
      User: userSchema,
      Project: projectSchema,
      Task: taskSchema,
      Subtask: subtaskSchema,
      Note: noteSchema,
      Error: errorSchema,
    },
  },
  paths: {
    // ── Auth ────────────────────────────────────────────────────────────────
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "username", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  username: { type: "string", minLength: 3 },
                  password: { type: "string", minLength: 6 },
                  fullName: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered. Verification email sent." },
          409: { description: "Email or username already taken" },
          422: { description: "Validation error" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful — tokens in cookies and body" },
          400: { description: "Invalid credentials" },
          422: { description: "Validation error" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (clears tokens)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Logged out" }, 401: { description: "Unauthorized" } },
      },
    },
    "/api/v1/auth/current-user": {
      get: {
        tags: ["Auth"],
        summary: "Get logged-in user profile",
        security: [{ bearerAuth: [] }],
        responses: successResponse("Current user", { $ref: "#/components/schemas/User" }),
      },
    },
    "/api/v1/auth/avatar": {
      patch: {
        tags: ["Auth"],
        summary: "Upload or update profile avatar",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["avatar"],
                properties: {
                  avatar: { type: "string", format: "binary", description: "Image file (JPEG, PNG, GIF, WebP — max 1 MB)" },
                },
              },
            },
          },
        },
        responses: successResponse("Avatar updated", { $ref: "#/components/schemas/User" }),
      },
    },
    "/api/v1/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { refreshToken: { type: "string" } } },
            },
          },
        },
        responses: { 200: { description: "New tokens issued" }, 401: { description: "Invalid or expired refresh token" } },
      },
    },
    "/api/v1/auth/verify-email/{verificationToken}": {
      get: {
        tags: ["Auth"],
        summary: "Verify email address",
        parameters: [{ name: "verificationToken", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Email verified" }, 400: { description: "Invalid or expired token" } },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset email",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } },
        },
        responses: { 200: { description: "Reset email sent" }, 404: { description: "User not found" } },
      },
    },
    "/api/v1/auth/reset-password/{resetToken}": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        parameters: [{ name: "resetToken", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["newPassword"], properties: { newPassword: { type: "string", minLength: 6 } } } } },
        },
        responses: { 200: { description: "Password reset" }, 400: { description: "Invalid or expired token" } },
      },
    },
    "/api/v1/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change current password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["oldPassword", "newPassword"],
                properties: { oldPassword: { type: "string" }, newPassword: { type: "string", minLength: 6 } },
              },
            },
          },
        },
        responses: { 200: { description: "Password changed" }, 400: { description: "Old password incorrect" } },
      },
    },
    "/api/v1/auth/resend-email-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend verification email",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Email sent" }, 409: { description: "Already verified" } },
      },
    },

    // ── Projects ─────────────────────────────────────────────────────────────
    "/api/v1/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects the user belongs to",
        security: [{ bearerAuth: [] }],
        parameters: paginationParams,
        responses: successResponse("Projects list", {
          type: "object",
          properties: {
            projects: { type: "array", items: { $ref: "#/components/schemas/Project" } },
            total: { type: "integer" },
            page: { type: "integer" },
            totalPages: { type: "integer" },
          },
        }),
      },
      post: {
        tags: ["Projects"],
        summary: "Create a new project",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string" } } },
            },
          },
        },
        responses: { 201: { description: "Project created" }, 422: { description: "Validation error" } },
      },
    },
    "/api/v1/projects/{projectId}": {
      get: {
        tags: ["Projects"],
        summary: "Get project details",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        responses: successResponse("Project details", { $ref: "#/components/schemas/Project" }),
      },
      put: {
        tags: ["Projects"],
        summary: "Update project (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } } } } },
        },
        responses: successResponse("Updated project", { $ref: "#/components/schemas/Project" }),
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project (Admin only, cascades all data)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Project deleted" }, 403: { description: "Forbidden" } },
      },
    },
    "/api/v1/projects/{projectId}/members": {
      get: {
        tags: ["Members"],
        summary: "List project members",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Members list" } },
      },
      post: {
        tags: ["Members"],
        summary: "Add a member by email (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "role"],
                properties: {
                  email: { type: "string", format: "email" },
                  role: { type: "string", enum: ["admin", "project_admin", "member"] },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Member added" }, 404: { description: "User not found" } },
      },
    },
    "/api/v1/projects/{projectId}/members/{userId}": {
      put: {
        tags: ["Members"],
        summary: "Update member role (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["newRole"], properties: { newRole: { type: "string", enum: ["admin", "project_admin", "member"] } } },
            },
          },
        },
        responses: { 200: { description: "Role updated" } },
      },
      delete: {
        tags: ["Members"],
        summary: "Remove a member (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Member removed" } },
      },
    },

    // ── Tasks ─────────────────────────────────────────────────────────────────
    "/api/v1/tasks/{projectId}": {
      get: {
        tags: ["Tasks"],
        summary: "List tasks in a project",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["todo", "in_progress", "done"] }, description: "Filter by status" },
          { name: "assignedTo", in: "query", schema: { type: "string" }, description: "Filter by assignee user ID" },
          ...paginationParams,
        ],
        responses: successResponse("Tasks list", {
          type: "object",
          properties: {
            tasks: { type: "array", items: { $ref: "#/components/schemas/Task" } },
            total: { type: "integer" },
            page: { type: "integer" },
            totalPages: { type: "integer" },
          },
        }),
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a task (Admin / Project Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  assignedTo: { type: "string", description: "User ID of assignee" },
                  status: { type: "string", enum: ["todo", "in_progress", "done"] },
                  attachments: { type: "array", items: { type: "string", format: "binary" }, description: "Up to 5 files, max 1 MB each" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Task created" } },
      },
    },
    "/api/v1/tasks/{projectId}/t/{taskId}": {
      get: {
        tags: ["Tasks"],
        summary: "Get task details with subtasks",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: successResponse("Task with subtasks", { $ref: "#/components/schemas/Task" }),
      },
      put: {
        tags: ["Tasks"],
        summary: "Update a task (Admin / Project Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  assignedTo: { type: "string" },
                  status: { type: "string", enum: ["todo", "in_progress", "done"] },
                  attachments: { type: "array", items: { type: "string", format: "binary" } },
                },
              },
            },
          },
        },
        responses: successResponse("Updated task", { $ref: "#/components/schemas/Task" }),
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete a task and all its subtasks (Admin / Project Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Task deleted" } },
      },
    },
    "/api/v1/tasks/{projectId}/t/{taskId}/subtasks": {
      post: {
        tags: ["Subtasks"],
        summary: "Create a subtask (Admin / Project Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["title"], properties: { title: { type: "string" } } } } },
        },
        responses: { 201: { description: "Subtask created" } },
      },
    },
    "/api/v1/tasks/{projectId}/st/{subTaskId}": {
      put: {
        tags: ["Subtasks"],
        summary: "Update subtask — Members can only toggle isCompleted",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "subTaskId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { title: { type: "string" }, isCompleted: { type: "boolean" } } },
            },
          },
        },
        responses: successResponse("Updated subtask", { $ref: "#/components/schemas/Subtask" }),
      },
      delete: {
        tags: ["Subtasks"],
        summary: "Delete a subtask (Admin / Project Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "subTaskId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Subtask deleted" } },
      },
    },

    // ── Notes ─────────────────────────────────────────────────────────────────
    "/api/v1/notes/{projectId}": {
      get: {
        tags: ["Notes"],
        summary: "List notes in a project",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          ...paginationParams,
        ],
        responses: successResponse("Notes list", {
          type: "object",
          properties: {
            notes: { type: "array", items: { $ref: "#/components/schemas/Note" } },
            total: { type: "integer" },
            page: { type: "integer" },
            totalPages: { type: "integer" },
          },
        }),
      },
      post: {
        tags: ["Notes"],
        summary: "Create a note (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["content"], properties: { content: { type: "string" } } } } },
        },
        responses: { 201: { description: "Note created" } },
      },
    },
    "/api/v1/notes/{projectId}/n/{noteId}": {
      get: {
        tags: ["Notes"],
        summary: "Get a single note",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "noteId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: successResponse("Note", { $ref: "#/components/schemas/Note" }),
      },
      put: {
        tags: ["Notes"],
        summary: "Update a note (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "noteId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { content: { type: "string" } } } } },
        },
        responses: successResponse("Updated note", { $ref: "#/components/schemas/Note" }),
      },
      delete: {
        tags: ["Notes"],
        summary: "Delete a note (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "noteId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Note deleted" } },
      },
    },

    // ── Health ────────────────────────────────────────────────────────────────
    "/api/v1/healthcheck": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: { 200: { description: "Server is running" } },
      },
    },
  },
};
