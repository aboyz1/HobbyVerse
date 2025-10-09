export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  squad_id?: string;
  created_by: string;
  collaborators: string[];
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  visibility: 'public' | 'squad_only' | 'private';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours?: number;
  actual_hours?: number;
  thumbnail_url?: string;
  created_at: Date;
  updated_at: Date;
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
  uploaded_at: Date;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  attachments?: string[];
  progress_percentage?: number;
  hours_logged?: number;
  created_at: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  points_reward: number;
  badge_reward?: string;
  start_date: Date;
  end_date: Date;
  max_participants?: number;
  current_participants: number;
  requirements: string[];
  submission_guidelines: string;
  status: 'upcoming' | 'active' | 'completed';
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  title: string;
  description: string;
  submission_files: string[];
  github_url?: string;
  live_demo_url?: string;
  submitted_at: Date;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  feedback?: string;
  points_awarded?: number;
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
  start_date: Date;
  end_date: Date;
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