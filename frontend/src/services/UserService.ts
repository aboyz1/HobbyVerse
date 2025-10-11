import { API_BASE_URL } from "../constants";
import { User, UpdateUserRequest } from "../types/user";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

// Define a specific response type for user profile that matches the backend
interface UserProfileResponse extends Omit<ApiResponse<User>, "data"> {
  user?: User;
}

// Define response types for other endpoints that match the backend structure
interface UserBadgesResponse extends Omit<ApiResponse<any[]>, "data"> {
  badges?: any[];
}

interface UserProjectsResponse extends Omit<ApiResponse<any[]>, "data"> {
  projects?: any[];
}

class UserService {
  private baseURL = API_BASE_URL;

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    // Add validation for userId
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      } as UserProfileResponse;
    }

    const response = await AuthService.makeRequest<any>(`/users/${userId}`);

    // Handle the backend response structure
    if (response.success && response.user) {
      return {
        success: true,
        user: response.user,
      };
    }

    return response;
  }

  async getCurrentUserProfile(): Promise<UserProfileResponse> {
    const response = await AuthService.makeRequest<any>("/auth/me");

    // Handle the backend response structure
    if (response.success && response.user) {
      return {
        success: true,
        user: response.user,
      };
    }

    return response;
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

  async getUserBadges(userId: string): Promise<UserBadgesResponse> {
    const response = await AuthService.makeRequest<any>(
      `/badges/user/${userId}`
    );

    // Handle the backend response structure
    if (response.success && response.badges) {
      return {
        success: true,
        badges: response.badges,
      };
    }

    return response;
  }

  async getUserProjects(userId: string): Promise<UserProjectsResponse> {
    const response = await AuthService.makeRequest<any>(
      `/projects?created_by=${userId}`
    );

    // Handle the backend response structure
    if (response.success && response.projects) {
      return {
        success: true,
        projects: response.projects,
      };
    }

    return response;
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
