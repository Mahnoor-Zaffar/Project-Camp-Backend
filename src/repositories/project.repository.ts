import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/project-member.model.js";
import { Task } from "../models/task.model.js";
import { Subtask } from "../models/subtask.model.js";
import { ProjectNote } from "../models/note.model.js";
import { UserRolesEnum, type UserRole } from "../utils/constants.js";

export class ProjectRepository {
  findById(id: string) {
    return Project.findById(id);
  }

  create(data: { name: string; description?: string; createdBy: string }) {
    return Project.create({
      ...data,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
    });
  }

  update(id: string, data: { name?: string; description?: string }) {
    return Project.findByIdAndUpdate(id, data, { new: true });
  }

  delete(id: string) {
    return Project.findByIdAndDelete(id);
  }

  async deleteCascade(projectId: string) {
    const objectId = new mongoose.Types.ObjectId(projectId);
    const tasks = await Task.find({ project: objectId }).select("_id");
    const taskIds = tasks.map((t) => t._id);

    await Promise.all([
      Subtask.deleteMany({ task: { $in: taskIds } }),
      Task.deleteMany({ project: objectId }),
      ProjectNote.deleteMany({ project: objectId }),
      ProjectMember.deleteMany({ project: objectId }),
    ]);

    return Project.findByIdAndDelete(projectId);
  }

  async findUserProjectsPaginated(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $lookup: { from: "projectmembers", localField: "project._id", foreignField: "project", as: "members" } },
      { $addFields: { "project.members": { $size: "$members" } } },
      {
        $project: {
          project: { _id: "$project._id", name: "$project.name", description: "$project.description", members: "$project.members", createdAt: "$project.createdAt", createdBy: "$project.createdBy" },
          role: 1,
          _id: 0,
        },
      },
    ];

    const [data, totalArr] = await Promise.all([
      ProjectMember.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      ProjectMember.aggregate([...pipeline, { $count: "total" }]),
    ]);
    const total = (totalArr[0] as { total?: number } | undefined)?.total ?? 0;
    return { projects: data, total, page, totalPages: Math.ceil(total / limit) };
  }

  findUserProjects(userId: string) {
    return ProjectMember.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      {
        $lookup: {
          from: "projectmembers",
          localField: "project._id",
          foreignField: "project",
          as: "members",
        },
      },
      {
        $addFields: {
          "project.members": { $size: "$members" },
        },
      },
      {
        $project: {
          project: {
            _id: "$project._id",
            name: "$project.name",
            description: "$project.description",
            members: "$project.members",
            createdAt: "$project.createdAt",
            createdBy: "$project.createdBy",
          },
          role: 1,
          _id: 0,
        },
      },
    ]);
  }

  findMembership(userId: string, projectId: string) {
    return ProjectMember.findOne({
      user: new mongoose.Types.ObjectId(userId),
      project: new mongoose.Types.ObjectId(projectId),
    });
  }

  createMembership(userId: string, projectId: string, role: UserRole) {
    return ProjectMember.create({
      user: new mongoose.Types.ObjectId(userId),
      project: new mongoose.Types.ObjectId(projectId),
      role,
    });
  }

  upsertMember(userId: string, projectId: string, role: UserRole) {
    return ProjectMember.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId),
      },
      {
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId),
        role,
      },
      { new: true, upsert: true },
    );
  }

  findMembers(projectId: string) {
    return ProjectMember.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(projectId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $project: {
          project: 1,
          user: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
  }

  updateMemberRole(projectId: string, userId: string, role: UserRole) {
    return ProjectMember.findOneAndUpdate(
      {
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId),
      },
      { role },
      { new: true },
    );
  }

  deleteMember(projectId: string, userId: string) {
    return ProjectMember.findOneAndDelete({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(userId),
    });
  }

  ensureCreatorIsAdmin(userId: string, projectId: string) {
    return this.createMembership(userId, projectId, UserRolesEnum.ADMIN);
  }
}

export const projectRepository = new ProjectRepository();
