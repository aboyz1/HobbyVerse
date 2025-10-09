import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class ProjectFileService {
  private baseURL = API_BASE_URL;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Add file to project
   */
  async addFileToProject(
    projectId: string,
    fileData: {
      filename: string;
      file_url: string;
      file_type: string;
      file_size: number;
      description?: string;
    }
  ): Promise<ApiResponse<any>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return {
        success: false,
        error: "Invalid project ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any>>(
      `/projects/${projectId}/files`,
      {
        method: "POST",
        body: JSON.stringify(fileData),
      }
    ).catch((error) => {
      console.error("Error adding file to project:", error);
      return {
        success: false,
        error:
          error.message || "Failed to add file to project. Please try again.",
      };
    });
  }

  /**
   * Delete project file
   */
  async deleteProjectFile(
    projectId: string,
    fileId: string
  ): Promise<ApiResponse> {
    // Validate UUID formats before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return {
        success: false,
        error: "Invalid project ID format. Please try again.",
      };
    }

    if (!uuidRegex.test(fileId)) {
      return {
        success: false,
        error: "Invalid file ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse>(
      `/projects/${projectId}/files/${fileId}`,
      {
        method: "DELETE",
      }
    ).catch((error) => {
      console.error("Error deleting project file:", error);
      return {
        success: false,
        error: error.message || "Failed to delete file. Please try again.",
      };
    });
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId: string): Promise<ApiResponse<any[]>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return {
        success: false,
        error: "Invalid project ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any>>(`/projects/${projectId}`)
      .then((response) => {
        if (response.success && response.data && (response.data as any).files) {
          return {
            success: true,
            data: (response.data as any).files,
          };
        }
        return {
          success: false,
          error: "Failed to load project files",
        };
      })
      .catch((error) => {
        console.error("Error fetching project files:", error);
        return {
          success: false,
          error:
            error.message || "Failed to load project files. Please try again.",
        };
      });
  }
}

export default new ProjectFileService();
