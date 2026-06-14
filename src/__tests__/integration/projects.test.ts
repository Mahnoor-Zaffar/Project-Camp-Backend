import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

process.env.ACCESS_TOKEN_SECRET = "integration-test-access-secret-abc123";
process.env.REFRESH_TOKEN_SECRET = "integration-test-refresh-secret-abc123";
process.env.ACCESS_TOKEN_EXPIRY = "1d";
process.env.REFRESH_TOKEN_EXPIRY = "10d";
process.env.SERVER_URL = "http://localhost:8000";
process.env.CORS_ORIGIN = "http://localhost:5173";

const request = supertest(app);

const registerAndLogin = async (suffix: string) => {
  const payload = {
    email: `proj${suffix}@test.com`,
    username: `projuser${suffix}`,
    password: "Password123",
  };
  await request.post("/api/v1/auth/register").send(payload);
  const res = await request.post("/api/v1/auth/login").send({
    email: payload.email,
    password: payload.password,
  });
  return res.body.data.accessToken as string;
};

describe("Projects — integration", () => {
  let adminToken: string;
  let memberToken: string;
  let projectId: string;

  beforeAll(async () => {
    adminToken = await registerAndLogin("admin1");
    memberToken = await registerAndLogin("member1");
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe("POST /api/v1/projects", () => {
    it("returns 401 without auth", async () => {
      const res = await request.post("/api/v1/projects").send({ name: "X" });
      expect(res.status).toBe(401);
    });

    it("creates a project and makes the creator Admin", async () => {
      const res = await request
        .post("/api/v1/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test Project", description: "Integration test project" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Test Project");
      projectId = res.body.data._id;
    });

    it("returns 422 when name is missing", async () => {
      const res = await request
        .post("/api/v1/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ description: "no name" });
      expect(res.status).toBe(422);
    });
  });

  // ── list ─────────────────────────────────────────────────────────────────────
  describe("GET /api/v1/projects", () => {
    it("returns the projects the admin belongs to with pagination envelope", async () => {
      const res = await request
        .get("/api/v1/projects")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("projects");
      expect(res.body.data).toHaveProperty("total");
      expect(res.body.data).toHaveProperty("page");
      expect(res.body.data).toHaveProperty("totalPages");
      expect(Array.isArray(res.body.data.projects)).toBe(true);
    });
  });

  // ── get by id ─────────────────────────────────────────────────────────────────
  describe("GET /api/v1/projects/:projectId", () => {
    it("returns 200 for a member of the project", async () => {
      const res = await request
        .get(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("returns 404 for a non-member", async () => {
      const res = await request
        .get(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── members ───────────────────────────────────────────────────────────────────
  describe("POST /api/v1/projects/:projectId/members", () => {
    it("adds a member when requester is Admin", async () => {
      const res = await request
        .post(`/api/v1/projects/${projectId}/members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "projmember1@test.com", role: "member" });
      expect(res.status).toBe(201);
    });

    it("returns 404 when a non-member tries to add someone to a project they do not belong to", async () => {
      const res = await request
        .post(`/api/v1/projects/${projectId}/members`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ email: "projmember1@test.com", role: "member" });
      expect(res.status).toBe(403);
    });
  });

  // ── update (admin only) ───────────────────────────────────────────────────────
  describe("PUT /api/v1/projects/:projectId", () => {
    it("updates project name as Admin", async () => {
      const res = await request
        .put(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Renamed Project" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Renamed Project");
    });
  });
});
