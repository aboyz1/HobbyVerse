# Hobbyverse - Community-Driven Platform for Hobbyists

A fully virtual, community-driven platform for hobbyists to connect, share, collaborate, and participate in challenges.

## Project Structure

```
Hobbyverse/
├── frontend/          # React Native (Expo) mobile app
├── backend/           # Node.js/Express API server
├── database/          # PostgreSQL schema and migrations
├── docs/              # Documentation
└── docker-compose.yml # Development environment setup
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (recommended)
- Expo CLI

### Development Setup with Docker (Recommended)

1. **Clone and Setup**

   ```bash
   git clone <repository-url>
   cd Hobbyverse
   ```

2. **Start Development Environment**

   ```bash
   docker-compose up -d
   ```

3. **Access Services**
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Manual Setup

1. **Backend Setup**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   expo start
   ```

## Features

- 🔐 **Authentication**: Email/password + Google OAuth
- 👥 **Squads**: Hyper-specific interest groups with privacy controls
- 🚀 **Projects**: Collaborative project sharing with file uploads
- 🏆 **Challenges**: Weekly/monthly tasks with points and badges
- 🎮 **Gamification**: Points, badges, leaderboards, and levels
- 💬 **Real-time Chat**: WebSocket-based communication with typing indicators
- 📱 **Push Notifications**: Stay updated on activities
- 🔍 **Discovery**: AI-assisted recommendations and search
- 📊 **Analytics**: User activity and engagement tracking

## Tech Stack

### Frontend

- React Native with Expo
- TypeScript
- React Navigation
- Material Design 3 (MD3) components
- Socket.IO Client
- Axios for API requests

### Backend

- Node.js with Express
- TypeScript
- PostgreSQL with UUIDs
- Redis for caching and real-time data
- Socket.IO for real-time communication
- JWT for authentication
- Passport.js for OAuth
- Express Validator for input validation

### Database Schema

The database includes comprehensive tables for:

- Users and profiles
- Squads and memberships
- Discussion threads and posts
- Projects and project files
- Challenges and submissions
- Points and badges
- Notifications
- Chat messages
- User follows

### Real-time Features

- WebSocket-based chat with typing indicators
- Online user presence
- Real-time notifications
- Live updates for projects and challenges
- Squad activity feeds

## API Documentation

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Update password

### Squads

- `GET /api/squads` - List squads with filtering
- `POST /api/squads` - Create new squad
- `GET /api/squads/:id` - Get squad details
- `PUT /api/squads/:id` - Update squad
- `DELETE /api/squads/:id` - Delete squad
- `POST /api/squads/:id/join` - Join squad
- `POST /api/squads/:id/leave` - Leave squad

### Projects

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/files` - Add file to project
- `DELETE /api/projects/:id/files/:fileId` - Delete project file
- `POST /api/projects/:id/updates` - Add project update
- `POST /api/projects/:id/like` - Like/unlike project

### Challenges

- `GET /api/challenges` - List challenges
- `POST /api/challenges` - Create challenge
- `GET /api/challenges/:id` - Get challenge details
- `PUT /api/challenges/:id` - Update challenge
- `DELETE /api/challenges/:id` - Delete challenge
- `POST /api/challenges/:id/submit` - Submit to challenge
- `GET /api/challenges/:id/submissions` - Get challenge submissions
- `PUT /api/challenges/:id/submissions/:submissionId/review` - Review submission
- `GET /api/challenges/my-submissions` - Get user's submissions

### Badges

- `GET /api/badges` - List badges
- `GET /api/badges/:id` - Get badge details
- `GET /api/badges/user/:userId` - Get user's badges

### Leaderboards

- `GET /api/leaderboards/global` - Global leaderboard
- `GET /api/leaderboards/squad/:id` - Squad leaderboard

### Notifications

- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification read
- `PUT /api/notifications/read-bulk` - Mark multiple notifications read
- `PUT /api/notifications/read-all` - Mark all notifications read
- `DELETE /api/notifications/:id` - Delete notification

## Development Guidelines

### Code Structure

- Follow TypeScript best practices
- Use consistent naming conventions
- Implement proper error handling
- Write comprehensive tests
- Document complex logic

### Database Design

- Use UUIDs for all primary keys
- Implement proper indexing for performance
- Use foreign key constraints for data integrity
- Follow normalization principles

### Security

- Validate all user inputs
- Sanitize data before database insertion
- Use HTTPS in production
- Implement proper authentication and authorization
- Protect against common web vulnerabilities

## Deployment

### Production Considerations

- Use environment variables for configuration
- Implement proper logging
- Set up monitoring and alerting
- Configure backups for database
- Use CDN for static assets
- Implement rate limiting
- Set up SSL certificates

### Environment Variables

Create a `.env` file in the backend directory:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://your-frontend-url.com
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

MIT License

## Support

For support, email support@hobbyverse.app or join our Discord community.
