export interface User {
  id: string;
  display_name: string;
  avatar_url?: string;
}

export interface Message {
  id: string;
  userId: string;
  user: User;
  content: string;
  created_at: string;
  messageType?: string;
  attachments?: string[];
}
