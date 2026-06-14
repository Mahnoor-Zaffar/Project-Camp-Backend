import { userRepository } from "../repositories/user.repository.js";
import { projectRepository } from "../repositories/project.repository.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors.js";
import { UserRolesEnum, type UserRole } from "../utils/constants.js";

export class ProjectService {
  async getUserProjects(userId: string, page: number, limit: number) {
    return projectRepository.findUserProjectsPaginated(userId, page, limit);
  }

  async getProjectById(userId: string, projectId: string) {
    await this.ensureMembership(userId, projectId);
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return project;
  }

  async createProject(
    userId: string,
    data: { name: string; description?: string },
  ) {
    const project = await projectRepository.create({
      ...data,
      createdBy: userId,
    });
    await projectRepository.createMembership(
      userId,
      project.id,
      UserRolesEnum.ADMIN,
    );
    return project;
  }

  async updateProject(
    projectId: string,
    data: { name?: string; description?: string },
  ) {
    const project = await projectRepository.update(projectId, data);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return project;
  }

  async deleteProject(projectId: string) {
    const project = await projectRepository.deleteCascade(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return project;
  }

  async getMembers(userId: string, projectId: string) {
    await this.ensureMembership(userId, projectId);
    return projectRepository.findMembers(projectId);
  }

  async addMember(
    projectId: string,
    email: string,
    role: UserRole,
  ) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const existing = await projectRepository.findMembership(
      user._id.toString(),
      projectId,
    );
    if (existing) {
      throw new BadRequestError("User is already a member of this project");
    }

    return projectRepository.upsertMember(
      user._id.toString(),
      projectId,
      role,
    );
  }

  async updateMemberRole(
    projectId: string,
    memberUserId: string,
    newRole: UserRole,
  ) {
    const member = await projectRepository.updateMemberRole(
      projectId,
      memberUserId,
      newRole,
    );
    if (!member) {
      throw new NotFoundError("Project member not found");
    }
    return member;
  }

  async removeMember(projectId: string, memberUserId: string) {
    const member = await projectRepository.deleteMember(
      projectId,
      memberUserId,
    );
    if (!member) {
      throw new NotFoundError("Project member not found");
    }
    return member;
  }

  async ensureMembership(userId: string, projectId: string) {
    const membership = await projectRepository.findMembership(userId, projectId);
    if (!membership) {
      throw new ForbiddenError("You do not have access to this project");
    }
    return membership;
  }
}

export const projectService = new ProjectService();
