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
  created_at: string;
  updated_at: string;
  // Additional fields
  is_member?: boolean;
  member_role?: 'admin' | 'moderator' | 'member';
  unread_messages?: number;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    total_points: number;
  };
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
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
  created_at: string;
  updated_at: string;
  post_count?: number;
  latest_post?: SquadPost;
}

export interface SquadPost {
  id: string;
  squad_id: string;
  thread_id?: string;
  user_id: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    level: number;
  };
  content: string;
  attachments?: string[];
  helpful_votes: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  has_voted?: boolean;
  comments?: SquadComment[];
}

export interface SquadComment {
  id: string;
  post_id: string;
  user_id: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    level: number;
  };
  content: string;
  parent_comment_id?: string;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
  has_voted?: boolean;
  replies?: SquadComment[];
}

export interface ChatMessage {
  id: string;
  squad_id: string;
  user_id: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments?: string[];
  reply_to?: string;
  edited: boolean;
  edited_at?: string;
  created_at: string;
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

export interface SquadSearchFilters {
  search?: string;
  tags?: string[];
  privacy?: 'public' | 'private' | 'invite_only';
  member_count_min?: number;
  member_count_max?: number;
  sort_by?: 'newest' | 'popular' | 'most_members' | 'most_active';
}