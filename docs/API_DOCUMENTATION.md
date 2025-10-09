# Hobbyverse API Documentation

## Overview

This document provides comprehensive documentation for the Hobbyverse REST API. The API follows RESTful principles and uses JSON for request/response formatting.

## Base URL

```
http://localhost:3000/api
```

In production, this would be:

```
https://api.hobbyverse.app/api
```

## Authentication

Most API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### Register a new user

```
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "John Doe",
  "bio": "Hobbyist developer",
  "skills": ["programming", "design"]
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "bio": "Hobbyist developer",
    "skills": ["programming", "design"],
    "total_points": 0,
    "level": 1,
    "created_at": "2023-01-01T00:00:00Z"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Login

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "bio": "Hobbyist developer",
    "skills": ["programming", "design"],
    "total_points": 150,
    "level": 2,
    "created_at": "2023-01-01T00:00:00Z"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Refresh Token

```
POST /auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    /* user object */
  },
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

#### Logout

```
POST /auth/logout
```

**Request Body:**

```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User

```
GET /auth/me
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "bio": "Hobbyist developer",
    "skills": ["programming", "design"],
    "total_points": 150,
    "level": 2,
    "squads_joined": 3,
    "projects_created": 5,
    "badges_earned": 7,
    "challenges_completed": 2,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

## Users

#### Get User Profile

```
GET /users/:id
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Hobbyist developer",
    "skills": ["programming", "design"],
    "portfolio_links": ["https://github.com/johndoe"],
    "total_points": 150,
    "level": 2,
    "squads_joined": 3,
    "projects_created": 5,
    "badges_earned": 7,
    "challenges_completed": 2,
    "posts_count": 25,
    "comments_count": 40,
    "followers_count": 12,
    "following_count": 8,
    "badges": [
      {
        "id": "uuid",
        "name": "First Post",
        "description": "Created your first post",
        "icon_url": "https://example.com/badge.png",
        "rarity": "common",
        "earned_at": "2023-01-01T00:00:00Z"
      }
    ],
    "recent_projects": [
      {
        "id": "uuid",
        "title": "My Awesome Project",
        "description": "A project I'm working on",
        "tags": ["react", "typescript"],
        "status": "in_progress",
        "difficulty_level": "intermediate",
        "thumbnail_url": "https://example.com/thumbnail.jpg",
        "created_at": "2023-01-01T00:00:00Z",
        "like_count": 5,
        "view_count": 20
      }
    ],
    "is_following": false
  }
}
```

#### Update User Profile

```
PUT /users/profile
```

**Request Body:**

```json
{
  "display_name": "John Smith",
  "bio": "Senior hobbyist developer",
  "skills": ["programming", "design", "devops"],
  "portfolio_links": [
    "https://github.com/johndoe",
    "https://linkedin.com/in/johndoe"
  ],
  "notification_preferences": {
    "email_notifications": true,
    "push_notifications": true,
    "squad_updates": true,
    "project_updates": true,
    "challenge_updates": true,
    "achievement_updates": true
  },
  "privacy_settings": {
    "profile_visibility": "public",
    "email_visibility": "private",
    "project_visibility": "public"
  }
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    /* updated user object */
  }
}
```

#### Update Password

```
PUT /users/password
```

**Request Body:**

