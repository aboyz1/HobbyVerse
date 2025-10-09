import { API_BASE_URL } from "../constants";
import {
  AuthResponse,
  LoginRequest,
  CreateUserRequest,
  User,
} from "../types/user";
import { ApiResponse } from "../types/common";

class AuthService {
  private baseURL = API_BASE_URL;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getAuthHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle network errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the default error message
        }

        // If it's an auth error (401), don't throw immediately - let the caller handle it
        if (response.status === 401) {
          console.log("Unauthorized request to:", endpoint);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Enhanced error handling for network issues
      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        // Try to provide more specific error information
        if (this.baseURL.includes("localhost")) {
          throw new Error(
            "Network error: Cannot connect to backend. Make sure the backend server is running and accessible."
          );
        } else {
          throw new Error(
            "Network error: Please check your internet connection and try again."
          );
        }
      }
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout(refreshToken: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<ApiResponse<User>>("/auth/me");
  }

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/users/password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async updateExpoPushToken(expoPushToken: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/users/push-token", {
      method: "POST",
      body: JSON.stringify({ expo_push_token: expoPushToken }),
    });
  }
}

export default new AuthService();
