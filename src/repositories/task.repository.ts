import mongoose from "mongoose";
import { Task, type ITaskAttachment } from "../models/task.model.js";
import { Subtask } from "../models/subtask.model.js";

export class TaskRepository {
  findByProject(projectId: string) {
    return Task.find({
      project: new mongoose.Types.ObjectId(projectId),
    }).populate("assignedTo", "avatar username fullName email");
  }

  findById(taskId: string) {
    return Task.findById(taskId);
  }

  findByIdWithDetails(taskId: string) {
    return Task.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(taskId) } },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
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
        $lookup: {
          from: "subtasks",
          localField: "_id",
          foreignField: "task",
          as: "subtasks",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          assignedTo: { $arrayElemAt: ["$assignedTo", 0] },
        },
      },
    ]);
  }

  create(data: {
    title: string;
    description?: string;
    projectId: string;
    assignedTo?: string;
    assignedBy: string;
    status?: string;
    attachments?: ITaskAttachment[];
  }) {
    return Task.create({
      title: data.title,
      description: data.description,
      project: new mongoose.Types.ObjectId(data.projectId),
      assignedTo: data.assignedTo
        ? new mongoose.Types.ObjectId(data.assignedTo)
        : undefined,
      assignedBy: new mongoose.Types.ObjectId(data.assignedBy),
      status: data.status,
      attachments: data.attachments ?? [],
    });
  }

  update(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assignedTo?: string;
      status?: string;
      attachments?: ITaskAttachment[];
    },
  ) {
    const update: Record<string, unknown> = { ...data };
    if (data.assignedTo) {
      update.assignedTo = new mongoose.Types.ObjectId(data.assignedTo);
    }
    return Task.findByIdAndUpdate(taskId, update, { new: true }).populate(
      "assignedTo",
      "avatar username fullName email",
    );
  }

  delete(taskId: string) {
    return Task.findByIdAndDelete(taskId);
  }

  async deleteWithSubtasks(taskId: string) {
    await Subtask.deleteMany({ task: new mongoose.Types.ObjectId(taskId) });
    return Task.findByIdAndDelete(taskId);
  }

  createSubtask(data: {
    title: string;
    taskId: string;
    createdBy: string;
  }) {
    return Subtask.create({
      title: data.title,
      task: new mongoose.Types.ObjectId(data.taskId),
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
    });
  }

  findSubtaskById(subtaskId: string) {
    return Subtask.findById(subtaskId);
  }

  findSubtaskWithTask(subtaskId: string) {
    return Subtask.findById(subtaskId).populate("task");
  }

  updateSubtask(
    subtaskId: string,
    data: { title?: string; isCompleted?: boolean },
  ) {
    return Subtask.findByIdAndUpdate(subtaskId, data, { new: true }).populate(
      "createdBy",
      "avatar username fullName",
    );
  }

  deleteSubtask(subtaskId: string) {
    return Subtask.findByIdAndDelete(subtaskId);
  }
}

export const taskRepository = new TaskRepository();
