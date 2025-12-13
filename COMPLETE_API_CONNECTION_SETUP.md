# Complete API Connection Setup Guide for Frontend

## 🚀 Quick Configuration

**Base URL:** `http://localhost:5001/api/v1`  
**WebSocket URL:** `ws://localhost:5001`  
**Health Check:** `GET http://localhost:5001/api/health`

**CORS:** Configured for `http://localhost:5173` with credentials enabled

---

## 📦 Step 1: Environment Variables Setup

Create a `.env` file in your frontend root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_WS_URL=ws://localhost:5001

# For production, update these:
# VITE_API_BASE_URL=https://your-api-domain.com/api/v1
# VITE_WS_URL=wss://your-api-domain.com
```

---

## 🔧 Step 2: API Client Setup (Using Axios - Recommended)

### 2.1 Install Axios

```bash
npm install axios
# or
yarn add axios
```

### 2.2 Create API Client Configuration

Create `src/utils/api.js` or `src/services/api.js`:

```javascript
import axios from 'axios';

// Get base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        
        // Store new token
        localStorage.setItem('accessToken', accessToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 Step 3: Authentication Service

Create `src/services/authService.js`:

```javascript
import api from '../utils/api';

export const authService = {
  // Register User (Customer or Vendor)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // Store tokens
    if (response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Refresh Token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    
    if (response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset Password
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('accessToken');
  },
};
```

---

## 📝 Step 4: Example Usage in Components

### 4.1 Customer Registration Example

```javascript
import { authService } from '../services/authService';
import { useState } from 'react';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Customer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.register(formData);

      if (response.success) {
        // Check if it's vendor registration (has application field)
        if (response.data.application) {
          // Vendor registration - no tokens, show approval message
          setSuccess(
            'Vendor application submitted! Please wait for admin approval before you can login.'
          );
          // Redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        } else if (response.data.user) {
          // Customer registration - has tokens, auto-login
          setSuccess('Registration successful! Redirecting...');
          // Tokens are stored in authService.login, but register doesn't return tokens
          // So we need to login after registration for customers
          const loginResponse = await authService.login({
            email: formData.email,
            password: formData.password,
          });
          
          if (loginResponse.success) {
            window.location.href = '/dashboard';
          }
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

### 4.2 Vendor Registration Example

```javascript
import { authService } from '../services/authService';
import { useState } from 'react';

function VendorRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Vendor',
    businessName: '',
    businessAddress: '',
    businessLicense: '',
    storeName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(formData);

      if (response.success && response.data.application) {
        // Vendor registration successful
        alert(
          'Your vendor application has been submitted successfully. ' +
          'Please wait for admin approval before you can login. ' +
          'You will receive an email notification once approved.'
        );
        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields including vendor-specific fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting Application...' : 'Submit Application'}
      </button>
    </form>
  );
}
```

### 4.3 Login Example

```javascript
import { authService } from '../services/authService';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);

      if (response.success) {
        // Redirect based on user role
        const userRole = response.data.data.user.role;
        
        if (userRole === 'Admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'Vendor') {
          navigate('/vendor/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      // Check if it might be a pending vendor application
      if (err.response?.status === 401) {
        setError(
          'Invalid credentials. If you registered as a vendor, ' +
          'please wait for admin approval before logging in.'
        );
      } else {
        setError(
          err.response?.data?.message || 
          err.response?.data?.error || 
          'Login failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={credentials.email}
        onChange={(e) =>
          setCredentials({ ...credentials, email: e.target.value })
        }
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({ ...credentials, password: e.target.value })
        }
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## 🛡️ Step 5: Protected Route Setup

Create `src/components/ProtectedRoute.jsx`:

```javascript
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

function ProtectedRoute({ children, requiredRole = null }) {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role is required, check it from localStorage or API
  // You might want to store user role in localStorage or fetch it
  // For now, this is a basic example
  
  return children;
}

export default ProtectedRoute;
```

Usage in routes:

```javascript
import ProtectedRoute from './components/ProtectedRoute';

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## 📡 Step 6: API Service Examples

Create `src/services/apiService.js` for other API calls:

```javascript
import api from '../utils/api';

export const apiService = {
  // User Profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  // Products
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addToCart: async (productId, quantity) => {
    const response = await api.post('/cart/add', {
      productId,
      quantity,
    });
    return response.data;
  },

  // Orders
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Add more API methods as needed...
};
```

---

## 🔄 Step 7: Error Handling Utility

Create `src/utils/errorHandler.js`:

```javascript
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred';

    switch (status) {
      case 400:
        return { message, type: 'validation' };
      case 401:
        return { message: 'Unauthorized. Please login again.', type: 'auth' };
      case 403:
        return { message: 'You do not have permission to perform this action.', type: 'permission' };
      case 404:
        return { message: 'Resource not found.', type: 'notFound' };
      case 500:
        return { message: 'Server error. Please try again later.', type: 'server' };
      default:
        return { message, type: 'unknown' };
    }
  } else if (error.request) {
    // Request made but no response
    return { 
      message: 'No response from server. Please check your connection.', 
      type: 'network' 
    };
  } else {
    // Error setting up request
    return { 
      message: error.message || 'An unexpected error occurred.', 
      type: 'unknown' 
    };
  }
};

// Usage in components:
// try {
//   await apiService.someMethod();
// } catch (error) {
//   const { message, type } = handleApiError(error);
//   setError(message);
// }
```

---

## 🔌 Step 8: WebSocket Setup (Socket.IO)

Install Socket.IO client:

```bash
npm install socket.io-client
```

Create `src/services/socketService.js`:

```javascript
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';

let socket = null;

export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    auth: {
      token: token, // Send token for authentication
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Usage example for notifications:
export const setupNotificationListener = (callback) => {
  if (!socket) return;

  socket.on('notification', (data) => {
    callback(data);
  });

  // Listen for vendor approval
  socket.on('vendor_approval', (data) => {
    if (data.status === 'approved') {
      callback({
        type: 'success',
        message: 'Your vendor application has been approved! You can now access vendor features.',
      });
    } else if (data.status === 'rejected') {
      callback({
        type: 'error',
        message: `Your vendor application was rejected. Reason: ${data.reason || 'N/A'}`,
      });
    }
  });
};
```

Usage in your app:

```javascript
import { initializeSocket, setupNotificationListener } from './services/socketService';
import { authService } from './services/authService';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const token = authService.getToken();
    
    if (token) {
      const socket = initializeSocket(token);
      
      setupNotificationListener((notification) => {
        // Show notification to user
        console.log('Notification received:', notification);
        // You can use a toast library here
      });
    }

    return () => {
      // Cleanup on unmount
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return <div>Your App</div>;
}
```

---

## ✅ Step 9: Complete File Structure

```
src/
├── services/
│   ├── api.js              # Axios configuration
│   ├── authService.js      # Authentication methods
│   ├── apiService.js       # General API methods
│   └── socketService.js    # WebSocket setup
├── utils/
│   └── errorHandler.js     # Error handling utility
├── components/
│   └── ProtectedRoute.jsx  # Protected route wrapper
├── .env                    # Environment variables
└── ...
```

---

## 🧪 Step 10: Testing Connection

Create a test component or add to your app:

```javascript
import { useEffect, useState } from 'react';
import api from './services/api';

function HealthCheck() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Health check doesn't require auth
        const response = await fetch('http://localhost:5001/api/health');
        const data = await response.json();
        setStatus(data.status || 'connected');
      } catch (error) {
        setStatus('disconnected');
        console.error('Health check failed:', error);
      }
    };

    checkHealth();
  }, []);

  return <div>API Status: {status}</div>;
}
```

---

## 📋 Summary Checklist

- [ ] Create `.env` file with `VITE_API_BASE_URL` and `VITE_WS_URL`
- [ ] Install axios: `npm install axios`
- [ ] Create `src/utils/api.js` with axios configuration
- [ ] Create `src/services/authService.js` for authentication
- [ ] Create `src/services/apiService.js` for other API calls
- [ ] Create `src/utils/errorHandler.js` for error handling
- [ ] Create `src/components/ProtectedRoute.jsx` for protected routes
- [ ] Install socket.io-client: `npm install socket.io-client`
- [ ] Create `src/services/socketService.js` for WebSocket
- [ ] Update registration components to handle vendor vs customer responses
- [ ] Test API connection with health check
- [ ] Test authentication flow (register/login/logout)
- [ ] Test protected routes

---

## 🚨 Important Notes

1. **Vendor Registration**: Returns `application` object, NOT `user` + tokens. Don't try to auto-login vendors.

2. **CORS**: Make sure your frontend is running on `http://localhost:5173` (Vite default) or update backend CORS settings.

3. **Tokens**: Store tokens in localStorage. The axios interceptor automatically adds them to requests.

4. **Token Refresh**: The axios interceptor handles automatic token refresh on 401 errors.

5. **Credentials**: Always use `withCredentials: true` for CORS with credentials.

---

**Need Help?** Refer to `FRONTEND_API_COMPLETE_GUIDE.md` for detailed API endpoint documentation.
