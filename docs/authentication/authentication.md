# Authentication and Authorization in Smart-Chain

## Introduction
This document explains how authentication (verifying user identity) and authorization (controlling access to resources) are implemented in the Smart-Chain application. The system uses JSON Web Tokens (JWT) for session management, Redux for frontend state, and a role-based access control (RBAC) system in the backend to ensure secure and scalable user interactions.

---

## Architecture Overview
The authentication/authorization system spans the frontend (React/Vite), backend (Node.js/Express IAM service), and MongoDB database:
- **Frontend**: Handles user input (login/register), stores tokens in `localStorage`, and manages state with Redux.
- **IAM Service**: Manages user CRUD, token issuance, and permission checks.
- **Database**: Stores users, roles, and blacklisted tokens.

Key flows:
1. User registers/logs in → Receives access and refresh tokens.
2. Access token authorizes API requests → Refresh token renews it.
3. Logout blacklists the refresh token → Ends the session.

---

## Authentication Flow

### Registration
1. User submits `email`, `password`, `firstName`, `lastName` via `RegistrationPage`.
2. Frontend sends `POST /auth/register` to IAM service.
3. Backend:
   - Assigns `customer` role (hardcoded for security).
   - Hashes password (pre-save hook in `User` model).
   - Saves user to MongoDB.
   - Issues JWT `token` (1h expiry) and `refreshToken` (7d expiry).
4. Frontend stores tokens in `localStorage`, updates Redux (`loginSuccess`), and navigates to `/dashboard`.

### Login
1. User submits `email`, `password` via `LoginPage`.
2. Frontend sends `POST /auth/login` to IAM service.
3. Backend:
   - Verifies credentials (`User.comparePassword`).
   - Updates `lastLogin`.
   - Issues `token` and `refreshToken`.
4. Frontend stores tokens, updates Redux, and navigates to `/dashboard`.

### Token Refresh
1. Frontend detects expired `token` (e.g., 401 response).
2. Sends `POST /auth/refresh` with `refreshToken`.
3. Backend:
   - Checks `TokenBlacklist` (rejects if blacklisted).
   - Verifies `refreshToken` (`jwtService.verifyRefreshToken`).
   - Issues new `token`.
4. Frontend updates `localStorage.token` and continues.

### Logout
1. User clicks `LogoutButton` (e.g., in `NavigationBar`).
2. Frontend sends `POST /auth/logout` with `refreshToken`.
3. Backend blacklists `refreshToken` in `TokenBlacklist` (7d TTL).
4. Frontend clears Redux (`logout`), `localStorage`, and navigates to `/login`.

---

## Authorization Mechanism
Authorization uses **Role-Based Access Control (RBAC)**:
- **Roles**: Defined in `initRoles.js` (e.g., `admin`, `customer`, `warehouse_manager`).
- **Permissions**: Stored as `resource:action` strings (e.g., `users:read`, `orders:write`).
- **Enforcement**: 
  - Middleware (`authMiddleware.authorize`) checks token and permissions.
  - Example: `GET /users` requires `users:read` (only `admin` has this).

### Role Examples
- `admin`: Full access (`users:read`, `users:write`, etc.).
- `customer`: Limited access (`orders:read`, `feedback:write`).
- See `initRoles.js` for full list.

---

## Key Components

### Frontend
- **Redux Slice**: `authSlice.js` manages `user`, `token`, `loading`, `error`.
- **Services**: `authService.js` handles API calls (`loginUser`, `registerUser`, `logoutUser`).
- **Components**: 
  - `LoginPage.jsx`: Login form.
  - `RegistrationPage.jsx`: Registration form.
  - `LogoutButton.jsx`: Reusable logout trigger.
  - `NavigationBar.jsx`: Role-based nav with logout.

### Backend (IAM Service)
- **Models**: 
  - `userModel.js`: User data (email, passwordHash, roleId).
  - `roleModel.js`: Role definitions (name, permissions).
  - `tokenBlacklistModel.js`: Blacklisted refresh tokens.
- **Controllers**: `authController.js` (login, register, refresh, logout).
- **Middleware**: `authMiddleware.js` (authenticate, authorize).
- **Routes**: `authRoutes.js`, `userRoutes.js`.

### Database
- MongoDB collections:
  - `users`: User records.
  - `roles`: Predefined roles and permissions.
  - `tokenblacklists`: Blacklisted refresh tokens (TTL index).

---

## Security Considerations
- **Token Storage**: `localStorage` (consider `HttpOnly` cookies for better security).
- **Password Hashing**: `bcrypt` in `userModel.js` pre-save hook.
- **Token Expiry**: Access token (1h), refresh token (7d) via `.env`.
- **Blacklisting**: Prevents reuse of logged-out refresh tokens.
- **Role Restriction**: Public registration locked to `customer`.
- **Validation**: Joi in `authRoutes.js` for input sanitization.

---

## Setup Instructions
1. **Backend (IAM Service)**:
   ```bash
   cd microservices/iam
   npm install
   cp .env.example .env  # Set MONGO_URI, JWT_SECRET, etc.
   npm run init-roles    # Seed roles
   npm start