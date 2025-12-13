# Complete Backend API Guide for Frontend Integration

## 🚀 Quick Start

**Base URL:** `http://localhost:5001/api/v1`  
**WebSocket URL:** `ws://localhost:5001`  
**Health Check:** `GET http://localhost:5001/api/health`

**CORS:** Configured for `http://localhost:5173` with credentials enabled

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Vendor Management](#vendor-management)
4. [Products](#products)
5. [Cart](#cart)
6. [Orders](#orders)
7. [Addresses](#addresses)
8. [Reviews](#reviews)
9. [Notifications](#notifications)
10. [Payments](#payments)
11. [Promo Codes](#promo-codes)
12. [Admin](#admin)
13. [Socket.IO Setup](#socketio-setup)
14. [Error Handling](#error-handling)

---

## 🔐 Authentication

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "Customer"
}
```

**For Vendor Registration:**
```json
{
  "name": "Vendor Name",
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

**Response (Vendor Registration - DIFFERENT from Customer):**
```json
{
  "success": true,
  "data": {
    "application": {
      "_id": "application_id",
      "email": "vendor@example.com",
      "status": "pending"
    }
  },
  "message": "Vendor application submitted successfully. Please wait for admin approval before you can login."
}
```

**Response (Customer Registration - Normal):**
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
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

**⚠️ CRITICAL FRONTEND CHANGES REQUIRED:**

**Important Notes:**
- ⚠️ **Vendor registration does NOT create a User account immediately**
- ⚠️ **Vendor registration does NOT return tokens** - users cannot login until approved
- ⚠️ **Response structure is different** - returns `application` object instead of `user` + tokens
- Creates a `VendorApplication` document only (no User account yet)
- `User` account and `Vendor` document are created **ONLY** after admin approval
- Vendor cannot login until admin approves the application
- After approval, vendor can login with their email/phone and password
- Before approval, vendor cannot check status (no account exists to authenticate with)

---

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
OR
```json
{
  "phone": "1234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "accessToken": "token_here",
    "refreshToken": "refresh_token_here"
  },
  "message": "Login successful"
}
```

---

### Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token"
  },
  "message": "Token refreshed successfully"
}
```

---

### Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

---

### Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

---

### Verify Email
**POST** `/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token"
}
```

---

### Verify Phone
**POST** `/auth/verify-phone`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "code": "verification_code"
}
```

---

## 👤 User Profile

**Base:** `/users`  
**All routes require:** `Authorization: Bearer <accessToken>`

### Get Profile
**GET** `/users/profile`

**Response:**
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
      "profilePicture": "url_or_null",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Update Profile
**PUT** `/users/profile`

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* updated user object */ }
  },
  "message": "Profile updated successfully"
}
```

---

### Change Password
**PUT** `/users/password`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Upload Profile Picture
**POST** `/users/profile-picture`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image`: File (image file)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user with updated profilePicture */ }
  },
  "message": "Profile picture uploaded successfully"
}
```

---

### Delete Profile Picture
**DELETE** `/users/profile-picture`

**Response:**
```json
{
  "success": true,
  "message": "Profile picture deleted successfully"
}
```

---

## 🏪 Vendor Management

**Base:** `/vendors`  
**Note:** Pending vendors (Customers) can access profile routes

### Get Approval Status
**GET** `/vendors/pending-approval`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (If Approved - Vendor exists):**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "vendor_id",
      "userId": "user_id",
      "businessName": "My Business",
      "storeName": "My Store",
      "status": "active",
      "isActive": true,
      "approvedDate": "2024-01-01T00:00:00.000Z"
    },
    "application": null,
    "isApproved": true
  }
}
```

**Response (If Pending/Rejected - Application exists):**
```json
{
  "success": true,
  "data": {
    "application": {
      "_id": "application_id",
      "userId": "user_id",
      "businessName": "My Business",
      "businessAddress": "123 Business St",
      "businessLicense": "LIC123456",
      "storeName": "My Store",
      "status": "pending",
      "applicationDate": "2024-01-01T00:00:00.000Z",
      "reviewedDate": null,
      "rejectedReason": null
    },
    "vendor": null,
    "isApproved": false
  }
}
```

**Application Status values:** `pending`, `approved`, `rejected`  
**Vendor Status values:** `active`, `suspended` (only after approval)

**Important:** 
- Before approval: Returns `application` object (VendorApplication)
- After approval: Returns `vendor` object (Vendor document)
- `isApproved` flag indicates if vendor is approved

---

### Get Vendor Profile
**GET** `/vendors/profile`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "vendor_id",
      "userId": { /* user object */ },
      "businessName": "My Business",
      "businessAddress": "123 Business St",
      "businessLicense": "LIC123456",
      "storeName": "My Store",
      "status": "active",
      "isActive": true,
      "rating": 4.5,
      "totalOrders": 100,
      "totalRevenue": 50000
    }
  }
}
```

---

### Update Vendor Profile
**PUT** `/vendors/profile`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "businessName": "Updated Business Name",
  "businessAddress": "New Address",
  "storeName": "New Store Name"
}
```

