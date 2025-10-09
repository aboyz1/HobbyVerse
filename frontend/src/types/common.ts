export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'squad_post' | 'project_update' | 'challenge_deadline' | 'badge_earned' | 'follow' | 'like' | 'comment';
  data?: Record<string, any>;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface Leaderboard {
  rank: number;
  user: {
    id: string;
    display_name: string;
    avatar_url?: string;
    level: number;
  };
  points: number;
  badges_count: number;
  projects_count: number;
  challenges_completed: number;
}

export interface FileUpload {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  progress?: number;
  error?: string;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  query: string;
  filters?: Record<string, any>;
}

export type ScreenProps = {
  navigation: any;
  route: any;
};

export type TabParamList = {
  Home: undefined;
  Squads: undefined;
  Projects: undefined;
  Challenges: undefined;
  Profile: undefined;
};

export type StackParamList = {
  // Auth Stack
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Main Stack
  MainTabs: undefined;
  
  // Squad Stack
  SquadDetails: { squadId: string };
  SquadChat: { squadId: string };
  CreateSquad: undefined;
  SquadMembers: { squadId: string };
  SquadSettings: { squadId: string };
  
  // Project Stack
  ProjectDetails: { projectId: string };
  CreateProject: { squadId?: string };
  EditProject: { projectId: string };
  ProjectFiles: { projectId: string };
  
  // Challenge Stack
  ChallengeDetails: { challengeId: string };
  SubmitChallenge: { challengeId: string };
  ChallengeSubmissions: { challengeId: string };
  
  // User Stack
  UserProfile: { userId: string };
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  
  // Search & Discovery
  Search: { type?: 'squads' | 'projects' | 'users' | 'challenges' };
  Discover: undefined;
  
  // Media & Files
  ImageViewer: { images: string[]; index?: number };
  FileViewer: { url: string; filename: string };
  Camera: { type: 'avatar' | 'project' | 'post' };
};

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;
  
  // Squad events
  join_squad: (squadId: string) => void;
  leave_squad: (squadId: string) => void;
  joined_squad: (data: { squadId: string }) => void;
  left_squad: (data: { squadId: string }) => void;
  
  // Chat events
  send_message: (data: { squadId: string; message: string; messageType?: string }) => void;
  new_message: (message: any) => void;
  typing_start: (squadId: string) => void;
  typing_stop: (squadId: string) => void;
  user_typing: (data: { userId: string }) => void;
  user_stopped_typing: (data: { userId: string }) => void;
  
  // General events
  error: (data: { message: string }) => void;
}