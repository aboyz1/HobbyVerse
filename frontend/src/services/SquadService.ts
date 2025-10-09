import { API_BASE_URL } from "../constants";
import { Squad, CreateSquadRequest, UpdateSquadRequest } from "../types/squad";
import { ApiResponse, PaginatedResponse } from "../types/common";

class SquadService {
  private baseURL = API_BASE_URL;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private getAuthHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
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

  // Get all squads with filtering
  async getSquads(params: {
    search?: string;
    tags?: string[];
    privacy?: "public" | "private" | "invite_only";
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Squad>>> {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append("search", params.search);
    if (params.tags)
      params.tags.forEach((tag) => queryParams.append("tags", tag));
    if (params.privacy) queryParams.append("privacy", params.privacy);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/squads${queryString ? `?${queryString}` : ""}`;

    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform the backend response to match the expected frontend format
      if (data.success) {
        const result = {
          success: true,
          data: data.squads || [],
          pagination: data.pagination,
        };

        return result as unknown as ApiResponse<PaginatedResponse<Squad>>;
      }

      return data as ApiResponse<PaginatedResponse<Squad>>;
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

  // Get squad by ID
  async getSquadById(id: string): Promise<ApiResponse<any>> {
    const url = `${this.baseURL}/squads/${id}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
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
          data: data.squad,
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

  // Create a new squad
  async createSquad(
    data: CreateSquadRequest
  ): Promise<ApiResponse<{ squad: Squad }>> {
    return this.makeRequest<{ squad: Squad }>("/squads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update squad
  async updateSquad(
    id: string,
    data: UpdateSquadRequest
  ): Promise<ApiResponse<{ squad: Squad }>> {
    return this.makeRequest<{ squad: Squad }>(`/squads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete squad
  async deleteSquad(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/squads/${id}`, {
      method: "DELETE",
    });
  }

  // Join squad
  async joinSquad(id: string, message?: string): Promise<ApiResponse> {
    return this.makeRequest(`/squads/${id}/join`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // Leave squad
  async leaveSquad(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/squads/${id}/leave`, {
      method: "POST",
    });
  }

  // Get squad members
  async getSquadMembers(
    id: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    return this.makeRequest(
      `/squads/${id}/members?page=${page}&limit=${limit}`
    );
  }

  // Promote member to moderator
  async promoteMember(squadId: string, userId: string): Promise<any> {
    return this.makeRequest(`/squads/${squadId}/members/${userId}/promote`, {
      method: "POST",
    });
  }

  // Demote member from moderator
  async demoteMember(squadId: string, userId: string): Promise<any> {
    return this.makeRequest(`/squads/${squadId}/members/${userId}/demote`, {
      method: "POST",
    });
  }

  // Remove member from squad
  async removeMember(squadId: string, userId: string): Promise<any> {
    return this.makeRequest(`/squads/${squadId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  // Get squad threads
  async getSquadThreads(
    id: string,
    type?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (type) params.append("type", type);

    return this.makeRequest(`/squads/${id}/threads?${params.toString()}`);
  }

  // Create thread
  async createThread(
    squadId: string,
    data: {
      title: string;
      description?: string;
      type?: string;
      is_pinned?: boolean;
    }
  ): Promise<any> {
    return this.makeRequest(`/squads/${squadId}/threads`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get squad posts
  async getSquadPosts(
    squadId: string,
    threadId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (threadId) params.append("thread_id", threadId);

    return this.makeRequest(`/squads/${squadId}/posts?${params.toString()}`);
  }

  // Create post
  async createPost(
    squadId: string,
    data: { content: string; thread_id?: string; attachments?: string[] }
  ): Promise<any> {
    return this.makeRequest(`/squads/${squadId}/posts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get post by ID
  async getPostById(postId: string): Promise<any> {
    return this.makeRequest(`/squads/posts/${postId}`);
  }

  // Get comments for a post
  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.makeRequest(
      `/squads/posts/${postId}/comments?${params.toString()}`
    );
  }

  // Create comment
  async createComment(
    postId: string,
    data: { content: string; parent_comment_id?: string }
  ): Promise<any> {
    return this.makeRequest(`/squads/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Vote on post
  async voteOnPost(postId: string): Promise<any> {
    return this.makeRequest(`/squads/posts/${postId}/vote`, {
      method: "POST",
    });
  }

  // Vote on comment
  async voteOnComment(commentId: string): Promise<any> {
    return this.makeRequest(`/squads/comments/${commentId}/vote`, {
      method: "POST",
    });
  }
}

export default new SquadService();
