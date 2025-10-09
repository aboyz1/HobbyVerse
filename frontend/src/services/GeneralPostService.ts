import { API_BASE_URL } from "../constants";
import { ApiResponse } from "../types/common";
import AuthService from "./AuthService";

class GeneralPostService {
  private baseURL = API_BASE_URL;

  // Add method to set auth token
  setAuthToken(token: string) {
    AuthService.setAuthToken(token);
  }

  /**
   * Create a new general post
   * @param content - The content of the post
   * @param attachments - Optional array of attachment URLs
   */
  async createPost(
    content: string,
    attachments: string[] = []
  ): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>("/general-posts", {
      method: "POST",
      body: JSON.stringify({ content, attachments }),
    });
  }

  /**
   * Get general posts with pagination
   * @param page - Page number (default: 1)
   * @param limit - Number of posts per page (default: 20)
   */
  async getPosts(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/general-posts?${queryParams.toString()}`
    );
  }

  /**
   * Get a specific general post by ID
   * @param id - The ID of the post
   */
  async getPostById(id: string): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(`/general-posts/${id}`);
  }

  /**
   * Like/unlike a general post
   * @param id - The ID of the post
   */
  async likePost(id: string): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      `/general-posts/${id}/like`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Repost a general post
   * @param id - The ID of the post
   * @param content - Optional comment when reposting
   */
  async repostPost(id: string, content?: string): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      `/general-posts/${id}/repost`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  }

  /**
   * Get reposts for a general post
   * @param postId - The ID of the post
   * @param page - Page number (default: 1)
   * @param limit - Number of reposts per page (default: 20)
   */
  async getPostReposts(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/general-posts/${postId}/reposts?${queryParams.toString()}`
    );
  }

  /**
   * Get comments for a general post
   * @param postId - The ID of the post
   * @param page - Page number (default: 1)
   * @param limit - Number of comments per page (default: 20)
   */
  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return AuthService.makeRequest<ApiResponse<any>>(
      `/general-posts/${postId}/comments?${queryParams.toString()}`
    );
  }

  /**
   * Create a comment on a general post
   * @param postId - The ID of the post
   * @param content - The content of the comment
   * @param parentCommentId - Optional parent comment ID for replies
   */
  async createComment(
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<ApiResponse<any>> {
    return AuthService.makeRequest<ApiResponse<any>>(
      `/general-posts/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content, parent_comment_id: parentCommentId }),
      }
    );
  }
}

export default new GeneralPostService();
