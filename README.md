# Project Camp — Backend API

A production-ready RESTful API for collaborative project management. Teams can organise projects, assign tasks with subtasks, keep project notes, and control access through a three-tier role system — all secured with JWT authentication.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Features](#features)
- [Permission Matrix](#permission-matrix)
- [Getting Started](#getting-started)
  - [Option A — Local (Node.js)](#option-a--local-nodejs)
  - [Option B — Docker](#option-b--docker)
- [Running Tests](#running-tests)
- [API Docs (Swagger)](#api-docs-swagger)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Auth](#auth-routes)
  - [Projects](#project-routes)
  - [Tasks & Subtasks](#task-routes)
  - [Notes](#note-routes)
  - [Health Check](#health-check)
- [Request & Response Examples](#request--response-examples)
- [Error Handling](#error-handling)
- [Security](#security)
- [CI / CD](#ci--cd)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | MongoDB via Mongoose |
| Validation | Zod |
| Authentication | JWT (access + refresh tokens) + bcrypt |
| File Uploads | Multer (disk storage, MIME validation) |
| Email | Nodemailer + Mailgen (Mailtrap for dev) |
| Logging | Pino + pino-http (pretty in dev, JSON in prod) |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Security | Helmet · CORS · express-rate-limit |
| Testing | Vitest + Supertest + mongodb-memory-server |
| Containers | Docker + docker-compose |

---

## Architecture

The codebase follows a strict **Controller → Service → Repository** pattern so that HTTP concerns, business logic, and database queries are completely separated.

```
HTTP Request
     │
     ▼
  Router          (src/routes/)       — mounts middleware chain + handler
     │
     ▼
Middleware        (src/middlewares/)  — auth · RBAC · validation · multer · pino-http
     │
     ▼
Controller        (src/controllers/) — reads req, calls service, writes res
     │
     ▼
Service           (src/services/)    — business rules, orchestration
     │
     ▼
Repository        (src/repositories/)— all Mongoose queries
     │
     ▼
Model             (src/models/)      — Mongoose schemas & methods
```

---

## Folder Structure

```
src/
├── config/
│   ├── db.ts              MongoDB connection
│   ├── env.ts             Zod-validated env vars (fails fast on bad config)
│   └── swagger.ts         Full OpenAPI 3.0 spec object
│
├── models/
│   ├── user.model.ts
│   ├── project.model.ts
│   ├── project-member.model.ts
│   ├── task.model.ts
│   ├── subtask.model.ts
│   └── note.model.ts
│
├── repositories/
│   ├── user.repository.ts
│   ├── project.repository.ts
│   ├── task.repository.ts
│   └── note.repository.ts
│
├── services/
│   ├── auth.service.ts
│   ├── project.service.ts
│   ├── task.service.ts
│   └── note.service.ts
│
├── controllers/
│   ├── auth.controller.ts
│   ├── project.controller.ts
│   ├── task.controller.ts
│   ├── note.controller.ts
│   └── healthcheck.controller.ts
│
├── routes/
│   ├── auth.routes.ts
│   ├── project.routes.ts
│   ├── task.routes.ts
│   ├── note.routes.ts
│   └── healthcheck.routes.ts
│
├── middlewares/
│   ├── auth.middleware.ts      verifyToken — JWT extraction & validation
│   ├── rbac.middleware.ts      requireProjectRole — project-scoped RBAC
│   ├── validate.middleware.ts  Zod request validation
│   ├── multer.middleware.ts    File upload handling with MIME checks
│   └── error.middleware.ts     Global error handler + 404 handler
│
├── validators/
│   └── index.ts               All Zod schemas (auth, project, task, note, params)
│
├── utils/
│   ├── errors.ts              AppError · NotFoundError · UnauthorizedError etc.
│   ├── api-response.ts        Standard ApiResponse wrapper
│   ├── async-handler.ts       Async route handler wrapper
│   ├── constants.ts           UserRolesEnum · TaskStatusEnum · allowed MIME types
│   ├── logger.ts              Pino logger instance (pretty dev / JSON prod)
│   ├── mail.ts                sendEmail · email template generators
│   └── params.ts              getRouteParam helper
│
├── types/
│   └── express.d.ts           Express Request augmented with user & projectRole
│
├── __tests__/
│   ├── setup.ts               mongodb-memory-server lifecycle (beforeAll / afterAll)
│   ├── unit/services/
│   │   ├── auth.service.test.ts
│   │   ├── project.service.test.ts
│   │   └── task.service.test.ts
│   └── integration/
│       ├── auth.test.ts
│       └── projects.test.ts
│
├── app.ts                     Express app setup (helmet, cors, rate-limit, swagger, routes)
└── index.ts                   Server entry point
```

---

## Features

### Authentication
- Register with email + username + password
- Email verification via tokenised link
- Login returns both an access token (cookie + body) and a refresh token
- Refresh access token without re-login
- Forgot password → email link → reset password
- Change password while authenticated
- Resend verification email
- **Upload / update profile avatar** (`PATCH /api/v1/auth/avatar`)

### Projects
- Create, read, update, delete projects
- Each project creator becomes its Admin automatically
- **Paginated** list of all projects the current user is a member of, with live member counts

### Team Member Management
- Add a user to a project by email, with a role
- List all members of a project
- Update a member's role
- Remove a member from a project

### Tasks
- Create tasks inside a project with title, description, assignee, status
- Attach up to 5 files per task (images, PDFs, text — max 1 MB each)
- Three statuses: `todo` · `in_progress` · `done`
- **Paginated & filterable** task list (`?status=`, `?assignedTo=`, `?page=`, `?limit=`)

### Subtasks
- Add subtasks to any task
- Admins/Project Admins can create, update title, delete
- Members can toggle `isCompleted` only

### Project Notes
- Admin-only creation and management of project notes
- **Paginated** notes list for all project members (`?page=`, `?limit=`)

### Observability
- **Structured logging** via Pino — every request logged with method, URL, status, and response time
- Pretty-printed in development; newline-delimited JSON in production
- Unhandled 500 errors logged with full error object

### Security & Infrastructure
- Helmet sets secure HTTP headers
- CORS restricted to configured origins
- Rate-limiting: 100 requests / 15 min per IP
- All env vars validated at startup — the server won't start with a bad config
- Global error handler with consistent response shape
- Multer MIME-type whitelist + 1 MB file size limit

---

## Permission Matrix

| Action | Admin | Project Admin | Member |
|---|:---:|:---:|:---:|
| Create project | ✅ | ❌ | ❌ |
| Update / Delete project | ✅ | ❌ | ❌ |
| Add / Remove / Update members | ✅ | ❌ | ❌ |
| View project & members | ✅ | ✅ | ✅ |
| Create / Update / Delete tasks | ✅ | ✅ | ❌ |
| View tasks | ✅ | ✅ | ✅ |
| Create / Delete subtasks | ✅ | ✅ | ❌ |
| Toggle subtask completion | ✅ | ✅ | ✅ |
| Create / Update / Delete notes | ✅ | ❌ | ❌ |
| View notes | ✅ | ✅ | ✅ |

> Roles are **per-project**. A user can be Admin in one project and Member in another.

---

## Getting Started

### Option A — Local (Node.js)

#### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- A [Mailtrap](https://mailtrap.io) account (free) for dev email

#### 1. Clone & install

```bash
git clone https://github.com/Mahnoor-Zaffar/Project-Camp-Backend.git
cd Project-Camp-Backend
npm install
```

#### 2. Configure environment

```bash
cp .env.example .env
# Open .env and fill in all required values
```

#### 3. Run in development

```bash
npm run dev
# Server starts at http://localhost:8000
# Logs are pretty-printed to the console
```

#### 4. Build for production

```bash
npm run build      # Compiles TypeScript → dist/
npm start          # Runs compiled JS
```

#### 5. Type-check only (no emit)

```bash
npm run typecheck
```

---

### Option B — Docker

No need to install Node.js or MongoDB locally.

```bash
cp .env.example .env
# Set ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, and any other required vars.
# MONGO_URI is overridden by docker-compose to use the bundled MongoDB service.

docker compose up --build
# API:    http://localhost:8000
# Mongo:  localhost:27017
```

To stop and remove containers:

```bash
docker compose down
```

Uploaded files are stored in a named Docker volume (`uploads`) so they persist across container restarts.

---

## Running Tests

Tests use **Vitest** with an in-memory MongoDB (no external DB needed).

```bash
# Run the full test suite once
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Generate an lcov coverage report
npm run test:coverage
```

### What's tested

| Suite | File | Tests |
|---|---|---|
| Unit — AuthService | `src/__tests__/unit/services/auth.service.test.ts` | register, login, verifyEmail, changePassword |
| Unit — ProjectService | `src/__tests__/unit/services/project.service.test.ts` | createProject, updateProject, addMember, removeMember, getProjectById |
| Unit — TaskService | `src/__tests__/unit/services/task.service.test.ts` | createTask, deleteTask, updateSubtask (RBAC) |
| Integration — Auth flow | `src/__tests__/integration/auth.test.ts` | register, login, current-user, refresh-token, healthcheck |
| Integration — Projects | `src/__tests__/integration/projects.test.ts` | CRUD, pagination envelope, member management, RBAC |

**48 / 48 tests passing.**

---

## API Docs (Swagger)

The full OpenAPI 3.0 specification is served as an interactive UI:

```
http://localhost:8000/api-docs
```

Every endpoint is documented with request/response schemas, authentication requirements, and query parameters. No extra setup needed — it starts with the server.

---

## Environment Variables

Copy `.env.example` to `.env` and set every value before starting.

| Variable | Required | Description |
|---|:---:|---|
| `PORT` | No | HTTP port (default `8000`) |
| `NODE_ENV` | No | `development` · `production` · `test` |
| `MONGO_URI` | **Yes** | Full MongoDB connection string |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `SERVER_URL` | No | Public URL of this server (used in file / avatar URLs) |
| `ACCESS_TOKEN_SECRET` | **Yes** | Secret for signing access JWTs |
| `REFRESH_TOKEN_SECRET` | **Yes** | Secret for signing refresh JWTs |
| `ACCESS_TOKEN_EXPIRY` | No | e.g. `1d` (default `1d`) |
| `REFRESH_TOKEN_EXPIRY` | No | e.g. `10d` (default `10d`) |
| `MAILTRAP_SMTP_HOST` | No | Mailtrap SMTP host |
| `MAILTRAP_SMTP_PORT` | No | Mailtrap SMTP port |
| `MAILTRAP_SMTP_USER` | No | Mailtrap username |
| `MAILTRAP_SMTP_PASS` | No | Mailtrap password |
| `FORGOT_PASSWORD_REDIRECT_URL` | No | Frontend reset-password page URL |

---

## API Reference

All endpoints are prefixed with `/api/v1`.  
Protected routes require an `Authorization: Bearer <accessToken>` header **or** an `accessToken` cookie.

---

### Auth Routes

**Base:** `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login, returns tokens |
| `GET` | `/verify-email/:verificationToken` | ❌ | Verify email address |
| `POST` | `/refresh-token` | ❌ | Refresh access token |
| `POST` | `/forgot-password` | ❌ | Request password reset email |
| `POST` | `/reset-password/:resetToken` | ❌ | Reset password with token |
| `POST` | `/logout` | ✅ | Logout (clears tokens) |
| `GET` | `/current-user` | ✅ | Get logged-in user's profile |
| `PATCH` | `/avatar` | ✅ | Upload / update profile avatar (multipart/form-data, field: `avatar`) |
| `POST` | `/change-password` | ✅ | Change current password |
| `POST` | `/resend-email-verification` | ✅ | Resend verification email |

---

### Project Routes

**Base:** `/api/v1/projects`

| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/` | Any member | List projects the user belongs to (paginated) |
| `POST` | `/` | Logged in | Create a new project |
| `GET` | `/:projectId` | Any member | Get project details |
| `PUT` | `/:projectId` | Admin | Update project name/description |
| `DELETE` | `/:projectId` | Admin | Delete project (cascades tasks, notes, members) |
| `GET` | `/:projectId/members` | Any member | List project members |
| `POST` | `/:projectId/members` | Admin | Add a member by email |
| `PUT` | `/:projectId/members/:userId` | Admin | Update a member's role |
| `DELETE` | `/:projectId/members/:userId` | Admin | Remove a member |

**Pagination query params** (on `GET /`): `?page=1&limit=10`

---

### Task Routes

**Base:** `/api/v1/tasks`

| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/:projectId` | Any member | List tasks in project (paginated + filtered) |
| `POST` | `/:projectId` | Admin / Project Admin | Create a task (supports file attachments) |
| `GET` | `/:projectId/t/:taskId` | Any member | Get task with subtasks |
| `PUT` | `/:projectId/t/:taskId` | Admin / Project Admin | Update task (appends new attachments) |
| `DELETE` | `/:projectId/t/:taskId` | Admin / Project Admin | Delete task + its subtasks |
| `POST` | `/:projectId/t/:taskId/subtasks` | Admin / Project Admin | Create a subtask |
| `PUT` | `/:projectId/st/:subTaskId` | Any member* | Update subtask |
| `DELETE` | `/:projectId/st/:subTaskId` | Admin / Project Admin | Delete subtask |

> \* Members can only update `isCompleted`. Updating `title` requires Admin or Project Admin.

**Pagination & filter query params** (on `GET /:projectId`):

| Param | Type | Description |
|---|---|---|
| `page` | integer | Page number, 1-indexed (default: `1`) |
| `limit` | integer | Items per page, max 50 (default: `10`) |
| `status` | string | Filter by `todo` · `in_progress` · `done` |
| `assignedTo` | string | Filter by assignee user ID |

**File uploads** use `multipart/form-data`. Field name: `attachments` (max 5 files, 1 MB each).  
Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`.

---

### Note Routes

**Base:** `/api/v1/notes`

| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/:projectId` | Any member | List notes for project (paginated) |
| `POST` | `/:projectId` | Admin | Create a note |
| `GET` | `/:projectId/n/:noteId` | Any member | Get a single note |
| `PUT` | `/:projectId/n/:noteId` | Admin | Update note content |
| `DELETE` | `/:projectId/n/:noteId` | Admin | Delete note |

**Pagination query params** (on `GET /:projectId`): `?page=1&limit=10`

---

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/healthcheck` | Returns `{ status: "ok" }` |

---

## Request & Response Examples

All responses follow a consistent envelope:

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Human readable message",
  "success": true
}
```

List endpoints that support pagination return:

```json
{
  "statusCode": 200,
  "data": {
    "projects": [ ... ],
    "total": 42,
    "page": 1,
    "totalPages": 5
  },
  "message": "Projects fetched successfully",
  "success": true
}
```

---

### Register

**`POST /api/v1/auth/register`**

```json
// Request body
{
  "email": "jane@example.com",
  "username": "janedoe",
  "password": "secret123",
  "fullName": "Jane Doe"
}
```

```json
// 201 Response
{
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "665f1a...",
      "username": "janedoe",
      "email": "jane@example.com",
      "fullName": "Jane Doe",
      "isEmailVerified": false,
      "avatar": { "url": "", "localPath": "" },
      "createdAt": "2026-06-15T...",
      "updatedAt": "2026-06-15T..."
    }
  },
  "message": "User registered successfully. Verification email sent.",
  "success": true
}
```

---

### Login

**`POST /api/v1/auth/login`**

```json
// Request body
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

```json
// 200 Response  (tokens also set as HttpOnly cookies)
{
  "statusCode": 200,
  "data": {
    "user": { "_id": "665f1a...", "username": "janedoe", "email": "jane@example.com" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

---

### Upload Avatar

**`PATCH /api/v1/auth/avatar`** — requires auth, `multipart/form-data`

```
Field: avatar  (JPEG / PNG / GIF / WebP — max 1 MB)
```

```json
// 200 Response
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "665f1a...",
      "username": "janedoe",
      "avatar": {
        "url": "http://localhost:8000/images/1718409600000-avatar.png",
        "localPath": "public/images/1718409600000-avatar.png"
      }
    }
  },
  "message": "Avatar updated successfully",
  "success": true
}
```

---

### Create Project

**`POST /api/v1/projects`** — requires auth

```json
// Request body
{
  "name": "Website Redesign",
  "description": "Full redesign of the marketing site"
}
```

```json
// 201 Response
{
  "statusCode": 201,
  "data": {
    "_id": "66601b...",
    "name": "Website Redesign",
    "description": "Full redesign of the marketing site",
    "createdBy": "665f1a...",
    "createdAt": "2026-06-15T..."
  },
  "message": "Project created successfully",
  "success": true
}
```

---

### List Projects (paginated)

**`GET /api/v1/projects?page=1&limit=5`** — requires auth

```json
// 200 Response
{
  "statusCode": 200,
  "data": {
    "projects": [
      { "project": { "_id": "66601b...", "name": "Website Redesign", "members": 3 }, "role": "admin" }
    ],
    "total": 12,
    "page": 1,
    "totalPages": 3
  },
  "message": "Projects fetched successfully",
  "success": true
}
```

---

### List Tasks (paginated + filtered)

**`GET /api/v1/tasks/:projectId?status=in_progress&page=1&limit=10`** — requires auth

```json
// 200 Response
{
  "statusCode": 200,
  "data": {
    "tasks": [
      {
        "_id": "66702c...",
        "title": "Design homepage mockup",
        "status": "in_progress",
        "assignedTo": { "_id": "665f2b...", "username": "bob" }
      }
    ],
    "total": 5,
    "page": 1,
    "totalPages": 1
  },
  "message": "Tasks fetched successfully",
  "success": true
}
```

---

### Create Task (with attachment)

**`POST /api/v1/tasks/:projectId`** — Admin / Project Admin, `multipart/form-data`

```
title        = "Design homepage mockup"
description  = "Use Figma. Deliver by Friday."
assignedTo   = "665f2b..."      (optional — must be a project member)
status       = "in_progress"   (todo | in_progress | done)
attachments  = [file1.pdf]     (up to 5 files)
```

```json
// 201 Response
{
  "statusCode": 201,
  "data": {
    "_id": "66702c...",
    "title": "Design homepage mockup",
    "project": "66601b...",
    "assignedTo": "665f2b...",
    "assignedBy": "665f1a...",
    "status": "in_progress",
    "attachments": [
      {
        "url": "http://localhost:8000/images/1718409600000-file1.pdf",
        "mimetype": "application/pdf",
        "size": 204800
      }
    ],
    "createdAt": "2026-06-15T..."
  },
  "message": "Task created successfully",
  "success": true
}
```

---

### Add Project Member

**`POST /api/v1/projects/:projectId/members`** — Admin only

```json
// Request body
{
  "email": "bob@example.com",
  "role": "project_admin"
}
```

```json
// 201 Response
{
  "statusCode": 201,
  "data": {},
  "message": "Project member added successfully",
  "success": true
}
```

---

### Create Subtask

**`POST /api/v1/tasks/:projectId/t/:taskId/subtasks`** — Admin / Project Admin

```json
// Request body
{ "title": "Export assets from Figma" }
```

```json
// 201 Response
{
  "statusCode": 201,
  "data": {
    "_id": "66803d...",
    "title": "Export assets from Figma",
    "task": "66702c...",
    "isCompleted": false,
    "createdBy": "665f1a...",
    "createdAt": "2026-06-15T..."
  },
  "message": "Subtask created successfully",
  "success": true
}
```

---

### Toggle Subtask Completion (Member)

**`PUT /api/v1/tasks/:projectId/st/:subTaskId`** — Any member

```json
// Request body
{ "isCompleted": true }
```

```json
// 200 Response
{
  "statusCode": 200,
  "data": { "_id": "66803d...", "title": "Export assets from Figma", "isCompleted": true },
  "message": "Subtask updated successfully",
  "success": true
}
```

---

## Error Handling

All errors return the same shape:

```json
{
  "statusCode": 404,
  "data": { "errors": [] },
  "message": "Resource not found",
  "success": false
}
```

| Status | Error class | Trigger |
|---|---|---|
| 400 | `BadRequestError` | Invalid input / business rule violation |
| 401 | `UnauthorizedError` | Missing or invalid token |
| 403 | `ForbiddenError` | Insufficient project role |
| 404 | `NotFoundError` | Resource does not exist |
| 409 | `ConflictError` | Duplicate resource (email, username, member) |
| 422 | `ValidationError` | Failed Zod schema validation |
| 500 | `AppError` | Unexpected server error |

Validation error responses include a `errors` array with field-level messages:

```json
{
  "statusCode": 422,
  "data": {
    "errors": [
      "email: Invalid email",
      "password: Password is required"
    ]
  },
  "message": "Validation failed",
  "success": false
}
```

---

## Security

| Measure | Implementation |
|---|---|
| Secure headers | `helmet` (CSP, HSTS, etc.) |
| CORS | Configurable per-origin allowlist |
| Rate limiting | 100 req / 15 min / IP via `express-rate-limit` |
| Password hashing | `bcrypt` with salt rounds = 10 |
| JWT | Short-lived access token (1d) + long-lived refresh token (10d) |
| Token rotation | Refresh token replaced on every `/refresh-token` call |
| File uploads | MIME-type whitelist + 1 MB size cap via Multer |
| Input validation | Zod parses and strips every request body / param / query |
| Env validation | `zod` schema at startup — missing secrets abort the process |

---

## CI / CD

A GitHub Actions workflow runs automatically on every push to `main` and any `cursor/**` branch, as well as on pull requests to `main`.

**Pipeline steps:**

1. **Typecheck** — `tsc --noEmit` (zero TypeScript errors required)
2. **Tests** — `npm test` against a MongoDB service container (48 assertions)
3. **Docker build** — verifies the production image builds successfully

Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## License

ISC
