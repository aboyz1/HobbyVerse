import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class FeedService {
  private baseURL = API_BASE_URL;

  // Add method to set auth token
  setAuthToken(token: string) {
    AuthService.setAuthToken(token);
  }

  /**
   * Get user's personalized feed
   * @param page - Page number (default: 1)
   * @param limit - Number of posts per page (default: 20)
   */
  async getFeed(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/feed?${queryParams.toString()}`
    );
  }

  /**
   * Get global feed (trending posts)
   * @param page - Page number (default: 1)
   * @param limit - Number of posts per page (default: 20)
   */
  async getGlobalFeed(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/feed/global?${queryParams.toString()}`
    );
  }

  /**
   * Get trending projects
   * @param page - Page number (default: 1)
   * @param limit - Number of projects per page (default: 20)
   */
  async getTrendingProjects(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/feed/trending/projects?${queryParams.toString()}`
    );
  }

  /**
   * Get trending challenges
   * @param page - Page number (default: 1)
   * @param limit - Number of challenges per page (default: 20)
   */
  async getTrendingChallenges(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/feed/trending/challenges?${queryParams.toString()}`
    );
  }

  /**
   * Get trending squads
   * @param page - Page number (default: 1)
   * @param limit - Number of squads per page (default: 20)
   */
  async getTrendingSquads(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/feed/trending/squads?${queryParams.toString()}`
    );
  }

  /**
   * Search content across projects, challenges, squads, and users
   * @param query - Search query
   * @param filters - Search filters (type, tags, etc.)
   */
  async search(query: string, filters: any = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });

    return AuthService.makeRequest<ApiResponse<any>>(
      `/search?${queryParams.toString()}`
    );
  }

  /**
   * Get discovery recommendations
   */
  async getRecommendations(): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>("/feed/recommendations");
  }
}

export default new FeedService();
