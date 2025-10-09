import { Project } from "./project";

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
  created_at: string;
  updated_at: string;
  // Additional fields from profile endpoint
  squads_joined?: number;
  projects_created?: number;
  badges_earned?: number;
  challenges_completed?: number;
  posts_count?: number;
  comments_count?: number;
  followers_count?: number;
  following_count?: number;
  badges?: Badge[];
  recent_projects?: Project[];
  is_following?: boolean;
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
  profile_visibility: "public" | "squads_only" | "private";
  email_visibility: "public" | "squads_only" | "private";
  project_visibility: "public" | "squads_only" | "private";
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
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  earned_at?: string;
}

export interface UserProfile extends User {
  badges: Badge[];
  recent_projects: Project[];
  is_following: boolean;
}
