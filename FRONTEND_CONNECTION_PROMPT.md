# Backend Connection Guide for Frontend

## Backend API Configuration

**Base URL:** `http://localhost:5001/api/v1`

**CORS Configuration:**
- The backend is configured to accept requests from `http://localhost:5173` (default)
- Credentials are enabled
- Allowed methods: GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS
- Allowed headers: Content-Type, Authorization

## Authentication Flow

### 1. User Registration
**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "Customer" // Options: "Customer", "Vendor", "Admin"
}
```

**For Vendor Registration (additional fields required):**
```json
{
  "name": "John Doe",
  "email": "vendor@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "Vendor",
  "businessName": "My Business",
  "businessAddress": "123 Business St",
  "businessLicense": "LIC123456",
  "storeName": "My Store"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "Customer",
      "profilePicture": null,
      "isEmailVerified": false,
      "isPhoneVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

**Response (Error - 400/500):**
```json
{
  "success": false,
  "message": "Error message",
  "details": "Detailed error information (optional)"
}
```

### 2. User Login
**Endpoint:** `POST /api/v1/auth/login`

**Request Body (login with email OR phone):**
```json
{
  "email": "john@example.com", // OR "phone": "1234567890"
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "Customer",
      "profilePicture": null,
      "isEmailVerified": false,
      "isPhoneVerified": false,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### 3. Refresh Access Token
**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token_here"
  },
  "message": "Token refreshed successfully"
}
```

### 4. Logout
**Endpoint:** `POST /api/v1/auth/logout`

**Headers Required:**
```
Authorization: Bearer <accessToken>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 5. Forgot Password
**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com" // OR "phone": "1234567890"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "If the account exists, a password reset link has been sent",
  "resetToken": "token_here" // Only in development mode
}
```

### 6. Reset Password
**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_forgot_password",
  "newPassword": "newpassword123"
}
```

### 7. Verify Email
**Endpoint:** `POST /api/v1/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token"
}
```

### 8. Verify Phone
**Endpoint:** `POST /api/v1/auth/verify-phone`

**Headers Required:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "code": "verification_code"
}
```

## Token Management

### Access Token
- **Expiration:** 15 minutes (default)
- **Usage:** Include in Authorization header for protected routes
- **Format:** `Authorization: Bearer <accessToken>`

### Refresh Token
- **Expiration:** 7 days (default)
- **Usage:** Store securely (localStorage/sessionStorage/httpOnly cookie)
- **Purpose:** Get new access token when current one expires

### Token Storage Recommendations
1. Store `accessToken` in memory or secure storage (not localStorage for XSS protection)
2. Store `refreshToken` in httpOnly cookie (preferred) or secure storage
3. Implement automatic token refresh before expiration
4. Clear tokens on logout

## Protected Routes Authentication

All protected routes require the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

If token is expired, use the refresh endpoint to get a new access token.

## Available API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (protected)
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `POST /verify-email` - Verify email
- `POST /verify-phone` - Verify phone (protected)

### Users (`/api/v1/users`)
- Profile management endpoints (protected)

### Vendors (`/api/v1/vendors`)
- Vendor profile and management endpoints (protected)

### Products (`/api/v1/products`)
- Product CRUD operations (protected for vendors)

### Orders (`/api/v1/orders`)
- Order management endpoints (protected)

### Cart (`/api/v1/cart`)
- Shopping cart endpoints (protected)

### Addresses (`/api/v1/addresses`)
- Address management endpoints (protected)

### Reviews (`/api/v1/reviews`)
- Review endpoints (protected)

### Notifications (`/api/v1/notifications`)
- Notification endpoints (protected)

### Admin (`/api/v1/admin`)
- Admin-only endpoints (protected, Admin role required)

### Payments (`/api/v1/payments`)
- Payment processing endpoints (protected)

### Promo Codes (`/api/v1/promo-codes`)
- Promo code endpoints (protected)

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "details": "Detailed error (optional)"
}
```

## Error Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Socket.IO Configuration (Real-time Notifications)

**WebSocket URL:** `ws://localhost:5001`

The backend uses Socket.IO for real-time notifications. Connect using:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

// Connect with authentication token
socket.auth = { token: accessToken };

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345.67
}
```

## Implementation Checklist for Frontend

1. ✅ Create API service/utility with base URL configuration
2. ✅ Implement authentication service (register, login, logout, refresh)
3. ✅ Set up token storage and management
4. ✅ Create axios/fetch interceptor for automatic token attachment
5. ✅ Implement automatic token refresh on 401 errors
6. ✅ Set up error handling for API responses
7. ✅ Configure CORS-compatible request headers
8. ✅ Implement Socket.IO client for real-time notifications
9. ✅ Create type definitions/interfaces for API responses
10. ✅ Set up loading states and error states for API calls

## Example API Service Structure

```javascript
// api/config.js
export const API_BASE_URL = 'http://localhost:5001/api/v1';

// api/auth.js
export const authAPI = {
  register: (data) => fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', ... }),
  login: (data) => fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', ... }),
  // ... other auth methods
};

// api/client.js (with interceptors)
// Set up axios/fetch wrapper with automatic token injection
```

## Important Notes

1. **Password Requirements:** Minimum 6 characters
2. **Email Format:** Must be valid email format
3. **Phone:** Must be unique
4. **Roles:** Customer, Vendor, Admin
5. **Token Expiration:** Access tokens expire in 15 minutes, refresh tokens in 7 days
6. **Rate Limiting:** 120 requests per minute per IP
7. **Request Size Limit:** 1MB JSON payload limit
8. **Development Mode:** Reset tokens are returned in development mode only

## Environment Variables Needed (Frontend)

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_WS_URL=ws://localhost:5001
```

---

**Copy this entire document and paste it into your frontend chat to connect your frontend application to this backend API.**


