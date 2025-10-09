import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class LeaderboardService {
  private baseURL = API_BASE_URL;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(params: {
    page?: number;
    limit?: number;
    timeframe?: "week" | "month" | "year" | "all";
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.timeframe) queryParams.append("timeframe", params.timeframe);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/leaderboards/global?${queryString}`
      : "/leaderboards/global";

    return AuthService.makeRequest<ApiResponse<any>>(url).catch((error) => {
      console.error("Error fetching global leaderboard:", error);
      return {
        success: false,
        error:
          error.message ||
          "Failed to load global leaderboard. Please try again.",
      };
    });
  }

  /**
   * Get squad leaderboard
   */
  async getSquadLeaderboard(
    squadId: string,
    params: {
      page?: number;
      limit?: number;
      timeframe?: "week" | "month" | "year" | "all";
    } = {}
  ): Promise<ApiResponse<any>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(squadId)) {
      return {
        success: false,
        error: "Invalid squad ID format. Please try again.",
      };
    }

    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.timeframe) queryParams.append("timeframe", params.timeframe);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/leaderboards/squad/${squadId}?${queryString}`
      : `/leaderboards/squad/${squadId}`;

    return AuthService.makeRequest<ApiResponse<any>>(url).catch((error) => {
      console.error("Error fetching squad leaderboard:", error);
      return {
        success: false,
        error:
          error.message ||
          "Failed to load squad leaderboard. Please try again.",
      };
    });
  }
}

export default new LeaderboardService();
