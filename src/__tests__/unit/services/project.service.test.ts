import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../repositories/project.repository.js");
vi.mock("../../../repositories/user.repository.js");

import { projectRepository } from "../../../repositories/project.repository.js";
import { userRepository } from "../../../repositories/user.repository.js";
import { ProjectService } from "../../../services/project.service.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../utils/errors.js";

const mockedProjectRepo = vi.mocked(projectRepository);
const mockedUserRepo = vi.mocked(userRepository);

const mockProject = {
  _id: "project-id-1",
  id: "project-id-1",
  name: "Test Project",
  description: "A test project",
  createdBy: "user-id-1",
};

const mockMembership = {
  _id: "member-id-1",
  user: "user-id-1",
  project: "project-id-1",
  role: "admin" as const,
};

describe("ProjectService", () => {
  let service: ProjectService;

  beforeEach(() => {
    service = new ProjectService();
    vi.clearAllMocks();
  });

  // ── createProject ────────────────────────────────────────────────────────────
  describe("createProject", () => {
    it("creates project and adds creator as admin", async () => {
      mockedProjectRepo.create = vi.fn().mockResolvedValue(mockProject);
      mockedProjectRepo.createMembership = vi.fn().mockResolvedValue(mockMembership);

      const project = await service.createProject("user-id-1", {
        name: "Test Project",
        description: "desc",
      });

      expect(mockedProjectRepo.create).toHaveBeenCalledWith({
        name: "Test Project",
        description: "desc",
        createdBy: "user-id-1",
      });
      expect(mockedProjectRepo.createMembership).toHaveBeenCalledWith(
        "user-id-1",
        mockProject.id,
        "admin",
      );
      expect(project.name).toBe("Test Project");
    });
  });

  // ── updateProject ────────────────────────────────────────────────────────────
  describe("updateProject", () => {
    it("throws NotFoundError when project does not exist", async () => {
      mockedProjectRepo.update = vi.fn().mockResolvedValue(null);
      await expect(service.updateProject("bad-id", { name: "X" })).rejects.toThrow(NotFoundError);
    });

    it("returns updated project", async () => {
      mockedProjectRepo.update = vi.fn().mockResolvedValue({ ...mockProject, name: "Updated" });
      const result = await service.updateProject("project-id-1", { name: "Updated" });
      expect(result.name).toBe("Updated");
    });
  });

  // ── addMember ────────────────────────────────────────────────────────────────
  describe("addMember", () => {
    it("throws NotFoundError when invited user does not exist", async () => {
      mockedUserRepo.findByEmail = vi.fn().mockResolvedValue(null);
      await expect(service.addMember("project-id-1", "nobody@x.com", "member")).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError when user is already a member", async () => {
      mockedUserRepo.findByEmail = vi.fn().mockResolvedValue({ _id: { toString: () => "user-id-2" } });
      mockedProjectRepo.findMembership = vi.fn().mockResolvedValue(mockMembership);
      await expect(service.addMember("project-id-1", "user2@x.com", "member")).rejects.toThrow(BadRequestError);
    });

    it("upserts member when user exists and is not already a member", async () => {
      mockedUserRepo.findByEmail = vi.fn().mockResolvedValue({ _id: { toString: () => "user-id-2" } });
      mockedProjectRepo.findMembership = vi.fn().mockResolvedValue(null);
      mockedProjectRepo.upsertMember = vi.fn().mockResolvedValue({ role: "member" });

      await service.addMember("project-id-1", "user2@x.com", "member");
      expect(mockedProjectRepo.upsertMember).toHaveBeenCalledOnce();
    });
  });

  // ── removeMember ─────────────────────────────────────────────────────────────
  describe("removeMember", () => {
    it("throws NotFoundError when member does not exist", async () => {
      mockedProjectRepo.deleteMember = vi.fn().mockResolvedValue(null);
      await expect(service.removeMember("project-id-1", "user-id-99")).rejects.toThrow(NotFoundError);
    });
  });

  // ── getProjectById ────────────────────────────────────────────────────────────
  describe("getProjectById", () => {
    it("throws ForbiddenError when user is not a member", async () => {
      mockedProjectRepo.findMembership = vi.fn().mockResolvedValue(null);
      await expect(service.getProjectById("user-id-1", "project-id-1")).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError when project does not exist", async () => {
      mockedProjectRepo.findMembership = vi.fn().mockResolvedValue(mockMembership);
      mockedProjectRepo.findById = vi.fn().mockResolvedValue(null);
      await expect(service.getProjectById("user-id-1", "project-id-1")).rejects.toThrow(NotFoundError);
    });
  });
});