---

### Get Public Vendor Info
**GET** `/vendors/:id`

**Public route** (no auth required)

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "vendor_id",
      "storeName": "My Store",
      "businessName": "My Business",
      "rating": 4.5,
      "totalOrders": 100
    }
  }
}
```

---

### Get Vendor Products
**GET** `/vendors/:id/products`

**Public route** (no auth required)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

---

## 🍜 Products

**Base:** `/products`

### Get All Products
**GET** `/products`

**Public route** (no auth required)

**Query Parameters:**
- `category` (optional): `Steamed`, `Fried`, `Special`, `Combo`
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `minRating` (optional): Minimum rating (0-5)
- `vendor` (optional): Vendor ID
- `search` (optional): Search term
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "vendorId": { /* vendor info */ },
        "name": "Product Name",
        "description": "Product description",
        "price": 100,
        "originalPrice": 120,
        "category": "Steamed",
        "image": "url",
        "images": ["url1", "url2"],
        "emoji": "🥟",
        "rating": 4.5,
        "reviewCount": 10,
        "isAvailable": true,
        "stock": 50,
        "variants": [
          {
            "name": "Small",
            "price": 80
          },
          {
            "name": "Large",
            "price": 120
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### Get Product by ID
**GET** `/products/:id`

**Public route** (no auth required)

---

### Create Product
**POST** `/products`

**Headers:** `Authorization: Bearer <accessToken>`  
**Requires:** Active vendor account

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 100,
  "originalPrice": 120,
  "category": "Steamed",
  "stock": 50,
  "variants": [
    {
      "name": "Small",
      "price": 80
    },
    {
      "name": "Large",
      "price": 120
    }
  ]
}
```

**Category values:** `Steamed`, `Fried`, `Special`, `Combo`

**Response:**
```json
{
  "success": true,
  "data": {
    "product": { /* created product */ }
  },
  "message": "Product created successfully"
}
```

---

### Update Product
**PUT** `/products/:id`

**Headers:** `Authorization: Bearer <accessToken>`  
**Requires:** Active vendor account (must own the product)

**Request Body:**
```json
{
  "name": "Updated Name",
  "price": 110,
  "isAvailable": true,
  "stock": 60
}
```

---

### Delete Product
**DELETE** `/products/:id`

**Headers:** `Authorization: Bearer <accessToken>`  
**Requires:** Active vendor account (must own the product)

---

### Upload Product Images
**POST** `/products/:id/images`

**Headers:** `Authorization: Bearer <accessToken>`  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `images`: Files (up to 5 images)

---

## 🛒 Cart

**Base:** `/cart`  
**All routes require:** `Authorization: Bearer <accessToken>`  
**Requires:** Customer role

### Get Cart
**GET** `/cart`

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "items": [
        {
          "productId": "product_id",
          "variant": "Large",
          "quantity": 2
        }
      ],
      "promoCode": null
    }
  }
}
```

---

### Add to Cart
**POST** `/cart`

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2,
  "variant": "Large"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": { /* updated cart */ }
  },
  "message": "Item added to cart"
}
```

---

### Update Cart Item
**PUT** `/cart/:itemId`

**Request Body:**
```json
{
  "quantity": 3
}
```

**Note:** `itemId` is the index of the item in the cart array

---

### Remove from Cart
**DELETE** `/cart/:itemId`

**Note:** `itemId` is the index of the item in the cart array

---

### Clear Cart
**DELETE** `/cart`

---

### Apply Promo Code
**POST** `/cart/apply-promo`

**Request Body:**
```json
{
  "promoCode": "DISCOUNT10"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": { /* updated cart */ },
    "discount": 50
  },
  "message": "Promo code applied"
}
```

---

## 📦 Orders

**Base:** `/orders`  
**All routes require:** `Authorization: Bearer <accessToken>`

