import type { Request, Response } from "express";
import { projectService } from "../services/project.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRouteParam } from "../utils/params.js";

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.getUserProjects(
    req.user!._id.toString(),
  );
  res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    const project = await projectService.createProject(
      req.user!._id.toString(),
      req.body,
    );
    res
      .status(201)
      .json(new ApiResponse(201, project, "Project created successfully"));
  },
);

export const getProjectById = asyncHandler(
  async (req: Request, res: Response) => {
    const project = await projectService.getProjectById(
      req.user!._id.toString(),
      getRouteParam(req.params.projectId),
    );
    res
      .status(200)
      .json(new ApiResponse(200, project, "Project fetched successfully"));
  },
);

export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    const project = await projectService.updateProject(
      getRouteParam(req.params.projectId),
      req.body,
    );
    res
      .status(200)
      .json(new ApiResponse(200, project, "Project updated successfully"));
  },
);

export const deleteProject = asyncHandler(
  async (req: Request, res: Response) => {
    const project = await projectService.deleteProject(
      getRouteParam(req.params.projectId),
    );
    res
      .status(200)
      .json(new ApiResponse(200, project, "Project deleted successfully"));
  },
);

export const getProjectMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const members = await projectService.getMembers(
      req.user!._id.toString(),
      getRouteParam(req.params.projectId),
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, members, "Project members fetched successfully"),
      );
  },
);

export const addProjectMember = asyncHandler(
  async (req: Request, res: Response) => {
    await projectService.addMember(
      getRouteParam(req.params.projectId),
      req.body.email,
      req.body.role,
    );
    res
      .status(201)
      .json(new ApiResponse(201, {}, "Project member added successfully"));
  },
);

export const updateMemberRole = asyncHandler(
  async (req: Request, res: Response) => {
    const member = await projectService.updateMemberRole(
      getRouteParam(req.params.projectId),
      getRouteParam(req.params.userId),
      req.body.newRole,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          member,
          "Project member role updated successfully",
        ),
      );
  },
);

export const removeProjectMember = asyncHandler(
  async (req: Request, res: Response) => {
    const member = await projectService.removeMember(
      getRouteParam(req.params.projectId),
      getRouteParam(req.params.userId),
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, member, "Project member removed successfully"),
      );
  },
);
