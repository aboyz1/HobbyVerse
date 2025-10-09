import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class ProjectService {
  private baseURL = API_BASE_URL;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  async getProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    status?: string;
    difficulty?: string;
    visibility?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.tags)
      params.tags.forEach((tag) => queryParams.append("tags", tag));
    if (params.status) queryParams.append("status", params.status);
    if (params.difficulty) queryParams.append("difficulty", params.difficulty);
    if (params.visibility) queryParams.append("visibility", params.visibility);

    const queryString = queryParams.toString();
    const url = queryString ? `/projects?${queryString}` : "/projects";

    const config: RequestInit = {
      headers: AuthService.getAuthHeaders(),
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        // Fix: Return an object that contains both data and pagination
        return {
          success: true,
          data: data.projects || [],
          pagination: data.pagination,
        } as unknown as ApiResponse<any>;
      }

      return data as ApiResponse<any>;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async getProjectById(id: string): Promise<ApiResponse<any>> {
    const config: RequestInit = {
      headers: AuthService.getAuthHeaders(),
    };

    try {
      const response = await fetch(`${this.baseURL}/projects/${id}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          data: data.project,
        };
      }

      return data as ApiResponse<any>;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async createProject(projectData: any): Promise<ApiResponse<any>> {
    const url = `${this.baseURL}/projects`;
    const config: RequestInit = {
      method: "POST",
      headers: AuthService.getAuthHeaders(),
      body: JSON.stringify(projectData),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          data: data.project,
        } as unknown as ApiResponse<any>;
      }

      return data as ApiResponse<any>;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async updateProject(id: string, projectData: any): Promise<ApiResponse<any>> {
    const url = `${this.baseURL}/projects/${id}`;
    const config: RequestInit = {
      method: "PUT",
      headers: AuthService.getAuthHeaders(),
      body: JSON.stringify(projectData),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          data: data.project,
        } as unknown as ApiResponse<any>;
      }

      return data as ApiResponse<any>;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    const url = `${this.baseURL}/projects/${id}`;
    const config: RequestInit = {
      method: "DELETE",
      headers: AuthService.getAuthHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          message: data.message,
        } as unknown as ApiResponse;
      }

      return data as ApiResponse;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async addProjectFile(
    projectId: string,
    fileData: any
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseURL}/projects/${projectId}/files`;
    const config: RequestInit = {
      method: "POST",
      headers: AuthService.getAuthHeaders(),
      body: JSON.stringify(fileData),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          data: data.file,
        } as unknown as ApiResponse<any>;
      }

      return data as ApiResponse<any>;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async deleteProjectFile(
    projectId: string,
    fileId: string
  ): Promise<ApiResponse> {
    const url = `${this.baseURL}/projects/${projectId}/files/${fileId}`;
    const config: RequestInit = {
      method: "DELETE",
      headers: AuthService.getAuthHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          message: data.message,
        } as unknown as ApiResponse;
      }

      return data as ApiResponse;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async addProjectUpdate(
    projectId: string,
    updateData: any
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseURL}/projects/${projectId}/updates`;
    const config: RequestInit = {
      method: "POST",
      headers: AuthService.getAuthHeaders(),
      body: JSON.stringify(updateData),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          data: data.update,
        } as unknown as ApiResponse<any>;
      }

      return data as ApiResponse<any>;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async likeProject(id: string): Promise<ApiResponse> {
    const url = `${this.baseURL}/projects/${id}/like`;
    const config: RequestInit = {
      method: "POST",
      headers: AuthService.getAuthHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          message: data.message,
          liked: data.liked,
        } as unknown as ApiResponse;
      }

      return data as ApiResponse;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async repostProject(id: string): Promise<ApiResponse> {
    const url = `${this.baseURL}/projects/${id}/repost`;
    const config: RequestInit = {
      method: "POST",
      headers: AuthService.getAuthHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        return {
          success: true,
          message: data.message,
          repostCount: data.repostCount,
        } as unknown as ApiResponse;
      }

      return data as ApiResponse;
    } catch (error: any) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  async searchProjects(
    query: string,
    tags?: string[]
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("search", query);
    if (tags) tags.forEach((tag) => queryParams.append("tags", tag));

    return AuthService.makeRequest<ApiResponse<any>>(
      `/projects?${queryParams.toString()}`
    );
  }
}

export default new ProjectService();
