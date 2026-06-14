import type { Request, Response } from "express";
import { taskService } from "../services/task.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRouteParam } from "../utils/params.js";

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const filters = {
    status: req.query.status as string | undefined,
    assignedTo: req.query.assignedTo as string | undefined,
  };
  const result = await taskService.listTasks(
    req.user!._id.toString(),
    getRouteParam(req.params.projectId),
    page,
    limit,
    filters,
  );
  res.status(200).json(new ApiResponse(200, result, "Tasks fetched successfully"));
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const task = await taskService.createTask(
    req.user!._id.toString(),
    getRouteParam(req.params.projectId),
    req.body,
    files,
  );
  res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.getTask(
    req.user!._id.toString(),
    getRouteParam(req.params.projectId),
    getRouteParam(req.params.taskId),
  );
  res
    .status(200)
    .json(new ApiResponse(200, task, "Task fetched successfully"));
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const task = await taskService.updateTask(
    getRouteParam(req.params.projectId),
    getRouteParam(req.params.taskId),
    req.body,
    files,
  );
  res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.deleteTask(
    getRouteParam(req.params.projectId),
    getRouteParam(req.params.taskId),
  );
  res
    .status(200)
    .json(new ApiResponse(200, task, "Task deleted successfully"));
});

export const createSubtask = asyncHandler(
  async (req: Request, res: Response) => {
    const subtask = await taskService.createSubtask(
      req.user!._id.toString(),
      getRouteParam(req.params.projectId),
      getRouteParam(req.params.taskId),
      req.body.title,
    );
    res
      .status(201)
      .json(new ApiResponse(201, subtask, "Subtask created successfully"));
  },
);

export const updateSubtask = asyncHandler(async (req: Request, res: Response) => {
  const subtask = await taskService.updateSubtask(
    getRouteParam(req.params.projectId),
    getRouteParam(req.params.subTaskId),
    req.body,
    req.projectRole!,
  );
  res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

export const deleteSubtask = asyncHandler(
  async (req: Request, res: Response) => {
    const subtask = await taskService.deleteSubtask(
      getRouteParam(req.params.projectId),
      getRouteParam(req.params.subTaskId),
    );
    res
      .status(200)
      .json(new ApiResponse(200, subtask, "Subtask deleted successfully"));
  },
);
