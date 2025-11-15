# Login System Guide

## Overview

The login system provides secure authentication for the admin dashboard. Users must log in to access protected routes, and the authentication token is automatically sent with every API request.

## Features

### ✅ Authentication Flow
- Login page with email/password
- Token-based authentication
- Protected routes (require authentication)
- Automatic token validation
- Logout functionality
- 401 error handling (auto-redirect to login)

### ✅ Token Management
- Token stored in localStorage
- Token automatically sent with every API request
- Token validation on route access
- Automatic token cleanup on logout
- 401 response handling (token expiration)

### ✅ User Management
- User information stored in localStorage
- User profile display in header
- User menu with logout option
- Profile settings link

## Implementation

### 1. Login Page (`src/pages/Login.jsx`)

The login page provides a clean, modern interface for user authentication.

**Features:**
- Email and password fields
- Show/hide password toggle
- Loading state during login
- Error message display
- Form validation
- Auto-redirect if already authenticated
- Redirect to dashboard after successful login

**API Endpoint:**
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: object }
```

### 2. Protected Routes (`src/components/ProtectedRoute/ProtectedRoute.jsx`)

Protected routes ensure that only authenticated users can access certain pages.

**Features:**
- Token validation
- Loading state during auth check
- Automatic redirect to login if not authenticated
- Preserves return URL for redirect after login

**Usage:**
```jsx
<ProtectedRoute>
  <Layout>
    <Dashboard />
  </Layout>
</ProtectedRoute>
```

### 3. API Client (`src/services/api.js`)

The API client automatically includes the authentication token in every request.

**Features:**
- Token automatically added to Authorization header
- 401 error handling (auto-redirect to login)
- Token cleanup on 401 response
- Supports all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- File upload support

**Token Header:**
```javascript
Authorization: Bearer {token}
```

### 4. Auth Service (`src/services/authService.js`)

The auth service provides methods for authentication operations.

**Methods:**
- `login(credentials)` - Login user and store token
- `logout()` - Clear auth data and logout
- `getCurrentUser()` - Get current user from API
- `getUserId()` - Get stored user ID
- `getUser()` - Get stored user object
- `isAuthenticated()` - Check if user is authenticated

**Token Storage:**
- `authToken` - JWT token
- `userId` - User ID
- `user` - User object (JSON)

### 5. Header Component (`src/components/Header/Header.jsx`)

The header displays user information and provides logout functionality.

**Features:**
- User avatar (image or initials)
- User name display
- User menu dropdown
- Profile settings link
- Logout button

## Usage

### Login Flow

1. **User visits protected route:**
   - ProtectedRoute checks authentication
   - If not authenticated, redirects to `/login`

2. **User enters credentials:**
   - Email and password
   - Clicks "Sign In" button

3. **Login API call:**
   - POST `/api/auth/login`
   - Token and user info returned

4. **Token storage:**
   - Token stored in localStorage
   - User ID stored in localStorage
   - User object stored in localStorage

5. **Redirect to dashboard:**
   - User redirected to dashboard
   - Or to previous page (if redirected from protected route)

### Logout Flow

1. **User clicks logout:**
   - Header user menu → Logout

2. **Auth cleanup:**
   - Token removed from localStorage
   - User ID removed from localStorage
   - User object removed from localStorage
   - FCM token removed from localStorage

3. **Redirect to login:**
   - User redirected to `/login` page

### Token Usage

The token is automatically sent with every API request:

```javascript
// API Client automatically adds token
const response = await apiClient.get('/api/admin/users');
// Header: Authorization: Bearer {token}
```

### 401 Error Handling

When a 401 (Unauthorized) response is received:

1. **Token cleared:**
   - Auth token removed from localStorage
   - User ID removed from localStorage
   - User object removed from localStorage

2. **Redirect to login:**
   - User redirected to `/login` page
   - (Only if not already on login page)

3. **Error thrown:**
   - Error message: "Unauthorized. Please login again."

## API Integration

### Login Endpoint

**Request:**
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response Formats (handled):**
```javascript
// Format 1
{
  "token": "jwt-token-here",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "fullName": "User Name"
  }
}

// Format 2
{
  "data": {
    "token": "jwt-token-here",
    "user": {
      "userId": 1,
      "email": "user@example.com"
    }
  }
}

