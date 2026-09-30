# Admin Security

## Admin Authentication

- **Separate Table**: `admins` (not in `users` table)
- **No Public Registration**: No `/api/auth/admin/register` endpoint exists
- **Login**: `POST /api/auth/admin/login` → validates against `admins` table
- **JWT Role**: `role="admin"` → `ROLE_ADMIN` authority

## Admin Authorization

**Backend**: `AdminController.admin(Authentication x)`
```java
private Admin admin(Authentication x) {
  if (x.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
    throw new AccessDeniedException("Administrator access required");
  }
  return auth.currentAdmin(x.getName()); // x.getName() = JWT sub = admin.id
}
```

All `/api/admin/**` endpoints call this check first.

## Admin Capabilities

| Action | Endpoint | Description |
|--------|----------|-------------|
| View pending users | `GET /api/admin/users/pending` | List users with status=PENDING |
| View approved users | `GET /api/admin/users/approved` | List users with status=APPROVED |
| Approve user | `PUT /api/admin/users/{id}/approve` | Set status=APPROVED, record approver |
| Reject user | `PUT /api/admin/users/{id}/reject` | Set status=REJECTED |
| Suspend user | `PUT /api/admin/users/{id}/suspend` | Set status=SUSPENDED |

## Admin Bootstrap (Critical Gap)

**Current**: Manual SQL insert per README:
```sql
INSERT INTO admins (name, email, password_hash, created_at)
VALUES ('Admin', 'admin@example.com', '$2a$10$...', NOW());
```

**Required**: Automated seed via `CommandLineRunner` reading env vars:
```java
@Component
class AdminSeeder implements CommandLineRunner {
  @Value("${ADMIN_EMAIL}") String email;
  @Value("${ADMIN_PASSWORD}") String password;
  @Value("${ADMIN_NAME:Administrator}") String name;
  
  public void run(ApplicationArguments args) {
    if (adminRepository.findByEmail(email).isEmpty()) {
      Admin a = new Admin();
      a.name = name;
      a.email = email;
      a.passwordHash = encoder.encode(password);
      adminRepository.save(a);
    }
  }
}
```

## Frontend Admin Access

**Current Issue**: `/admin` route NOT registered in `App.tsx`
**Fix**: Add route with admin-only protection:
```tsx
<Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
```

## Privilege Escalation Risks

| Risk | Status | Mitigation |
|------|--------|------------|
| User registers as admin | ✅ Prevented | No admin registration endpoint |
| User modifies own role | ✅ Prevented | Role from JWT, not user input |
| User accesses admin APIs | ✅ Prevented | `ROLE_ADMIN` check in controller |
| Admin created via SQL injection | ✅ Prevented | JPA parameterized queries |
| JWT forged with admin role | ⚠️ Possible | Weak default JWT secret |
| Admin approves themselves | ✅ Prevented | Admins not in users table |

## Current Issues

1. **No Automated Seed**: First admin requires manual DB access
2. **Weak Default JWT Secret**: Forgeable tokens if env var not set
3. **Missing Frontend Route**: AdminDashboard unreachable
4. **Status Inconsistency**: "ACTIVE" vs "APPROVED" breaks approval flow
5. **No Audit Log**: Admin actions not logged

## Required Fixes

1. Add `AdminSeeder` CommandLineRunner (Phase 5)
2. Fail startup if `JWT_SECRET_KEY` default detected
3. Add `/admin` route with admin-only `PrivateRoute` (Phase 5)
4. Fix status inconsistency (Phase 3)
5. Add audit logging for admin actions (Phase 17)