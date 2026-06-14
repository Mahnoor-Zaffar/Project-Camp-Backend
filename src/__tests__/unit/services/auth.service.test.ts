import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../repositories/user.repository.js");
vi.mock("../../../utils/mail.js");
vi.mock("../../../config/env.js", () => ({
  env: {
    ACCESS_TOKEN_SECRET: "test-access-secret",
    REFRESH_TOKEN_SECRET: "test-refresh-secret",
    ACCESS_TOKEN_EXPIRY: "1d",
    REFRESH_TOKEN_EXPIRY: "10d",
    SERVER_URL: "http://localhost:8000",
    NODE_ENV: "test",
  },
}));

import { userRepository } from "../../../repositories/user.repository.js";
import { AuthService } from "../../../services/auth.service.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../utils/errors.js";

const mockedRepo = vi.mocked(userRepository);

const mockUser = {
  _id: { toString: () => "user-id-1" },
  email: "test@example.com",
  username: "testuser",
  fullName: "Test User",
  isEmailVerified: false,
  refreshToken: "old-refresh-token",
  emailVerificationToken: undefined as string | undefined,
  emailVerificationExpiry: undefined as Date | undefined,
  forgotPasswordToken: undefined as string | undefined,
  forgotPasswordExpiry: undefined as Date | undefined,
  isPasswordCorrect: vi.fn(),
  generateAccessToken: vi.fn(() => "access-token"),
  generateRefreshToken: vi.fn(() => "refresh-token"),
  generateTemporaryToken: vi.fn(() => ({
    unHashedToken: "unhashed",
    hashedToken: "hashed",
    tokenExpiry: Date.now() + 1000 * 60 * 20,
  })),
  save: vi.fn(),
};

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    vi.clearAllMocks();
  });

  // ── register ────────────────────────────────────────────────────────────────
  describe("register", () => {
    it("throws ConflictError if email or username already exists", async () => {
      mockedRepo.findByEmailOrUsername = vi.fn().mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: "test@example.com",
          username: "testuser",
          password: "pass",
          verificationBaseUrl: "http://localhost/verify",
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("creates user and returns sanitized user when no conflict", async () => {
      mockedRepo.findByEmailOrUsername = vi.fn().mockResolvedValue(null);
      mockedRepo.create = vi.fn().mockResolvedValue(mockUser);
      mockedRepo.findByIdSafe = vi.fn().mockResolvedValue({ _id: "user-id-1", email: "test@example.com" });

      const result = await service.register({
        email: "test@example.com",
        username: "testuser",
        password: "pass",
        verificationBaseUrl: "http://localhost/verify",
      });

      expect(mockedRepo.create).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ email: "test@example.com" });
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────
  describe("login", () => {
    it("throws BadRequestError when user does not exist", async () => {
      mockedRepo.findByEmail = vi.fn().mockResolvedValue(null);
      await expect(service.login("no@one.com", "pass")).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when password is wrong", async () => {
      mockedRepo.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockUser.isPasswordCorrect.mockResolvedValue(false);
      await expect(service.login("test@example.com", "wrong")).rejects.toThrow(BadRequestError);
    });

    it("returns tokens when credentials are correct", async () => {
      mockedRepo.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockUser.isPasswordCorrect.mockResolvedValue(true);
      mockedRepo.findById = vi.fn().mockResolvedValue(mockUser);
      mockedRepo.findByIdSafe = vi.fn().mockResolvedValue({ _id: "user-id-1", email: "test@example.com" });

      const result = await service.login("test@example.com", "correct");

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
    });
  });

  // ── verifyEmail ─────────────────────────────────────────────────────────────
  describe("verifyEmail", () => {
    it("throws BadRequestError when token is invalid", async () => {
      mockedRepo.findByEmailVerificationToken = vi.fn().mockResolvedValue(null);
      await expect(service.verifyEmail("bad-token")).rejects.toThrow(BadRequestError);
    });

    it("sets isEmailVerified = true on valid token", async () => {
      mockedRepo.findByEmailVerificationToken = vi.fn().mockResolvedValue(mockUser);

      const result = await service.verifyEmail("good-token");

      expect(mockUser.isEmailVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalledOnce();
      expect(result.isEmailVerified).toBe(true);
    });
  });

  // ── changePassword ──────────────────────────────────────────────────────────
  describe("changePassword", () => {
    it("throws NotFoundError when user not found", async () => {
      mockedRepo.findById = vi.fn().mockResolvedValue(null);
      await expect(service.changePassword("uid", "old", "new")).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError when old password is wrong", async () => {
      mockedRepo.findById = vi.fn().mockResolvedValue(mockUser);
      mockUser.isPasswordCorrect.mockResolvedValue(false);
      await expect(service.changePassword("uid", "wrong", "new")).rejects.toThrow(BadRequestError);
    });

    it("saves new password when old password is correct", async () => {
      mockedRepo.findById = vi.fn().mockResolvedValue(mockUser);
      mockUser.isPasswordCorrect.mockResolvedValue(true);
      mockUser.save.mockClear();

      await service.changePassword("uid", "old", "new");
      expect(mockUser.save).toHaveBeenCalledOnce();
    });
  });
});