### Create Order
**POST** `/orders`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "variant": "Large"
    }
  ],
  "deliveryAddress": {
    "fullName": "John Doe",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "Kathmandu",
    "area": "Thamel",
    "postalCode": "44600",
    "instructions": "Ring the bell"
  },
  "paymentMethod": "khalti",
  "promoCode": "DISCOUNT10",
  "notes": "Please deliver quickly"
}
```

**Payment methods:** `khalti`, `cash-on-delivery`

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order_id",
      "orderId": "ORD123456",
      "customerId": "user_id",
      "vendorId": "vendor_id",
      "items": [ /* order items */ ],
      "subtotal": 200,
      "deliveryFee": 50,
      "discount": 20,
      "total": 230,
      "status": "pending",
      "paymentMethod": "khalti",
      "paymentStatus": "pending",
      "deliveryAddress": { /* address object */ },
      "estimatedDelivery": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  },
  "message": "Order created successfully"
}
```

---

### Get Orders
**GET** `/orders`

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Status values:** `pending`, `preparing`, `on-the-way`, `delivered`, `cancelled`

---

### Get Order by ID
**GET** `/orders/:id`

---

### Track Order
**GET** `/orders/:id/track`

**Response:**
```json
{
  "success": true,
  "data": {
    "order": { /* order with tracking info */ },
    "tracking": {
      "status": "on-the-way",
      "estimatedDelivery": "2024-01-01T12:00:00.000Z",
      "currentLocation": "In transit"
    }
  }
}
```

---

### Update Order Status
**PUT** `/orders/:id/status`

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Status values:** `pending`, `preparing`, `on-the-way`, `delivered`, `cancelled`

**Note:** Only vendors can update order status

---

### Cancel Order
**PUT** `/orders/:id/cancel`

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Note:** Customers can cancel pending orders

---

## 📍 Addresses

**Base:** `/addresses`  
**All routes require:** `Authorization: Bearer <accessToken>`  
**Requires:** Customer role

### Get Addresses
**GET** `/addresses`

**Response:**
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "_id": "address_id",
        "label": "Home",
        "fullName": "John Doe",
        "phone": "1234567890",
        "address": "123 Main St",
        "city": "Kathmandu",
        "area": "Thamel",
        "postalCode": "44600",
        "isDefault": true,
        "coordinates": {
          "lat": 27.7172,
          "lng": 85.3240
        }
      }
    ]
  }
}
```

---

### Add Address
**POST** `/addresses`

**Request Body:**
```json
{
  "label": "Home",
  "fullName": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St",
  "city": "Kathmandu",
  "area": "Thamel",
  "postalCode": "44600",
  "coordinates": {
    "lat": 27.7172,
    "lng": 85.3240
  }
}
```

---

### Update Address
**PUT** `/addresses/:id`

**Request Body:**
```json
{
  "label": "Work",
  "address": "456 Office St"
}
```

---

### Delete Address
**DELETE** `/addresses/:id`

---

### Set Default Address
**PUT** `/addresses/:id/default`

---

## ⭐ Reviews

**Base:** `/reviews`

### Get Reviews
**GET** `/reviews`

**Public route** (no auth required)

**Query Parameters:**
- `productId` (optional): Filter by product
- `vendorId` (optional): Filter by vendor
- `page` (optional): Page number
- `limit` (optional): Items per page

---

### Get Review by ID
**GET** `/reviews/:id`

**Public route** (no auth required)

---

### Create Review
**POST** `/reviews`

**Headers:** `Authorization: Bearer <accessToken>`  
**Content-Type:** `multipart/form-data`  
**Requires:** Customer role

**Form Data:**
- `orderId`: Order ID (required)
- `productId`: Product ID (optional)
- `rating`: 1-5 (required)
- `comment`: Review text (optional)
- `images`: Files (up to 5 images, optional)

---

### Update Review
**PUT** `/reviews/:id`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Updated review"
}
```

---

### Delete Review
**DELETE** `/reviews/:id`

**Headers:** `Authorization: Bearer <accessToken>`

---

## 🔔 Notifications

**Base:** `/notifications`  
**All routes require:** `Authorization: Bearer <accessToken>`

### Get Notifications
**GET** `/notifications`

**Query Parameters:**
- `isRead` (optional): `true` or `false`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "userId": "user_id",
        "type": "order_status",
        "title": "Order Update",
        "message": "Your order has been prepared",
        "data": {
          "orderId": "order_id"
        },
        "isRead": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

---

### Get Unread Count
**GET** `/notifications/unread-count`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### Mark as Read
**PUT** `/notifications/:id/read`

---

### Mark All as Read
**PUT** `/notifications/read-all`

