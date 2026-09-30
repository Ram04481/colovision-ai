# Authentication

## Overview

Dual authentication system:
- **Users** (researchers/clinicians) → register → admin approval → login → JWT with `ROLE_USER`
- **Admins** → seeded via controlled process → login → JWT with `ROLE_ADMIN`

---

## Registration Flow

```
POST /api/auth/register
{
  "name": "Dr. Smith",
  "email": "smith@hospital.org",
  "phone": "+1234567890",
  "username": "drsmith",
  "password": "securePass123"
}

Response: 201 Created
{
  "message": "Registration submitted and waiting for administrator approval."
}
```

**Backend**: `AuthService.register()`
- Validates unique email/username
- BCrypt hashes password
- Creates User with `status = "PENDING"`
- No email verification (admin approval is the gate)

---

## Admin Approval Flow

```
PUT /api/admin/users/{id}/approve
Authorization: Bearer <admin-jwt>

Response: 200 OK
{
  "message": "User approved"
}
```

**Backend**: `AdminController.approve()` / `AdminService.approveUser()`
- Sets `user.status = "APPROVED"` (controller) OR `"ACTIVE"` (service - BUG)
- Sets `user.approvedBy = admin.id`
- Sets `user.approvedAt = now()`

---

## User Login Flow

```
POST /api/auth/login
{
  "identifier": "drsmith",  // email or username
  "password": "securePass123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

**Backend**: `AuthService.login(identifier, password, admin=false)`
1. Find user by email OR username
2. Verify BCrypt password
3. Check `status == "APPROVED"` (rejects PENDING/REJECTED/SUSPENDED)
4. Create JWT: `sub=user.id`, `role="user"`, exp=60min

---

## Admin Login Flow

```
POST /api/auth/admin/login
{
  "identifier": "admin@hospital.org",
  "password": "adminPass123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

**Backend**: `AuthService.login(identifier, password, admin=true)`
1. Find admin by email in `admins` table
2. Verify BCrypt password
3. Create JWT: `sub=admin.id`, `role="admin"`, exp=60min

---

## JWT Token

**Header**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "sub": "123",
  "role": "user",
  "exp": 1700000000,
  "iat": 1699996400
}
```

**Configuration** (`application.yml`):
```yaml
app:
  jwt-secret: ${JWT_SECRET_KEY:change-this-to-a-long-random-secret-at-least-32-characters}
  access-token-expire-minutes: ${ACCESS_TOKEN_EXPIRE_MINUTES:60}
```

**Implementation**: `JwtService`
- HS256 algorithm
- Secret from config (env var required for production)
- `parse()` validates signature and expiration

---

## Token Validation Filter

**Class**: `SecurityConfig.Filter` (extends `OncePerRequestFilter`)

**Flow**:
1. Extract `Authorization` header
2. Verify `Bearer ` prefix
3. `JwtService.parse(token)` → throws if invalid/expired
4. Create `SimpleGrantedAuthority("ROLE_" + role.toUpperCase())`
5. Set `SecurityContextHolder` with `UsernamePasswordAuthenticationToken`

**Protected Routes**: All except `/health`, `/api/auth/**`, `/error`

---

## Password Hashing

- **Algorithm**: BCrypt (via `BCryptPasswordEncoder`)
- **Strength**: Default (10 rounds)
- **Storage**: `password_hash` column in `users` and `admins`
- **Verification**: `encoder.matches(rawPassword, storedHash)`

---

## Token Expiration

- **Access Token**: 60 minutes (configurable)
- **Refresh Token**: NOT IMPLEMENTED
- **Rotation**: NOT IMPLEMENTED
- **Revocation**: NOT IMPLEMENTED (stateless)

---

## Protected Routes

### Backend (Spring Security)
```java
.authorizeHttpRequests(a -> a
  .requestMatchers("/health", "/api/auth/**", "/error").permitAll()
  .anyRequest().authenticated()
)
```

### Frontend (MISSING - Phase 4)
Required: `PrivateRoute` wrapper checking `localStorage.getItem("access_token")`
Routes to protect: `/dashboard`, `/patients/*`, `/admin`

---

## Roles

| Role | Source | Access |
|------|--------|--------|
| `ROLE_USER` | JWT `role="user"` | Patient CRUD, predictions, reports |
| `ROLE_ADMIN` | JWT `role="admin"` | User management (approve/reject/suspend) |

---

## Current Issues

1. **Default JWT Secret**: `application.yml` has insecure default
2. **No Refresh Tokens**: Users logged out after 60 min
3. **No Token Revocation**: Cannot invalidate tokens server-side
4. **Frontend Unprotected**: No route guards
5. **Status Inconsistency**: AdminService uses "ACTIVE", AuthService checks "APPROVED"
6. **No Rate Limiting**: Brute-force vulnerable

---

## Required Fixes

1. Fail startup if `JWT_SECRET_KEY` not set or equals default
2. Add refresh token endpoint + rotation
3. Implement frontend `PrivateRoute` + `AuthContext`
4. Unify status to "APPROVED" everywhere
5. Add Bucket4j rate limiting on `/api/auth/**`