```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

#### Follow User

```
POST /users/:id/follow
```

**Response:**

```json
{
  "success": true,
  "message": "User followed successfully",
  "is_following": true
}
```

#### Unfollow User

```
DELETE /users/:id/follow
```

**Response:**

```json
{
  "success": true,
  "message": "User unfollowed successfully",
  "is_following": false
}
```

## Squads

#### List Squads

```
GET /squads
```

**Query Parameters:**

- `search` - Search term
- `tags` - Array of tags
- `privacy` - Privacy setting (public, private, invite_only)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "squads": [
    {
      "id": "uuid",
      "name": "React Developers",
      "description": "A squad for React enthusiasts",
      "tags": ["react", "javascript", "frontend"],
      "privacy": "public",
      "avatar_url": "https://example.com/avatar.jpg",
      "member_count": 25,
      "created_by": "uuid",
      "created_at": "2023-01-01T00:00:00Z",
      "is_member": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Create Squad

```
POST /squads
```

**Request Body:**

```json
{
  "name": "My New Squad",
  "description": "A squad for my interests",
  "tags": ["hobby", "interest"],
  "privacy": "public",
  "avatar_url": "https://example.com/avatar.jpg",
  "banner_url": "https://example.com/banner.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "squad": {
    /* squad object */
  }
}
```

#### Get Squad Details

```
GET /squads/:id
```

**Response:**

```json
{
  "success": true,
  "squad": {
    "id": "uuid",
    "name": "React Developers",
    "description": "A squad for React enthusiasts",
    "tags": ["react", "javascript", "frontend"],
    "privacy": "public",
    "avatar_url": "https://example.com/avatar.jpg",
    "banner_url": "https://example.com/banner.jpg",
    "member_count": 25,
    "created_by": "uuid",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "creator_name": "John Doe",
    "creator_avatar": "https://example.com/avatar.jpg",
    "is_member": true,
    "member_role": "admin",
    "threads": [
      {
        "id": "uuid",
        "squad_id": "uuid",
        "title": "Getting Started with React Hooks",
        "description": "Discussion about React Hooks",
        "type": "tutorials",
        "is_pinned": false,
        "created_by": "uuid",
        "creator_name": "Jane Smith",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z",
        "post_count": 12
      }
    ],
    "recent_posts": [
      {
        "id": "uuid",
        "squad_id": "uuid",
        "thread_id": "uuid",
        "user_id": "uuid",
        "content": "This is a great discussion!",
        "attachments": [],
        "helpful_votes": 3,
        "reply_count": 2,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z",
        "user_name": "John Doe",
        "user_avatar": "https://example.com/avatar.jpg",
        "thread_title": "Getting Started with React Hooks"
      }
    ],
    "members": [
      {
        "id": "uuid",
        "display_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "admin",
        "joined_at": "2023-01-01T00:00:00Z"
      }
    ],
    "members_count": 25,
    "online_count": 5
  }
}
```

#### Update Squad

```
PUT /squads/:id
```

**Request Body:**

```json
{
  "name": "Updated Squad Name",
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "privacy": "private",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "squad": {
    /* updated squad object */
  }
}
```

#### Delete Squad

```
DELETE /squads/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Squad deleted successfully"
}
```

#### Join Squad

```
POST /squads/:id/join
```

**Request Body:**

```json
{
  "message": "I'd like to join this squad"
}
```

**Response:**

```json
{
  "success": true,
  "member": {
    /* member object */
  },
  "message": "Successfully joined squad"
}
```

#### Leave Squad

```
POST /squads/:id/leave
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully left squad"
}
```

#### Create Squad Thread

```
POST /squads/:id/threads
```

**Request Body:**

```json
{
  "title": "New Discussion Thread",
  "description": "Description of the thread",
  "type": "general"
}
```

**Response:**

```json
{
  "success": true,
  "thread": {
    /* thread object */
  }
}
```

#### Create Squad Post

```
POST /squads/:id/posts
```

**Request Body:**

```json
{
  "content": "This is my post content",
  "thread_id": "uuid", // Optional
  "attachments": ["https://example.com/image.jpg"]
}
```

**Response:**

```json
{
  "success": true,
  "post": {
    /* post object */
  }
}
```

#### Create Squad Comment

```
POST /squads/:id/posts/:postId/comments
```

**Request Body:**

```json
{
  "content": "This is my comment",
  "parent_comment_id": "uuid" // Optional, for replies
}
```

**Response:**

```json
{
  "success": true,
  "comment": {
    /* comment object */
  }
}
```

#### Vote on Post/Comment

```
POST /squads/posts/:id/vote
POST /squads/comments/:id/vote
```

**Response:**

```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "votes": 5
}
```

## Projects

#### List Projects

```
GET /projects
```

**Query Parameters:**

- `search` - Search term
- `tags` - Array of tags
- `status` - Project status
- `difficulty` - Difficulty level
- `visibility` - Visibility setting
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "projects": [
    {
      "id": "uuid",
      "title": "My Awesome Project",
      "description": "A project I'm working on",
      "tags": ["react", "typescript"],
      "squad_id": "uuid",
      "created_by": "uuid",
      "collaborators": ["uuid1", "uuid2"],
      "status": "in_progress",
      "visibility": "public",
      "difficulty_level": "intermediate",
      "estimated_hours": 40,
      "actual_hours": 25,
      "thumbnail_url": "https://example.com/thumbnail.jpg",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "like_count": 5,
      "is_liked": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Create Project

```
POST /projects
```

**Request Body:**

```json
{
  "title": "My New Project",
  "description": "Description of my project",
  "tags": ["react", "typescript"],
  "squad_id": "uuid", // Optional
  "visibility": "public",
  "difficulty_level": "intermediate",
  "estimated_hours": 40,
  "thumbnail_url": "https://example.com/thumbnail.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "project": {
    /* project object */
  }
}
```

#### Get Project Details

```
GET /projects/:id
```

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "title": "My Awesome Project",
    "description": "A project I'm working on",
    "tags": ["react", "typescript"],
    "squad_id": "uuid",
    "created_by": "uuid",
    "collaborators": [
      {
        "id": "uuid",
        "display_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      }
    ],
    "status": "in_progress",
    "visibility": "public",
    "difficulty_level": "intermediate",
    "estimated_hours": 40,
    "actual_hours": 25,
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "creator_name": "John Doe",
    "creator_avatar": "https://example.com/avatar.jpg",
    "creator_bio": "Hobbyist developer",
    "like_count": 5,
    "is_liked": true,
    "files": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "filename": "screenshot.png",
        "file_url": "https://example.com/screenshot.png",
        "file_type": "image/png",
        "file_size": 1024000,
        "description": "Project screenshot",
        "uploaded_by": "uuid",
        "uploaded_at": "2023-01-01T00:00:00Z"
      }
    ],
    "updates": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "user_id": "uuid",
        "title": "Progress Update",
        "content": "Made good progress today",
        "attachments": ["https://example.com/update.jpg"],
        "progress_percentage": 60,
        "hours_logged": 2,
        "created_at": "2023-01-01T00:00:00Z",
        "user_name": "John Doe",
        "user_avatar": "https://example.com/avatar.jpg"
      }
    ]
  }
}
```

