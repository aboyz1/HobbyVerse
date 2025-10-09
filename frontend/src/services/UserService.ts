import { API_BASE_URL } from "../constants";
import { User, UpdateUserRequest } from "../types/user";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class UserService {
  private baseURL = API_BASE_URL;

  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return AuthService.makeRequest<ApiResponse<User>>(`/users/${userId}`);
  }

  async getCurrentUserProfile(): Promise<ApiResponse<User>> {
    return AuthService.makeRequest<ApiResponse<User>>("/auth/me");
  }

  async updateUserProfile(
    userData: UpdateUserRequest
  ): Promise<ApiResponse<User>> {
    return AuthService.makeRequest<ApiResponse<User>>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async followUser(userId: string): Promise<ApiResponse> {
    return AuthService.makeRequest<ApiResponse>(`/users/${userId}/follow`, {
      method: "POST",
    });
  }

  async unfollowUser(userId: string): Promise<ApiResponse> {
    return AuthService.makeRequest<ApiResponse>(`/users/${userId}/follow`, {
      method: "DELETE",
    });
  }

  async getUserBadges(userId: string): Promise<ApiResponse<any[]>> {
    return AuthService.makeRequest<ApiResponse<any[]>>(
      `/badges/user/${userId}`
    );
  }

  async getUserProjects(userId: string): Promise<ApiResponse<any[]>> {
    return AuthService.makeRequest<ApiResponse<any[]>>(
      `/projects?created_by=${userId}`
    );
  }

  async getUserChallenges(userId: string): Promise<ApiResponse<any[]>> {
    return AuthService.makeRequest<ApiResponse<any[]>>(
      `/challenges/my-submissions`
    );
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return AuthService.makeRequest<ApiResponse<User[]>>(
      `/users/search?q=${encodeURIComponent(query)}`
    );
  }
}

export default new UserService();
