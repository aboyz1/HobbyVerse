// API Configuration
export const API_BASE_URL = __DEV__
  ? "http://192.168.43.33:3000/api"
  : "https://your-production-api.com/api";

export const SOCKET_URL = __DEV__
  ? "http://192.168.43.33:3000"
  : "https://your-production-api.com";

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  EXPO_PUSH_TOKEN: "expo_push_token",
  ONBOARDING_COMPLETE: "onboarding_complete",
} as const;

// App Configuration
export const APP_CONFIG = {
  POSTS_PER_PAGE: 10,
  COMMENTS_PER_PAGE: 20,
  PROJECTS_PER_PAGE: 10,
  USERS_PER_PAGE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_FORMATS: ["jpg", "jpeg", "png", "gif"],
  SUPPORTED_FILE_FORMATS: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "pdf",
    "doc",
    "docx",
    "zip",
  ],
  CHAT_MESSAGE_LIMIT: 50,
  NOTIFICATION_BATCH_SIZE: 25,
} as const;

// Badge Configuration
export const BADGE_CRITERIA = {
  FIRST_POST: { posts_count: 1 },
  HELPFUL_MEMBER: { helpful_votes_received: 10 },
  PROJECT_STARTER: { projects_created: 1 },
  CHALLENGE_CHAMPION: { challenges_completed: 5 },
  SQUAD_LEADER: { squad_members: 50 },
  KNOWLEDGE_SHARER: { helpful_posts: 100 },
  COMMUNITY_HERO: { total_points: 1000 },
  COLLABORATION_MASTER: { collaborations: 10 },
  MENTOR: { tutorial_posts: 20 },
} as const;

// Point System
export const POINTS = {
  POST_CREATED: 5,
  COMMENT_CREATED: 2,
  HELPFUL_VOTE_RECEIVED: 3,
  PROJECT_CREATED: 15,
  PROJECT_COMPLETED: 25,
  CHALLENGE_COMPLETED: 50,
  BADGE_EARNED: 10,
  SQUAD_CREATED: 20,
  TUTORIAL_POSTED: 10,
} as const;

// Challenge Difficulty Multipliers
export const CHALLENGE_MULTIPLIERS = {
  beginner: 1,
  intermediate: 1.5,
  advanced: 2,
} as const;

// Time Constants
export const TIME_CONSTANTS = {
  REFRESH_TOKEN_INTERVAL: 30 * 60 * 1000, // 30 minutes
  NOTIFICATION_CHECK_INTERVAL: 60 * 1000, // 1 minute
  TYPING_TIMEOUT: 3000, // 3 seconds
  DEBOUNCE_SEARCH: 500, // 500ms
  AUTO_LOGOUT_TIME: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  FILE_TOO_LARGE: "File size exceeds the maximum allowed limit.",
  UNSUPPORTED_FILE_TYPE: "This file type is not supported.",
  CAMERA_PERMISSION: "Camera permission is required to take photos.",
  GALLERY_PERMISSION: "Gallery permission is required to select photos.",
  NOTIFICATION_PERMISSION:
    "Notification permission is required to receive updates.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: "Profile updated successfully!",
  PASSWORD_CHANGED: "Password changed successfully!",
  POST_CREATED: "Post created successfully!",
  PROJECT_CREATED: "Project created successfully!",
  SQUAD_JOINED: "Successfully joined the squad!",
  SQUAD_LEFT: "Successfully left the squad!",
  CHALLENGE_SUBMITTED: "Challenge submission successful!",
  FILE_UPLOADED: "File uploaded successfully!",
  NOTIFICATION_MARKED_READ: "Notification marked as read.",
} as const;
