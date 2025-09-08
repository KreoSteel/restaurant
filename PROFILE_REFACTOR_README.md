# Profile Functionality Refactor

This document outlines the refactoring of the profile functionality to move it from frontend-only to a secure backend API with JWT authentication.

## Overview

The profile functionality has been refactored to:
- Move profile operations to the backend API
- Implement JWT token-based authentication
- Create a secure HTTP client on the frontend
- Ensure proper error handling and validation

## Backend Changes

### New Files Created

1. **`backend/src/middleware/auth.ts`** - JWT authentication middleware
2. **`backend/src/controllers/profile.ts`** - Profile controller with CRUD operations
3. **`backend/src/services/profile.ts`** - Profile service layer
4. **`backend/src/operations/profile.ts`** - Profile operations layer
5. **`backend/src/routes/profile.ts`** - Profile routes with authentication

### Modified Files

1. **`backend/src/api.ts`** - Added profile routes and CORS support
2. **`backend/src/utils/validate.ts`** - Added JWT_SECRET validation

## Frontend Changes

### New Files Created

1. **`frontend/app/utils/httpClient.ts`** - Axios HTTP client with JWT token handling
2. **`frontend/app/services/profileApi.ts`** - Profile API service

### Modified Files

1. **`frontend/app/routes/profile.tsx`** - Updated to use backend API instead of direct Supabase calls

## Security Features

### JWT Token Handling
- Tokens are automatically attached to all API requests
- Token expiration is handled gracefully
- Invalid tokens result in automatic logout and redirect

### Input Validation
- Server-side validation for all profile fields
- Email format validation
- Age range validation (16-100)
- Name length validation (2-100 characters)
- Required field validation

### Error Handling
- Comprehensive error messages
- Database constraint violation handling
- Network error handling
- User-friendly error display

## Environment Variables Required

### Backend (.env)
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
PUBLISH_KEY=your_supabase_anon_key_here
SECRET_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

## API Endpoints

### Profile Endpoints (All require JWT authentication)

- `GET /api/profile` - Get current user's profile
- `PATCH /api/profile` - Update current user's profile (creates if doesn't exist)

### Request/Response Format

#### Get Profile
```http
GET /api/profile
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "message": "Profile fetched successfully",
  "data": {
    "uuid": "user-uuid",
    "full_name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "is_featured": false,
    "role_id": 1,
    "location_id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Profile
```http
PATCH /api/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "is_featured": false,
  "role_id": 1,
  "location_id": 1
}
```

## Setup Instructions

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file with required environment variables (see above)

3. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Security Best Practices Implemented

1. **JWT Token Validation**: All profile endpoints require valid JWT tokens
2. **Input Sanitization**: All inputs are validated and sanitized
3. **Error Handling**: Comprehensive error handling without exposing sensitive information
4. **CORS Configuration**: Proper CORS setup for frontend-backend communication
5. **Token Storage**: JWT tokens are stored in localStorage (consider httpOnly cookies for production)
6. **Automatic Logout**: Expired or invalid tokens trigger automatic logout

## Database Schema Requirements

The implementation assumes the following database structure:

```sql
-- Employees table
CREATE TABLE employees (
  uuid TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  age INTEGER CHECK (age >= 16 AND age <= 100),
  email TEXT UNIQUE,
  password_hashed TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  role_id INTEGER REFERENCES role(id),
  location_id INTEGER REFERENCES restaurant_locations(id)
);
```

## Testing the Integration

1. Start both backend and frontend servers
2. Register/login a user through the frontend
3. Navigate to the profile page
4. Try updating profile information
5. Verify that changes are persisted and displayed correctly

## Notes

- The profile functionality now updates existing user data rather than creating new records
- JWT tokens are extracted from the Authorization header
- The system automatically creates a profile if one doesn't exist when updating
- All database operations use the user's UUID from the JWT token for security
