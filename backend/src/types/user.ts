export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  portfolio_links?: string[];
  total_points: number;
  level: number;
  google_id?: string;
  email_verified: boolean;
  notification_preferences?: NotificationPreferences;
  privacy_settings?: PrivacySettings;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  squad_updates: boolean;
  project_updates: boolean;
  challenge_updates: boolean;
  achievement_updates: boolean;
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'squads_only' | 'private';
  email_visibility: 'public' | 'squads_only' | 'private';
  project_visibility: 'public' | 'squads_only' | 'private';
}

export interface UserStats {
  total_posts: number;
  total_comments: number;
  total_projects: number;
  challenges_completed: number;
  squads_joined: number;
  badges_earned: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
}

export interface UpdateUserRequest {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  portfolio_links?: string[];
  notification_preferences?: NotificationPreferences;
  privacy_settings?: PrivacySettings;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}