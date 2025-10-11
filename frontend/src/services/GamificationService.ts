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
    // Map frontend filter to backend timeframe
    let timeframe = "all";
    switch (filter) {
      case "weekly":
        timeframe = "week";
        break;
      case "monthly":
        timeframe = "month";
        break;
      default:
        timeframe = "all";
        break;
    }

    const queryParams = new URLSearchParams();
    queryParams.append("timeframe", timeframe);
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/leaderboards/global?${queryParams.toString()}`
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
    if (userId) {
      // Get badges for a specific user
      return AuthService.makeRequest<ApiResponse<any>>(
        `/badges/user/${userId}`
      );
    } else {
      // Get all badges (for current user)
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "100"); // Get all badges

      return AuthService.makeRequest<ApiResponse<any>>(
        `/badges?${queryParams.toString()}`
      );
    }
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
    // We need to implement this endpoint or find an alternative
    // For now, we'll return an empty response to prevent errors
    return {
      success: true,
      data: [],
    } as ApiResponse<any>;
  }

  /**
   * Get user's gamification stats
   * @param userId - User ID (optional, defaults to current user)
   */
  async getUserStats(userId?: string): Promise<ApiResponse<any>> {
    if (userId) {
      // Get stats for a specific user
      return AuthService.makeRequest<ApiResponse<any>>(`/users/${userId}`);
    } else {
      // This would require a specific endpoint for current user stats
      // For now, we'll return mock data to prevent errors
      return {
        success: true,
        data: {
          totalPoints: 0,
          level: 1,
          nextLevelPoints: 100,
          currentLevelPoints: 0,
          badgesCount: 0,
          rank: 0,
        },
      } as ApiResponse<any>;
    }
  }

  /**
   * Get available badges
   */
  async getAvailableBadges(): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("limit", "100");

    return AuthService.makeRequest<ApiResponse<any>>(
      `/badges?${queryParams.toString()}`
    );
  }

  /**
   * Get user's current level and progress
   * @param userId - User ID (optional, defaults to current user)
   */
  async getUserLevel(userId?: string): Promise<ApiResponse<any>> {
    // This information is included in the user profile
    if (userId) {
      const userResponse = await AuthService.makeRequest<ApiResponse<any>>(
        `/users/${userId}`
      );

      if (userResponse.success) {
        return {
          success: true,
          data: {
            level: userResponse.data.level,
            totalPoints: userResponse.data.total_points,
          },
        } as ApiResponse<any>;
      }
    }

    // Return mock data to prevent errors
    return {
      success: true,
      data: {
        level: 1,
        totalPoints: 0,
      },
    } as ApiResponse<any>;
  }
}

export default new GamificationService();
