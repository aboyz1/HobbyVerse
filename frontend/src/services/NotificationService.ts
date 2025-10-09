import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class NotificationService {
  private baseURL = API_BASE_URL;

  // Add method to set auth token
  setAuthToken(token: string) {
    AuthService.setAuthToken(token);
  }

  /**
   * Get user's notifications
   * @param page - Page number (default: 1)
   * @param limit - Number of notifications per page (default: 20)
   * @param unreadOnly - Filter for unread notifications only (default: false)
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (unreadOnly) queryParams.append("unreadOnly", "true");

    return AuthService.makeRequest<ApiResponse<any>>(
      `/notifications?${queryParams.toString()}`
    );
  }

  /**
   * Mark a notification as read
   * @param notificationId - ID of the notification to mark as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse> {
    return AuthService.makeRequest<ApiResponse>(
      `/notifications/${notificationId}/read`,
      {
        method: "PUT",
      }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse> {
    return AuthService.makeRequest<ApiResponse>("/notifications/read-all", {
      method: "PUT",
    });
  }

  /**
   * Delete a notification
   * @param notificationId - ID of the notification to delete
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse> {
    return AuthService.makeRequest<ApiResponse>(
      `/notifications/${notificationId}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      "/notifications/preferences"
    );
  }

  /**
   * Update notification preferences
   * @param preferences - Notification preferences to update
   */
  async updatePreferences(preferences: any): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      "/notifications/preferences",
      {
        method: "PUT",
        body: JSON.stringify(preferences),
      }
    );
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      "/notifications/unread-count"
    );
  }
}

export default new NotificationService();
