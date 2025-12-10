// src/services/project.service.ts
import Project from '../models/Project.model';

interface ProjectInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export class ProjectService {
  // Create a new project (Admin only)
  static async createProject(data: ProjectInput) {
    const project = await Project.create({
      name: data.name,
      description: data.description ?? '',
      isActive: data.isActive ?? true,
    });

    return project.toObject();
  }

  // Update an existing project (Admin only)
  static async updateProject(id: string, data: Partial<ProjectInput>) {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    if (data.name !== undefined) project.name = data.name;
    if (data.description !== undefined) project.description = data.description;
    if (data.isActive !== undefined) project.isActive = data.isActive;

    await project.save();
    return project.toObject();
  }

  // Delete a project (Admin only)
  static async deleteProject(id: string) {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    await Project.findByIdAndDelete(id);
    return { success: true };
  }

  // Get all projects (all authenticated users)
  static async getAllProjects(isActive?: string) {
    const filter: any = {};

    if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }

    const projects = await Project.find(filter).lean();
    return projects;
  }

  // Get a single project by ID
  static async getProjectById(id: string) {
    const project = await Project.findById(id).lean();
    // controller expects an array and checks length
    return project ? [project] : [];
  }
}

export default ProjectService;
