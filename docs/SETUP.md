# Hobbyverse Setup Instructions

This guide will help you set up the Hobbyverse mobile app for development.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Redis 6+ installed and running
- Expo CLI installed globally (`npm install -g @expo/cli`)
- Git for version control

## Project Structure

```
Hobbyverse/
├── backend/           # Node.js/Express API server
├── frontend/          # React Native (Expo) mobile app
├── database/          # PostgreSQL schema and seed data
├── docs/              # Documentation
├── docker-compose.yml # Development environment
└── README.md
```

## Quick Start with Docker (Recommended)

1. **Clone and setup**
   ```bash
   cd Hobbyverse
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

7. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

8. **Start the mobile app**
   ```bash
   npm start 
   ```

## Manual Setup (Without Docker)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Update database and Redis connection strings
   - Set JWT secret and other configuration

3. **Set up PostgreSQL**
   - Create a database named `hobbyverse`
   - Create a user with appropriate permissions
   - Update DATABASE_URL in `.env`

4. **Set up Redis**
   - Ensure Redis is running on localhost:6379
   - Update REDIS_URL in `.env` if needed

5. **Run migrations**
   ```bash
   npm run build
   npm run db:migrate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:3000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Expo development server**
   ```bash
   npm start
   ```

3. **Run on device/simulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Environment Configuration

### Backend (.env)
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://hobbyverse_user:hobbyverse_password@localhost:5432/hobbyverse

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# OAuth (optional for development)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Upload & Storage
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:id/follow` - Follow/unfollow user

### Squads (Placeholder)
- `GET /api/squads` - List squads
- `POST /api/squads` - Create squad
- `GET /api/squads/:id` - Get squad details

### Projects (Placeholder)
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details

### Challenges (Placeholder)
- `GET /api/challenges` - List challenges
- `GET /api/challenges/:id` - Get challenge details

## Testing the Setup

1. **Test backend health**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test user registration**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "display_name": "Test User"
     }'
   ```

3. **Test user login**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

## Development Workflow

1. **Backend development**
   - API runs on `http://localhost:3000`
   - Auto-reloads on file changes with nodemon
   - Database schema in `database/init.sql`
   - Seed data in `database/seed.sql`

2. **Frontend development**
   - Expo dev server typically on `http://localhost:19006`
   - Hot reload enabled
   - Use Expo Go app for testing on device

3. **Database changes**
   - Update `database/init.sql` for schema changes
   - Re-run migrations: `npm run db:migrate`

## Common Issues

1. **Database connection failed**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database and user exist

2. **Redis connection failed**
   - Ensure Redis is running
   - Check REDIS_URL in .env

3. **Expo app not loading**
   - Ensure phone and computer are on same network
   - Try restarting Expo dev server
   - Clear Expo cache: `expo start -c`

4. **Authentication not working**
   - Check JWT_SECRET is set in .env
   - Verify API_BASE_URL in frontend constants

## Next Steps

This is a foundational setup with:
- ✅ Complete authentication system
- ✅ User management
- ✅ Database schema with all required tables
- ✅ React Native app with navigation
- ✅ Real-time WebSocket setup

To complete the full application:
1. Implement remaining API endpoints (Squads, Projects, Challenges)
2. Build out frontend UI for each feature
3. Add file upload functionality
4. Implement push notifications
5. Add gamification features
6. Create comprehensive test suite

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoints at `http://localhost:3000/health`
3. Check console logs for detailed error messages
4. Ensure all services are running correctly