export interface Squad {
  id: string;
  name: string;
  description: string;
  tags: string[];
  privacy: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  banner_url?: string;
  member_count: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: Date;
  contribution_points: number;
}

export interface SquadThread {
  id: string;
  squad_id: string;
  title: string;
  description?: string;
  type: 'projects' | 'tutorials' | 'tools' | 'general';
  is_pinned: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface SquadPost {
  id: string;
  squad_id: string;
  thread_id?: string;
  user_id: string;
  content: string;
  attachments?: string[];
  helpful_votes: number;
  reply_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface SquadComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  helpful_votes: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSquadRequest {
  name: string;
  description: string;
  tags: string[];
  privacy: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  banner_url?: string;
}

export interface UpdateSquadRequest {
  name?: string;
  description?: string;
  tags?: string[];
  privacy?: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  banner_url?: string;
}

export interface JoinSquadRequest {
  message?: string;
}

export interface CreatePostRequest {
  content: string;
  thread_id?: string;
  attachments?: string[];
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
}