#### Update Project

```
PUT /projects/:id
```

**Request Body:**

```json
{
  "title": "Updated Project Title",
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "status": "completed",
  "visibility": "private",
  "difficulty_level": "advanced",
  "estimated_hours": 50,
  "actual_hours": 45,
  "thumbnail_url": "https://example.com/new-thumbnail.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "project": {
    /* updated project object */
  }
}
```

#### Delete Project

```
DELETE /projects/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

#### Add File to Project

```
POST /projects/:id/files
```

**Request Body:**

```json
{
  "filename": "screenshot.png",
  "file_url": "https://example.com/screenshot.png",
  "file_type": "image/png",
  "file_size": 1024000,
  "description": "Project screenshot"
}
```

**Response:**

```json
{
  "success": true,
  "file": {
    /* file object */
  }
}
```

#### Delete Project File

```
DELETE /projects/:id/files/:fileId
```

**Response:**

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### Add Project Update

```
POST /projects/:id/updates
```

**Request Body:**

```json
{
  "title": "Progress Update",
  "content": "Made good progress today",
  "attachments": ["https://example.com/update.jpg"],
  "progress_percentage": 60,
  "hours_logged": 2
}
```

**Response:**

```json
{
  "success": true,
  "update": {
    /* update object */
  }
}
```

#### Like/Unlike Project

```
POST /projects/:id/like
```

**Response:**

```json
{
  "success": true,
  "message": "Project liked successfully",
  "liked": true
}
```

## Challenges

#### List Challenges

```
GET /challenges
```

**Query Parameters:**

- `search` - Search term
- `tags` - Array of tags
- `difficulty` - Difficulty level
- `status` - Challenge status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "challenges": [
    {
      "id": "uuid",
      "title": "Build a React Component",
      "description": "Create a reusable React component",
      "tags": ["react", "javascript"],
      "difficulty_level": "intermediate",
      "points_reward": 100,
      "badge_reward": "React Master",
      "start_date": "2023-01-01T00:00:00Z",
      "end_date": "2023-01-31T00:00:00Z",
      "max_participants": 100,
      "current_participants": 25,
      "requirements": ["React knowledge", "CSS skills"],
      "submission_guidelines": "Submit your component code",
      "status": "active",
      "created_by": "uuid",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "has_submitted": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

#### Create Challenge

```
POST /challenges
```

**Request Body:**

```json
{
  "title": "New Challenge",
  "description": "Description of the challenge",
  "tags": ["challenge", "skill"],
  "difficulty_level": "intermediate",
  "points_reward": 150,
  "badge_reward": "Challenge Master",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-01-31T00:00:00Z",
  "max_participants": 50,
  "requirements": ["Skill 1", "Skill 2"],
  "submission_guidelines": "How to submit"
}
```

**Response:**

```json
{
  "success": true,
  "challenge": {
    /* challenge object */
  }
}
```

#### Get Challenge Details

```
GET /challenges/:id
```

**Response:**

```json
{
  "success": true,
  "challenge": {
    "id": "uuid",
    "title": "Build a React Component",
    "description": "Create a reusable React component",
    "tags": ["react", "javascript"],
    "difficulty_level": "intermediate",
    "points_reward": 100,
    "badge_reward": "React Master",
    "start_date": "2023-01-01T00:00:00Z",
    "end_date": "2023-01-31T00:00:00Z",
    "max_participants": 100,
    "current_participants": 25,
    "requirements": ["React knowledge", "CSS skills"],
    "submission_guidelines": "Submit your component code",
    "status": "active",
    "created_by": "uuid",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "creator_name": "John Doe",
    "creator_avatar": "https://example.com/avatar.jpg",
    "submission_count": 12,
    "user_submission": {
      "id": "uuid",
      "challenge_id": "uuid",
      "user_id": "uuid",
      "title": "My Submission",
      "description": "My solution",
      "submission_files": ["https://example.com/code.zip"],
      "github_url": "https://github.com/user/project",
      "live_demo_url": "https://example.com/demo",
      "submitted_at": "2023-01-15T00:00:00Z",
      "status": "submitted",
      "feedback": null,
      "points_awarded": 0
    }
  }
}
```

#### Update Challenge

```
PUT /challenges/:id
```

**Request Body:**

```json
{
  "title": "Updated Challenge Title",
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "difficulty_level": "advanced",
  "points_reward": 200,
  "badge_reward": "Advanced Challenge Master",
  "start_date": "2023-02-01T00:00:00Z",
  "end_date": "2023-02-28T00:00:00Z",
  "max_participants": 75,
  "requirements": ["Advanced Skill 1", "Advanced Skill 2"],
  "submission_guidelines": "Updated submission guidelines"
}
```

**Response:**

```json
{
  "success": true,
  "challenge": {
    /* updated challenge object */
  }
}
```

#### Delete Challenge

```
DELETE /challenges/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Challenge deleted successfully"
}
```

#### Submit to Challenge

```
POST /challenges/:id/submit
```

**Request Body:**

```json
{
  "title": "My Submission",
  "description": "My solution to the challenge",
  "submission_files": ["https://example.com/code.zip"],
  "github_url": "https://github.com/user/project",
  "live_demo_url": "https://example.com/demo"
}
```

**Response:**

```json
{
  "success": true,
  "submission": {
    /* submission object */
  }
}
```

#### Get Challenge Submissions (Creator Only)

```
GET /challenges/:id/submissions
```

**Query Parameters:**

- `status` - Filter by status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "submissions": [
    {
      "id": "uuid",
      "challenge_id": "uuid",
      "user_id": "uuid",
      "title": "My Submission",
      "description": "My solution",
      "submission_files": ["https://example.com/code.zip"],
      "github_url": "https://github.com/user/project",
      "live_demo_url": "https://example.com/demo",
      "submitted_at": "2023-01-15T00:00:00Z",
      "status": "submitted",
      "feedback": null,
      "points_awarded": 0,
      "user_name": "John Doe",
      "user_avatar": "https://example.com/avatar.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

#### Review Challenge Submission (Creator Only)

```
PUT /challenges/:id/submissions/:submissionId/review
```

**Request Body:**

```json
{
  "status": "approved", // or "rejected"
  "feedback": "Great work!",
  "points_awarded": 100
}
```

**Response:**

```json
{
  "success": true,
  "submission": {
    /* updated submission object */
  }
}
```

#### Get User's Challenge Submissions

```
GET /challenges/my-submissions
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "submissions": [
    {
      "id": "uuid",
      "challenge_id": "uuid",
      "user_id": "uuid",
      "title": "My Submission",
      "description": "My solution",
      "submission_files": ["https://example.com/code.zip"],
      "github_url": "https://github.com/user/project",
      "live_demo_url": "https://example.com/demo",
      "submitted_at": "2023-01-15T00:00:00Z",
      "status": "approved",
      "feedback": "Great work!",
      "points_awarded": 100,
      "challenge_title": "Build a React Component",
      "challenge_difficulty": "intermediate"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

## Badges

#### List Badges

```
GET /badges
```

**Query Parameters:**

- `rarity` - Filter by rarity
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "badges": [
    {
      "id": "uuid",
      "name": "First Post",
      "description": "Created your first post",
      "icon_url": "https://example.com/badge.png",
      "criteria": {
        /* criteria object */
      },
      "points_required": 0,
      "rarity": "common",
      "created_at": "2023-01-01T00:00:00Z",
      "earned_count": 125
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

#### Get Badge Details

```
GET /badges/:id
```

**Response:**

```json
{
  "success": true,
  "badge": {
    "id": "uuid",
    "name": "First Post",
    "description": "Created your first post",
    "icon_url": "https://example.com/badge.png",
    "criteria": {
      /* criteria object */
    },
    "points_required": 0,
    "rarity": "common",
    "created_at": "2023-01-01T00:00:00Z",
    "earned_count": 125,
    "recent_earners": [
      {
        "id": "uuid",
        "display_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "earned_at": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### Get User's Badges

```
GET /badges/user/:userId
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "badges": [
    {
      "id": "uuid",
      "name": "First Post",
      "description": "Created your first post",
      "icon_url": "https://example.com/badge.png",
      "rarity": "common",
      "earned_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 7,
    "pages": 1
  }
}
```

## Leaderboards

#### Global Leaderboard

```
GET /leaderboards/global
```

**Query Parameters:**

- `timeframe` - Filter by timeframe (all, week, month, year)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "leaderboard": [
    {
      "id": "uuid",
      "display_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "total_points": 1500,
      "level": 15,
      "activities_count": 45,
      "rank": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

#### Squad Leaderboard

```
GET /leaderboards/squad/:id
```

**Query Parameters:**

- `timeframe` - Filter by timeframe (all, week, month, year)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "leaderboard": [
    {
      "id": "uuid",
      "display_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "contribution_points": 500,
      "activities_count": 25,
      "rank": 1
    }
  ],
  "squad": {
    "id": "uuid",
    "name": "React Developers",
    "privacy": "public"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

## Notifications

#### List Notifications

```
GET /notifications
```

**Query Parameters:**

- `read` - Filter by read status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "New Message",
      "message": "John Doe sent you a message",
      "type": "chat_message",
      "data": {
        /* additional data */
      },
      "read": false,
      "action_url": "/chat/uuid",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

#### Get Unread Notification Count

```
GET /notifications/unread-count
```

**Response:**

```json
{
  "success": true,
  "unread_count": 3
}
```

#### Mark Notification as Read

```
PUT /notifications/:id/read
```

**Response:**

```json
{
  "success": true,
  "notification": {
    /* updated notification object */
  }
}
```

#### Mark Multiple Notifications as Read

```
PUT /notifications/read-bulk
```

**Request Body:**

```json
{
  "notificationIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**

```json
{
  "success": true,
  "updated_count": 3
}
```

#### Mark All Notifications as Read

```
PUT /notifications/read-all
```

**Response:**

```json
{
  "success": true,
  "updated_count": 5
}
```

#### Delete Notification

```
DELETE /notifications/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    /* optional details */
  }
}
```

Common HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Rate Limiting

API requests are rate-limited to 100 requests per 15 minutes per IP address.

## WebSockets

The Hobbyverse platform uses WebSockets for real-time features. Connect to:

```
ws://localhost:3000
```

### Authentication

Pass the JWT token during connection:

```javascript
const socket = io("http://localhost:3000", {
  auth: {
    token: "your-jwt-token",
  },
});
```

### Events

#### Join Squad Room

```javascript
socket.emit("join_squad", squadId);
```

#### Leave Squad Room

```javascript
socket.emit("leave_squad", squadId);
```

#### Send Chat Message

```javascript
socket.emit("send_message", {
  squadId: "uuid",
  message: "Hello everyone!",
  messageType: "text",
  attachments: ["https://example.com/image.jpg"],
});
```

#### Typing Indicators

```javascript
// Start typing
socket.emit("typing_start", squadId);

// Stop typing
socket.emit("typing_stop", squadId);
```

#### Subscribe to Notifications

```javascript
socket.emit("subscribe_notifications");
```

#### Subscribe to Project Updates

```javascript
socket.emit("subscribe_project", projectId);
```

#### Subscribe to Challenge Updates

```javascript
socket.emit("subscribe_challenge", challengeId);
```

#### Incoming Events

- `new_message`: New chat message
- `user_typing`: User started typing
- `user_stopped_typing`: User stopped typing
- `current_typing_users`: Current users typing
- `user_online`: User came online
- `user_offline`: User went offline
- `new_notification`: New notification
- `project_update`: Project update
- `challenge_update`: Challenge update
- `squad_update`: Squad update
- `error`: Error message

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
