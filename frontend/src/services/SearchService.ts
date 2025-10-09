import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class SearchService {
  private baseURL = API_BASE_URL;

  /**
   * Search content across projects, challenges, squads, and users
   * @param query - Search query
   * @param filters - Search filters (type, tags, etc.)
   * @param page - Page number (default: 1)
   * @param limit - Number of results per page (default: 20)
   */
  async search(
    query: string,
    filters: any = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        if (Array.isArray(filters[key])) {
          filters[key].forEach((value: string) => {
            queryParams.append(key, value);
          });
        } else {
          queryParams.append(key, filters[key]);
        }
      }
    });

    return AuthService.makeRequest<ApiResponse<any>>(
      `/search?${queryParams.toString()}`
    );
  }
}

export default new SearchService();
