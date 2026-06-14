import type { ITaskAttachment } from "../models/task.model.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors.js";
import { UserRolesEnum, type TaskStatus, type UserRole } from "../utils/constants.js";

export class TaskService {
  private async ensureTaskInProject(taskId: string, projectId: string) {
    const task = await taskRepository.findById(taskId);
    if (!task || task.project.toString() !== projectId) {
      throw new NotFoundError("Task not found");
    }
    return task;
  }

  private async ensureSubtaskInProject(subtaskId: string, projectId: string) {
    const subtask = await taskRepository.findSubtaskWithTask(subtaskId);
    if (!subtask) {
      throw new NotFoundError("Subtask not found");
    }

    const task = await taskRepository.findById(subtask.task.toString());
    if (!task || task.project.toString() !== projectId) {
      throw new NotFoundError("Subtask not found");
    }

    return subtask;
  }

  async listTasks(userId: string, projectId: string) {
    await projectRepository.findMembership(userId, projectId);
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return taskRepository.findByProject(projectId);
  }

  async getTask(userId: string, projectId: string, taskId: string) {
    await projectRepository.findMembership(userId, projectId);
    await this.ensureTaskInProject(taskId, projectId);
    const tasks = await taskRepository.findByIdWithDetails(taskId);
    if (!tasks.length) {
      throw new NotFoundError("Task not found");
    }
    return tasks[0];
  }

  buildAttachments(files: Express.Multer.File[]): ITaskAttachment[] {
    return files.map((file) => ({
      url: `${env.SERVER_URL}/images/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    }));
  }

  async createTask(
    userId: string,
    projectId: string,
    data: {
      title: string;
      description?: string;
      assignedTo?: string;
      status?: TaskStatus;
    },
    files: Express.Multer.File[] = [],
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (data.assignedTo) {
      const assigneeMembership = await projectRepository.findMembership(
        data.assignedTo,
        projectId,
      );
      if (!assigneeMembership) {
        throw new BadRequestError("Assignee must be a project member");
      }
    }

    return taskRepository.create({
      ...data,
      projectId,
      assignedBy: userId,
      attachments: this.buildAttachments(files),
    });
  }

  async updateTask(
    projectId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assignedTo?: string;
      status?: TaskStatus;
    },
    files: Express.Multer.File[] = [],
  ) {
    const existing = await this.ensureTaskInProject(taskId, projectId);

    if (data.assignedTo) {
      const assigneeMembership = await projectRepository.findMembership(
        data.assignedTo,
        projectId,
      );
      if (!assigneeMembership) {
        throw new BadRequestError("Assignee must be a project member");
      }
    }

    const newAttachments = this.buildAttachments(files);
    const attachments =
      newAttachments.length > 0
        ? [...existing.attachments, ...newAttachments]
        : undefined;

    const task = await taskRepository.update(taskId, { ...data, attachments });
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    return task;
  }

  async deleteTask(projectId: string, taskId: string) {
    await this.ensureTaskInProject(taskId, projectId);
    const task = await taskRepository.deleteWithSubtasks(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    return task;
  }

  async createSubtask(
    userId: string,
    projectId: string,
    taskId: string,
    title: string,
  ) {
    await this.ensureTaskInProject(taskId, projectId);
    return taskRepository.createSubtask({ title, taskId, createdBy: userId });
  }

  async updateSubtask(
    projectId: string,
    subtaskId: string,
    data: { title?: string; isCompleted?: boolean },
    role: UserRole,
  ) {
    await this.ensureSubtaskInProject(subtaskId, projectId);

    if (role === UserRolesEnum.MEMBER && data.title !== undefined) {
      throw new ForbiddenError(
        "Members can only update subtask completion status",
      );
    }

    const updated = await taskRepository.updateSubtask(subtaskId, data);
    if (!updated) {
      throw new NotFoundError("Subtask not found");
    }
    return updated;
  }

  async deleteSubtask(projectId: string, subtaskId: string) {
    await this.ensureSubtaskInProject(subtaskId, projectId);
    const subtask = await taskRepository.deleteSubtask(subtaskId);
    if (!subtask) {
      throw new NotFoundError("Subtask not found");
    }
    return subtask;
  }
}

export const taskService = new TaskService();
