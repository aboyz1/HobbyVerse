export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  squad_id?: string;
  squad?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  created_by: string;
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    level: number;
  };
  collaborators: string[];
  collaborator_details?: Array<{
    id: string;
    display_name: string;
    avatar_url?: string;
  }>;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  visibility: 'public' | 'squad_only' | 'private';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours?: number;
  actual_hours?: number;
  thumbnail_url?: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  // Additional fields
  is_liked?: boolean;
  is_collaborator?: boolean;
  files?: ProjectFile[];
  updates?: ProjectUpdate[];
  progress_percentage?: number;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_by: string;
  uploader?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  uploaded_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  title: string;
  content: string;
  attachments?: string[];
  progress_percentage?: number;
  hours_logged?: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  points_reward: number;
  badge_reward?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  current_participants: number;
  requirements: string[];
  submission_guidelines: string;
  status: 'upcoming' | 'active' | 'completed';
  created_by: string;
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
  // Additional fields
  is_participating?: boolean;
  user_submission?: ChallengeSubmission;
  days_remaining?: number;
  submissions_count?: number;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  title: string;
  description: string;
  submission_files: string[];
  github_url?: string;
  live_demo_url?: string;
  submitted_at: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  feedback?: string;
  points_awarded?: number;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  tags: string[];
  squad_id?: string;
  visibility: 'public' | 'squad_only' | 'private';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours?: number;
  thumbnail_url?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  tags?: string[];
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  visibility?: 'public' | 'squad_only' | 'private';
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours?: number;
  actual_hours?: number;
  thumbnail_url?: string;
}

export interface CreateChallengeRequest {
  title: string;
  description: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  points_reward: number;
  badge_reward?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  requirements: string[];
  submission_guidelines: string;
}

export interface SubmitChallengeRequest {
  title: string;
  description: string;
  submission_files: string[];
  github_url?: string;
  live_demo_url?: string;
}

export interface ProjectSearchFilters {
  search?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  squad_id?: string;
  sort_by?: 'newest' | 'popular' | 'most_liked' | 'trending';
}

export interface ChallengeSearchFilters {
  search?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'upcoming' | 'active' | 'completed';
  sort_by?: 'newest' | 'ending_soon' | 'most_participants' | 'highest_reward';
}