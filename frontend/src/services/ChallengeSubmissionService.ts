import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class ChallengeSubmissionService {
  private baseURL = API_BASE_URL;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get challenge submissions (for challenge creator)
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
   * Review challenge submission (for challenge creator)
   */
  async reviewChallengeSubmission(
    challengeId: string,
    submissionId: string,
    reviewData: {
      status: "approved" | "rejected";
      feedback?: string;
      points_awarded?: number;
    }
  ): Promise<ApiResponse<any>> {
    // Validate UUID formats before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(challengeId)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    if (!uuidRegex.test(submissionId)) {
      return {
        success: false,
        error: "Invalid submission ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any>>(
      `/challenges/${challengeId}/submissions/${submissionId}/review`,
      {
        method: "PUT",
        body: JSON.stringify(reviewData),
      }
    ).catch((error) => {
      console.error("Error reviewing challenge submission:", error);
      return {
        success: false,
        error:
          error.message || "Failed to review submission. Please try again.",
      };
    });
  }

  /**
   * Get submission details
   */
  async getSubmissionDetails(
    challengeId: string,
    submissionId: string
  ): Promise<ApiResponse<any>> {
    // Validate UUID formats before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(challengeId)) {
      return {
        success: false,
        error: "Invalid challenge ID format. Please try again.",
      };
    }

    if (!uuidRegex.test(submissionId)) {
      return {
        success: false,
        error: "Invalid submission ID format. Please try again.",
      };
    }

    // For now, we'll get the submission from the list since there's no direct endpoint
    // In a real implementation, you might want a dedicated endpoint
    return this.getChallengeSubmissions(challengeId).then((response) => {
      if (response.success && response.data) {
        const submission = response.data.find(
          (sub: any) => sub.id === submissionId
        );
        if (submission) {
          return {
            success: true,
            data: submission,
          };
        }
      }
      return {
        success: false,
        error: "Submission not found",
      };
    });
  }
}

export default new ChallengeSubmissionService();