// Format 3
{
  "accessToken": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Get Current User Endpoint

**Request:**
```javascript
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  "userId": 1,
  "email": "user@example.com",
  "fullName": "User Name",
  "roles": ["Admin"]
}
```

## Configuration

### Environment Variables

```env
# API Base URL
VITE_API_BASE_URL=https://alhal.awnak.net
```

### Routes

**Public Routes:**
- `/login` - Login page

**Protected Routes:**
- `/` - Redirects to `/dashboard`
- `/dashboard` - Dashboard page
- `/users` - Users management
- `/analytics` - Analytics page
- `/products` - Products management
- `/categories` - Categories management
- `/orders` - Orders page
- `/settings` - Settings page

## Security

### Token Storage
- Token stored in localStorage
- Token automatically included in API requests
- Token cleared on logout
- Token cleared on 401 response

### Token Validation
- Token validated on protected route access
- Token validated via `/api/auth/me` endpoint
- Invalid token triggers logout and redirect

### Password Security
- Password input type: `password`
- Show/hide password toggle
- Password not stored in localStorage
- Password sent securely over HTTPS

## Testing

### Test Login

1. **Navigate to login page:**
   ```
   http://localhost:3000/login
   ```

2. **Enter credentials:**
   - Email: `admin@example.com`
   - Password: `password123`

3. **Check token storage:**
   - Open browser console
   - Check localStorage for `authToken`
   - Check localStorage for `userId`
   - Check localStorage for `user`

4. **Verify redirect:**
   - Should redirect to `/dashboard`
   - Should show user name in header

### Test Protected Routes

1. **Access protected route without token:**
   - Clear localStorage
   - Navigate to `/dashboard`
   - Should redirect to `/login`

2. **Access protected route with token:**
   - Login first
   - Navigate to `/dashboard`
   - Should show dashboard

### Test Logout

1. **Click logout:**
   - Click user menu in header
   - Click "Logout"
   - Should redirect to `/login`
   - Should clear localStorage

### Test 401 Handling

1. **Simulate 401 response:**
   - Login first
   - Manually clear token from localStorage
   - Make API request
   - Should redirect to `/login`

## Troubleshooting

### Login Fails

**Issue:** Login button does nothing
- **Solution:** Check browser console for errors
- **Solution:** Verify API endpoint is correct
- **Solution:** Check network tab for API response

**Issue:** "Login failed" error
- **Solution:** Verify credentials are correct
- **Solution:** Check API response format
- **Solution:** Verify token is being returned

### Token Not Sent

**Issue:** API requests fail with 401
- **Solution:** Check if token is in localStorage
- **Solution:** Verify token is being added to headers
- **Solution:** Check API client configuration

### Redirect Issues

**Issue:** Not redirecting after login
- **Solution:** Check if token is stored
- **Solution:** Verify ProtectedRoute is working
- **Solution:** Check browser console for errors

**Issue:** Redirecting to login on every page
- **Solution:** Check if token is valid
- **Solution:** Verify `/api/auth/me` endpoint works
- **Solution:** Check token expiration

## Best Practices

### Token Management
- Store token securely in localStorage
- Clear token on logout
- Clear token on 401 response
- Validate token on route access

### Error Handling
- Handle login errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Handle network errors

### Security
- Use HTTPS in production
- Validate token on server
- Implement token expiration
- Implement refresh token (optional)

### User Experience
- Show loading states
- Provide clear error messages
- Redirect to previous page after login
- Remember user session

## Next Steps

### Recommended Enhancements
1. **Remember Me:** Store token in cookie with expiration
2. **Refresh Token:** Implement token refresh mechanism
3. **Password Reset:** Add password reset functionality
4. **Two-Factor Auth:** Add 2FA support
5. **Session Management:** Add session timeout
6. **Role-Based Access:** Implement role-based route protection

## Summary

The login system provides:
- ✅ Secure authentication
- ✅ Token-based authorization
- ✅ Protected routes
- ✅ Automatic token management
- ✅ 401 error handling
- ✅ User profile display
- ✅ Logout functionality

All API requests automatically include the authentication token, ensuring secure access to protected resources.