---

### Delete Notification
**DELETE** `/notifications/:id`

---

## 💳 Payments

**Base:** `/payments`  
**All routes require:** `Authorization: Bearer <accessToken>`  
**Requires:** Customer role

### Initiate Khalti Payment
**POST** `/payments/khalti/initiate`

**Request Body:**
```json
{
  "orderId": "order_id",
  "amount": 230
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://khalti.com/payment/...",
    "pidx": "payment_id"
  }
}
```

---

### Verify Khalti Payment
**POST** `/payments/khalti/verify`

**Request Body:**
```json
{
  "pidx": "payment_id"
}
```

---

### Get Transactions
**GET** `/payments/transactions`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

---

## 🎟️ Promo Codes

**Base:** `/promo-codes`

### Get Promo Codes
**GET** `/promo-codes`

**Public route** (no auth required)

---

### Validate Promo Code
**POST** `/promo-codes/validate`

**Public route** (no auth required)

**Request Body:**
```json
{
  "code": "DISCOUNT10",
  "orderTotal": 200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discount": 20,
    "message": "Promo code applied"
  }
}
```

---

### Create Promo Code (Admin Only)
**POST** `/promo-codes`

**Headers:** `Authorization: Bearer <accessToken>`  
**Requires:** Admin role

**Request Body:**
```json
{
  "code": "DISCOUNT10",
  "discountType": "percentage",
  "discountValue": 10,
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validUntil": "2024-12-31T23:59:59.000Z",
  "minOrderAmount": 100,
  "maxDiscount": 50,
  "usageLimit": 1000
}
```

**Discount types:** `percentage`, `fixed`

---

### Update Promo Code (Admin Only)
**PUT** `/promo-codes/:id`

---

### Delete Promo Code (Admin Only)
**DELETE** `/promo-codes/:id`

---

## 👨‍💼 Admin

**Base:** `/admin`  
**All routes require:** `Authorization: Bearer <accessToken>`  
**Requires:** Admin role

### Dashboard Stats
**GET** `/admin/dashboard/stats`

---

### Get Vendors
**GET** `/admin/vendors`

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

---

### Get Pending Vendors
**GET** `/admin/vendors/pending`

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "application_id",
        "name": "Vendor Name",
        "email": "vendor@example.com",
        "phone": "1234567890",
        "businessName": "My Business",
        "businessAddress": "123 Business St",
        "businessLicense": "LIC123456",
        "storeName": "My Store",
        "status": "pending",
        "applicationDate": "2024-01-01T00:00:00.000Z",
        "userId": null,
        "reviewedBy": null,
        "reviewedDate": null,
        "rejectedReason": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Important Notes:**
- Returns `VendorApplication` documents (not Vendor documents). These are pending applications waiting for approval.
- `userId` will be `null` for pending applications (user account is created only after approval)
- User information (name, email, phone) is stored directly in the application document
- Password field is excluded from the response for security

---

### Get Vendor Details
**GET** `/admin/vendors/:id`

**Response (If Approved Vendor):**
```json
{
  "success": true,
  "data": {
    "vendor": { /* vendor object */ },
    "type": "vendor"
  }
}
```

**Response (If Pending Application):**
```json
{
  "success": true,
  "data": {
    "application": { /* application object */ },
    "type": "application"
  }
}
```

**Note:** This endpoint accepts both Vendor ID and VendorApplication ID. Returns the appropriate type.

---

### Approve Vendor
**PUT** `/admin/vendors/:id/approve`

**Note:** `:id` should be the VendorApplication ID (from pending applications)

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": { 
      /* Vendor document created after approval */
      "_id": "vendor_id",
      "status": "active",
      "isActive": true,
      "approvedDate": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Vendor approved successfully"
}
```

**What happens:**
1. VendorApplication is marked as `approved`
2. New Vendor document is created from application data
3. User role changes from `Customer` to `Vendor`
4. Vendor can now access vendor features

---

### Reject Vendor
**PUT** `/admin/vendors/:id/reject`

**Note:** `:id` should be the VendorApplication ID (from pending applications)

**Request Body:**
```json
{
  "reason": "Incomplete documentation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      /* Application marked as rejected */
      "status": "rejected",
      "rejectedReason": "Incomplete documentation",
      "reviewedDate": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Vendor application rejected successfully"
}
```

**What happens:**
1. VendorApplication status changes to `rejected`
2. No Vendor document is created
3. User remains as `Customer`
4. User can reapply later if needed

---

### Suspend Vendor
**PUT** `/admin/vendors/:id/suspend`

---

### Get Users
**GET** `/admin/users`

**Query Parameters:**
- `role` (optional): Filter by role
- `page` (optional): Page number
- `limit` (optional): Items per page

---

### Get User Details
**GET** `/admin/users/:id`

---

### Update User
**PUT** `/admin/users/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "phone": "9876543210",
  "role": "Customer"
}
```

---

### Delete User
**DELETE** `/admin/users/:id`

---

### Get Orders
**GET** `/admin/orders`

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

---

### Get Order Details
**GET** `/admin/orders/:id`

---

## 🔌 Socket.IO Setup

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

// Connect with authentication
socket.auth = { token: accessToken };

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Events

#### Listen for Notifications
```javascript
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // Update notification state
});

