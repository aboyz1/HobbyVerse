import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class BadgeService {
  private baseURL = API_BASE_URL;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get badge by ID
   */
  async getBadgeById(id: string): Promise<ApiResponse<any>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: "Invalid badge ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any>>(`/badges/${id}`).catch(
      (error) => {
        console.error("Error fetching badge:", error);
        return {
          success: false,
          error:
            error.message || "Failed to load badge details. Please try again.",
        };
      }
    );
  }

  /**
   * Get user's badges
   */
  async getUserBadges(userId: string): Promise<ApiResponse<any[]>> {
    // Validate UUID format before making request
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return {
        success: false,
        error: "Invalid user ID format. Please try again.",
      };
    }

    return AuthService.makeRequest<ApiResponse<any[]>>(
      `/badges/user/${userId}`
    ).catch((error) => {
      console.error("Error fetching user badges:", error);
      return {
        success: false,
        error: error.message || "Failed to load user badges. Please try again.",
      };
    });
  }

  /**
   * Get all badges
   */
  async getAllBadges(params: {
    page?: number;
    limit?: number;
    rarity?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.rarity) queryParams.append("rarity", params.rarity);

    const queryString = queryParams.toString();
    const url = queryString ? `/badges?${queryString}` : "/badges";

    return AuthService.makeRequest<ApiResponse<any>>(url).catch((error) => {
      console.error("Error fetching badges:", error);
      return {
        success: false,
        error: error.message || "Failed to load badges. Please try again.",
      };
    });
  }
}

export default new BadgeService();
