# Frontend Changes Required for Vendor Registration Flow

## 🚨 Important: Backend Change Summary

The vendor registration flow has been **significantly changed**. Vendors are no longer created as User accounts immediately. Instead, only a `VendorApplication` is created, and the User account is created **only after admin approval**.

## ⚠️ Breaking Changes

### 1. **Vendor Registration Response Changed**

**OLD Response (Before):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  },
  "message": "Registration successful"
}
```

**NEW Response (After):**
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

### 2. **No Tokens Returned for Vendor Registration**

- ❌ **No `accessToken` or `refreshToken`** are returned
- ❌ **Vendors CANNOT login immediately** after registration
- ✅ Vendors can only login **after admin approval**

## 📋 Required Frontend Changes

### 1. **Registration Component** (`/auth/register` or similar)

**Update the registration handler:**

```typescript
// Before (OLD):
const handleVendorRegister = async (formData) => {
  const response = await api.post('/auth/register', formData);
  
  // OLD CODE - This will break now:
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  navigate('/dashboard'); // ❌ Won't work - no tokens!
};

// After (NEW):
const handleVendorRegister = async (formData) => {
  const response = await api.post('/auth/register', formData);
  
  // Check if vendor registration (has 'application' field instead of 'user')
  if (response.data.data.application) {
    // Vendor registration - show approval pending message
    showSuccessMessage(
      'Application submitted! Please wait for admin approval before you can login.'
    );
    // Redirect to login page or show instructions
    navigate('/login', { 
      state: { 
        message: 'Your vendor application is pending approval. You will be notified once approved.' 
      }
    });
  } else {
    // Customer registration - normal flow
    localStorage.setItem('accessToken', response.data.data.accessToken);
    localStorage.setItem('refreshToken', response.data.data.refreshToken);
    navigate('/dashboard');
  }
};
```

### 2. **Response Type Checking**

Add type checking to handle both customer and vendor registration:

```typescript
interface RegistrationResponse {
  success: boolean;
  data: {
    // Customer registration
    user?: {
      _id: string;
      name: string;
      email: string;
      role: string;
      // ... other user fields
    };
    accessToken?: string;
    refreshToken?: string;
    
    // Vendor registration (NEW)
    application?: {
      _id: string;
      email: string;
      status: 'pending' | 'approved' | 'rejected';
    };
  };
  message: string;
}

// Usage:
const response: RegistrationResponse = await api.post('/auth/register', formData);

if (response.data.application) {
  // Handle vendor application
} else if (response.data.user) {
  // Handle customer registration
}
```

### 3. **UI Updates for Vendor Registration**

**Show appropriate message after vendor registration:**

```jsx
// Show success message with important note
<Alert severity="info">
  <AlertTitle>Application Submitted</AlertTitle>
  Your vendor application has been submitted successfully. 
  You will receive an email notification once your application is approved.
  Until then, you cannot log in to your vendor account.
</Alert>

// Don't show login button or "Continue to Dashboard" button
// Instead, show "Back to Login" button
```

### 4. **Login Flow - No Changes Needed**

The login endpoint remains the same. However, vendors will only be able to login **after** their application is approved and a User account is created.

### 5. **Error Handling**

**Handle case where vendor tries to login before approval:**

The backend will return 401 "Invalid credentials" if no User account exists. You might want to show a more helpful message:

```typescript
try {
  await api.post('/auth/login', credentials);
} catch (error) {
  if (error.response?.status === 401) {
    // Check if user might have a pending application
    // You could show a message suggesting they wait for approval
    showError('Invalid credentials. If you registered as a vendor, please wait for admin approval.');
  }
}
```

### 6. **Registration Form Validation**

No changes needed - the form validation remains the same. All vendor fields are still required.

## 📝 Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| User Account Created | ✅ Immediately | ❌ Only after approval |
| Tokens Returned | ✅ Yes | ❌ No |
| Can Login After Registration | ✅ Yes | ❌ No (must wait for approval) |
| Response Structure | `{user, accessToken, refreshToken}` | `{application}` |
| User Role | Created as 'Customer' | No user account exists yet |

## ✅ Testing Checklist

- [ ] Vendor registration shows success message about waiting for approval
- [ ] Vendor registration does NOT auto-login user
- [ ] Customer registration still works normally with tokens
- [ ] Vendor cannot login before approval (401 error)
- [ ] Vendor can login after admin approval
- [ ] Error messages are user-friendly

## 🔄 Migration Notes

If you have existing vendor registrations in your database that were created with the old flow (where User accounts exist), those will continue to work. Only new registrations will follow the new flow.

---

**Questions?** Check the updated API documentation in `FRONTEND_API_COMPLETE_GUIDE.md` for the latest endpoint specifications.