socket.on('vendor:approval-approved', (data) => {
  console.log('Vendor approved:', data);
});

socket.on('vendor:approval-rejected', (data) => {
  console.log('Vendor rejected:', data);
});

socket.on('order:status-update', (data) => {
  console.log('Order status updated:', data);
});
```

### Reconnect with Token
```javascript
// When access token is refreshed
socket.auth = { token: newAccessToken };
socket.disconnect();
socket.connect();
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "details": "Detailed error information (optional)"
}
```

### Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Errors

**401 Unauthorized:**
- Token expired → Use refresh token endpoint
- Invalid token → Re-login required

**403 Forbidden:**
- Customer trying to access vendor routes
- Vendor trying to access admin routes
- Pending vendor trying to create products

**400 Bad Request:**
- Validation errors
- Missing required fields
- Invalid data format

---

## 🔑 Authentication Headers

All protected routes require:
```
Authorization: Bearer <accessToken>
```

### Token Management

1. **Store tokens securely:**
   - Access token: In memory or secure storage (not localStorage for XSS protection)
   - Refresh token: httpOnly cookie (preferred) or secure storage

2. **Automatic token refresh:**
   ```javascript
   // Intercept 401 responses
   if (response.status === 401) {
     // Try to refresh token
     const newToken = await refreshToken(refreshToken);
     // Retry original request with new token
   }
   ```

3. **Token expiration:**
   - Access token: 15 minutes
   - Refresh token: 7 days

---

## 📝 Request/Response Examples

### Using Fetch API
```javascript
// GET request
const response = await fetch('http://localhost:5001/api/v1/users/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### Using Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### File Upload Example
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('http://localhost:5001/api/v1/users/profile-picture', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
    // Don't set Content-Type for FormData
  },
  body: formData
});
```

---

## 🎯 Implementation Checklist

- [ ] Set up API base URL configuration
- [ ] Create authentication service (register, login, logout, refresh)
- [ ] Implement token storage and management
- [ ] Set up request interceptors for token injection
- [ ] Implement automatic token refresh on 401 errors
- [ ] Create error handling utilities
- [ ] Set up Socket.IO client for real-time notifications
- [ ] Create API service functions for each endpoint
- [ ] Implement loading states for API calls
- [ ] Add error boundaries and user-friendly error messages
- [ ] Test all CRUD operations
- [ ] Implement pagination for list endpoints
- [ ] Add file upload functionality
- [ ] Set up form validation matching backend validators

---

## 🌐 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_WS_URL=ws://localhost:5001
```

---

## 📌 Important Notes

1. **Vendor Registration Flow:**
   - User is created as `Customer` initially (NOT as Vendor)
   - `VendorApplication` document is created (NOT Vendor document)
   - `Vendor` document is created **ONLY** after admin approval
   - User role changes from `Customer` → `Vendor` only after admin approval
   - Before approval: User can check application status via `/vendors/pending-approval`
   - After approval: User can access vendor features and create products
   - If rejected: No Vendor document created, user remains Customer, can reapply

2. **Cart Storage:**
   - Currently in-memory (backend)
   - Consider implementing persistent cart in frontend (localStorage/backend)

3. **File Uploads:**
   - Profile pictures: Single file
   - Product images: Up to 5 files
   - Review images: Up to 5 files

4. **Pagination:**
   - Default page: 1
   - Default limit: 20
   - Check `pagination` object in responses

5. **Order Status Flow:**
   - `pending` → `preparing` → `on-the-way` → `delivered`
   - Can be `cancelled` at any time (with restrictions)

6. **Payment Methods:**
   - `khalti`: Online payment (requires payment verification)
   - `cash-on-delivery`: Payment on delivery

---

**Copy this entire document and paste it into your frontend chat to connect your frontend application to this backend API.**
