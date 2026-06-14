import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../repositories/task.repository.js");
vi.mock("../../../repositories/project.repository.js");
vi.mock("../../../config/env.js", () => ({
  env: {
    SERVER_URL: "http://localhost:8000",
    NODE_ENV: "test",
  },
}));

import { taskRepository } from "../../../repositories/task.repository.js";
import { projectRepository } from "../../../repositories/project.repository.js";
import { TaskService } from "../../../services/task.service.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../../utils/errors.js";

const mockedTaskRepo = vi.mocked(taskRepository);
const mockedProjectRepo = vi.mocked(projectRepository);

const mockProject = { _id: "project-id-1", id: "project-id-1", name: "P1" };
const mockMembership = { role: "admin" as const };
const mockTask = {
  _id: "task-id-1",
  project: { toString: () => "project-id-1" },
  title: "Task 1",
  status: "todo",
  attachments: [],
};
const mockSubtask = {
  _id: "subtask-id-1",
  title: "Sub 1",
  task: "task-id-1",
  isCompleted: false,
};

describe("TaskService", () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService();
    vi.clearAllMocks();
  });

  // ── createTask ───────────────────────────────────────────────────────────────
  describe("createTask", () => {
    it("throws NotFoundError when project does not exist", async () => {
      mockedProjectRepo.findById = vi.fn().mockResolvedValue(null);
      await expect(
        service.createTask("user-id-1", "project-id-1", { title: "T" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError when assignee is not a project member", async () => {
      mockedProjectRepo.findById = vi.fn().mockResolvedValue(mockProject);
      mockedProjectRepo.findMembership = vi.fn().mockResolvedValue(null);
      await expect(
        service.createTask("user-id-1", "project-id-1", { title: "T", assignedTo: "user-id-99" }),
      ).rejects.toThrow(BadRequestError);
    });

    it("creates task when project exists and assignee is a member", async () => {
      mockedProjectRepo.findById = vi.fn().mockResolvedValue(mockProject);
      mockedProjectRepo.findMembership = vi.fn().mockResolvedValue(mockMembership);
      mockedTaskRepo.create = vi.fn().mockResolvedValue(mockTask);

      const result = await service.createTask("user-id-1", "project-id-1", {
        title: "My Task",
        assignedTo: "user-id-2",
      });

      expect(mockedTaskRepo.create).toHaveBeenCalledOnce();
      expect(result.title).toBe("Task 1");
    });
  });

  // ── deleteTask ───────────────────────────────────────────────────────────────
  describe("deleteTask", () => {
    it("throws NotFoundError when task does not belong to project", async () => {
      mockedTaskRepo.findById = vi.fn().mockResolvedValue({
        ...mockTask,
        project: { toString: () => "other-project" },
      });
      await expect(service.deleteTask("project-id-1", "task-id-1")).rejects.toThrow(NotFoundError);
    });

    it("deletes task and its subtasks", async () => {
      mockedTaskRepo.findById = vi.fn().mockResolvedValue(mockTask);
      mockedTaskRepo.deleteWithSubtasks = vi.fn().mockResolvedValue(mockTask);

      await service.deleteTask("project-id-1", "task-id-1");
      expect(mockedTaskRepo.deleteWithSubtasks).toHaveBeenCalledWith("task-id-1");
    });
  });

  // ── updateSubtask ─────────────────────────────────────────────────────────────
  describe("updateSubtask", () => {
    it("throws ForbiddenError when a Member tries to update subtask title", async () => {
      mockedTaskRepo.findSubtaskWithTask = vi.fn().mockResolvedValue(mockSubtask);
      mockedTaskRepo.findById = vi.fn().mockResolvedValue(mockTask);

      await expect(
        service.updateSubtask("project-id-1", "subtask-id-1", { title: "New title" }, "member"),
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows a Member to toggle isCompleted", async () => {
      mockedTaskRepo.findSubtaskWithTask = vi.fn().mockResolvedValue(mockSubtask);
      mockedTaskRepo.findById = vi.fn().mockResolvedValue(mockTask);
      mockedTaskRepo.updateSubtask = vi.fn().mockResolvedValue({ ...mockSubtask, isCompleted: true });

      const result = await service.updateSubtask(
        "project-id-1",
        "subtask-id-1",
        { isCompleted: true },
        "member",
      );
      expect(result.isCompleted).toBe(true);
    });

    it("allows an Admin to update subtask title", async () => {
      mockedTaskRepo.findSubtaskWithTask = vi.fn().mockResolvedValue(mockSubtask);
      mockedTaskRepo.findById = vi.fn().mockResolvedValue(mockTask);
      mockedTaskRepo.updateSubtask = vi.fn().mockResolvedValue({ ...mockSubtask, title: "New title" });

      const result = await service.updateSubtask(
        "project-id-1",
        "subtask-id-1",
        { title: "New title" },
        "admin",
      );
      expect(result.title).toBe("New title");
    });
  });
});
