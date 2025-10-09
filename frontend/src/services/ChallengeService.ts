import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class ChallengeService {
  private baseURL = API_BASE_URL;

  /**
   * Get all challenges with filtering
   */
  async getChallenges(params: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    difficulty?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.tags)
      params.tags.forEach((tag) => queryParams.append("tags", tag));
    if (params.difficulty) queryParams.append("difficulty", params.difficulty);
    if (params.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    const url = queryString ? `/challenges?${queryString}` : "/challenges";

    return AuthService.makeRequest<ApiResponse<any>>(url).catch((error) => {
      console.error("Error fetching challenges:", error);
      return {
        success: false,
        error: error.message || "Failed to load challenges. Please try again.",
      };
    });
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(id: string): Promise<ApiResponse<any>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any>>(`/challenges/${id}`).catch(
      (error) => {
        console.error("Error fetching challenge:", error);
        return {
          success: false,
          error:
            error.message ||
            "Failed to load challenge details. Please try again.",
        };
      }
    );
  }

  /**
   * Create a new challenge
   */
  async createChallenge(challengeData: any): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>("/challenges", {
      method: "POST",
      body: JSON.stringify(challengeData),
    }).catch((error) => {
      console.error("Error creating challenge:", error);
      return {
        success: false,
        error: error.message || "Failed to create challenge. Please try again.",
      };
    });
  }

  /**
   * Update challenge
   */
  async updateChallenge(
    id: string,
    challengeData: any
  ): Promise<ApiResponse<any>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any>>(`/challenges/${id}`, {
      method: "PUT",
      body: JSON.stringify(challengeData),
    }).catch((error) => {
      console.error("Error updating challenge:", error);
      return {
        success: false,
        error: error.message || "Failed to update challenge. Please try again.",
      };
    });
  }

  /**
   * Delete challenge
   */
  async deleteChallenge(id: string): Promise<ApiResponse> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse>(`/challenges/${id}`, {
      method: "DELETE",
    }).catch((error) => {
      console.error("Error deleting challenge:", error);
      return {
        success: false,
        error: error.message || "Failed to delete challenge. Please try again.",
      };
    });
  }

  /**
   * Join challenge
   */
  async joinChallenge(id: string): Promise<ApiResponse> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse>(`/challenges/${id}/join`, {
      method: "POST",
    }).catch((error) => {
      console.error("Error joining challenge:", error);
      return {
        success: false,
        error: error.message || "Failed to join challenge. Please try again.",
      };
    });
  }

  /**
   * Leave challenge
   */
  async leaveChallenge(id: string): Promise<ApiResponse> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse>(`/challenges/${id}/leave`, {
      method: "POST",
    }).catch((error) => {
      console.error("Error leaving challenge:", error);
      return {
        success: false,
        error: error.message || "Failed to leave challenge. Please try again.",
      };
    });
  }

  /**
   * Submit challenge
   */
  async submitChallenge(
    id: string,
    submissionData: any
  ): Promise<ApiResponse<any>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any>>(
      `/challenges/${id}/submit`,
      {
        method: "POST",
        body: JSON.stringify(submissionData),
      }
    ).catch((error) => {
      console.error("Error submitting challenge:", error);
      return {
        success: false,
        error: error.message || "Failed to submit challenge. Please try again.",
      };
    });
  }

  /**
   * Get challenge submissions
   */
  async getChallengeSubmissions(
    challengeId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<ApiResponse<any>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(challengeId)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/challenges/${challengeId}/submissions?${queryString}`
      : `/challenges/${challengeId}/submissions`;

    return AuthService.makeRequest<ApiResponse<any>>(url).catch((error) => {
      console.error("Error fetching challenge submissions:", error);
      return {
        success: false,
        error:
          error.message ||
          "Failed to load challenge submissions. Please try again.",
      };
    });
  }

  /**
   * Get user's challenge submissions
   */
  async getMySubmissions(): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      "/challenges/my-submissions"
    ).catch((error) => {
      console.error("Error fetching my submissions:", error);
      return {
        success: false,
        error:
          error.message || "Failed to load your submissions. Please try again.",
      };
    });
  }

  /**
   * Search challenges
   */
  async searchChallenges(
    query: string,
    tags?: string[]
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("search", query);
    if (tags) tags.forEach((tag) => queryParams.append("tags", tag));

    return AuthService.makeRequest<ApiResponse<any>>(
      `/challenges?${queryParams.toString()}`
    ).catch((error) => {
      console.error("Error searching challenges:", error);
      return {
        success: false,
        error:
          error.message || "Failed to search challenges. Please try again.",
      };
    });
  }
}

export default new ChallengeService();
