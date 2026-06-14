import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

// pino-http / swagger-ui-express require the env to be loaded
process.env.ACCESS_TOKEN_SECRET = "integration-test-access-secret-abc123";
process.env.REFRESH_TOKEN_SECRET = "integration-test-refresh-secret-abc123";
process.env.ACCESS_TOKEN_EXPIRY = "1d";
process.env.REFRESH_TOKEN_EXPIRY = "10d";
process.env.SERVER_URL = "http://localhost:8000";
process.env.CORS_ORIGIN = "http://localhost:5173";

const request = supertest(app);

describe("Auth — integration", () => {
  const userPayload = {
    email: "integration@test.com",
    username: "integrationuser",
    password: "Password123",
    fullName: "Integration Test",
  };

  // ── register ────────────────────────────────────────────────────────────────
  describe("POST /api/v1/auth/register", () => {
    it("returns 201 and user object on valid payload", async () => {
      const res = await request.post("/api/v1/auth/register").send(userPayload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userPayload.email);
      expect(res.body.data.user).not.toHaveProperty("password");
    });

    it("returns 409 when email or username is already taken", async () => {
      await request.post("/api/v1/auth/register").send(userPayload);
      const res = await request.post("/api/v1/auth/register").send(userPayload);
      expect(res.status).toBe(409);
    });

    it("returns 422 when email is missing", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({ username: "x", password: "pass" });
      expect(res.status).toBe(422);
    });

    it("returns 422 when username is too short", async () => {
      const res = await request.post("/api/v1/auth/register").send({
        email: "short@test.com",
        username: "ab",
        password: "pass",
      });
      expect(res.status).toBe(422);
    });
  });

  // ── login ────────────────────────────────────────────────────────────────────
  describe("POST /api/v1/auth/login", () => {
    beforeAll(async () => {
      await request.post("/api/v1/auth/register").send(userPayload);
    });

    it("returns 200 with tokens on correct credentials", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: userPayload.email, password: userPayload.password });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("returns 400 on wrong password", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: userPayload.email, password: "wrong" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when user does not exist", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "nobody@nowhere.com", password: "pass" });
      expect(res.status).toBe(400);
    });
  });

  // ── current-user ─────────────────────────────────────────────────────────────
  describe("GET /api/v1/auth/current-user", () => {
    it("returns 401 without a token", async () => {
      const res = await request.get("/api/v1/auth/current-user");
      expect(res.status).toBe(401);
    });

    it("returns 200 with valid token", async () => {
      await request.post("/api/v1/auth/register").send({
        ...userPayload,
        email: "current@test.com",
        username: "currentuser",
      });
      const loginRes = await request
        .post("/api/v1/auth/login")
        .send({ email: "current@test.com", password: userPayload.password });

      const { accessToken } = loginRes.body.data;
      const res = await request
        .get("/api/v1/auth/current-user")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("current@test.com");
    });
  });

  // ── refresh-token ─────────────────────────────────────────────────────────────
  describe("POST /api/v1/auth/refresh-token", () => {
    it("returns 401 when no refresh token provided", async () => {
      const res = await request.post("/api/v1/auth/refresh-token").send({});
      expect(res.status).toBe(401);
    });

    it("returns 401 for an invalid refresh token", async () => {
      const res = await request
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken: "bad.token.here" });
      expect(res.status).toBe(401);
    });
  });

  // ── health check ──────────────────────────────────────────────────────────────
  describe("GET /api/v1/healthcheck", () => {
    it("returns 200", async () => {
      const res = await request.get("/api/v1/healthcheck");
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ok");
    });
  });
});
