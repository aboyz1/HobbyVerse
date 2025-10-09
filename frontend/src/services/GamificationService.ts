import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class GamificationService {
  private baseURL = API_BASE_URL;

  // Add method to set auth token
  setAuthToken(token: string) {
    AuthService.setAuthToken(token);
  }

  /**
   * Get leaderboard data
   * @param filter - Time filter (global, weekly, monthly)
   * @param limit - Number of entries to return
   */
  async getLeaderboard(
    filter: "global" | "weekly" | "monthly" = "global",
    limit: number = 50
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("filter", filter);
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/gamification/leaderboard?${queryParams.toString()}`
    );
  }

  /**
   * Get user's badges
   * @param userId - User ID (optional, defaults to current user)
   * @param filter - Filter by earned status (all, earned, unearned)
   */
  async getUserBadges(
    userId?: string,
    filter: "all" | "earned" | "unearned" = "all"
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append("userId", userId);
    queryParams.append("filter", filter);

    return AuthService.makeRequest<ApiResponse<any>>(
      `/gamification/badges?${queryParams.toString()}`
    );
  }

  /**
   * Get user's points history
   * @param filter - Filter by points type (all, earned, spent)
   * @param limit - Number of entries to return
   */
  async getPointsHistory(
    filter: "all" | "earned" | "spent" = "all",
    limit: number = 50
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("filter", filter);
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/gamification/points-history?${queryParams.toString()}`
    );
  }

  /**
   * Get user's gamification stats
   * @param userId - User ID (optional, defaults to current user)
   */
  async getUserStats(userId?: string): Promise<ApiResponse<any>> {
    const url = userId
      ? `/gamification/stats?userId=${userId}`
      : "/gamification/stats";

    return AuthService.makeRequest<ApiResponse<any>>(url);
  }

  /**
   * Get available badges
   */
  async getAvailableBadges(): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      "/gamification/badges/available"
    );
  }

  /**
   * Get user's current level and progress
   * @param userId - User ID (optional, defaults to current user)
   */
  async getUserLevel(userId?: string): Promise<ApiResponse<any>> {
    const url = userId
      ? `/gamification/level?userId=${userId}`
      : "/gamification/level";

    return AuthService.makeRequest<ApiResponse<any>>(url);
  }
}

export default new GamificationService();
