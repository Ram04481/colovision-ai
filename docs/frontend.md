# Frontend

## Tech Stack
- React 18 + TypeScript
- Vite 5 (dev server, build)
- React Router v6
- Axios (API client)
- Tailwind CSS v4 (via `@import "tailwindcss"`)
- Framer Motion (animations)
- Lucide React (icons)
- Recharts (charts - for probability visualization)

---

## Project Structure
```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx           # Entry point
    ├── App.tsx            # Routes
    ├── styles.css         # Global styles + Tailwind
    ├── components/
    │   ├── SiteLayout.tsx     # Header, navigation, outlet
    │   └── FeatureCard.tsx    # Reusable card component
    ├── pages/
    │   ├── Home.tsx           # Landing page
    │   ├── Login.tsx          # User + Admin login
    │   ├── Register.tsx       # User registration
    │   ├── Dashboard.tsx      # User dashboard (stats + actions)
    │   ├── AddPatient.tsx     # Patient create + image upload
    │   ├── AdminDashboard.tsx # Admin user management
    │   └── InfoPage.tsx       # About/Facilities/Contact
    └── services/
        └── api.ts         # Axios instance + API functions
```

---

## Routes (Current)

| Path | Component | Protected | Notes |
|------|-----------|-----------|-------|
| `/` | Home | No | Landing page |
| `/about` | InfoPage | No | |
| `/facilities` | InfoPage | No | |
| `/contact` | InfoPage | No | |
| `/login` | Login | No | User + Admin toggle |
| `/register` | Register | No | |
| `/dashboard` | Dashboard | **No (BUG)** | Should require auth |
| `/patients/new` | AddPatient | **No (BUG)** | Should require auth |
| `/admin` | AdminDashboard | **MISSING** | Not in routes |

---

## Authentication

### Current State
- Token stored in `localStorage` (`access_token`)
- Axios interceptor adds `Authorization: Bearer <token>` header
- Login stores token, navigates to `/dashboard` or `/admin`
- **NO** route protection
- **NO** auth context/state management
- **NO** 401 handling (redirect to login)

### Required (Phase 4)
```tsx
// AuthContext.tsx
const AuthContext = createContext<{
  token: string | null;
  user: User | null;
  role: "user" | "admin" | null;
  login: (token: string, role: "user" | "admin") => void;
  logout: () => void;
}>(null);

// PrivateRoute.tsx
const PrivateRoute = ({ children, requiredRole }) => {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/dashboard" replace />;
  return children;
};

// App.tsx
<Route element={<PrivateRoute><Dashboard /></PrivateRoute>} path="/dashboard" />
<Route element={<PrivateRoute><AddPatient /></PrivateRoute>} path="/patients/new" />
<Route element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} path="/admin" />
```

---

## Pages

### Home (`/`)
- Hero section with animation
- Capabilities grid (FeatureCard)
- Workflow visualization
- Research disclaimer

### Login (`/login`)
- Toggle: User Login ↔ Admin Login
- Fields: Email/Username + Password
- Stores token, navigates based on role
- Link to Register (user only)

### Register (`/register`)
- Fields: Name, Email, Phone, Username, Password, Confirm
- Validates password match
- Submits to `/api/auth/register`
- Shows approval notice

### Dashboard (`/dashboard`)
- **Current**: Static zeros, no data fetching
- **Needed**: Fetch `/api/patients` + `/api/predictions` for stats
- Link to AddPatient

### AddPatient (`/patients/new`)
- Patient form: ID, Name, Age, Gender, Address, Contact
- Image dropzone: JPG/PNG, preview missing
- Submits patient → uploads image → shows prediction result
- **Missing**: Patient photo upload

### AdminDashboard (`/admin`)
- Tabs: Pending Users / Active Members
- Pending: Table with Approve/Reject buttons
- Active: Table with Suspend button
- Real-time reload after actions
- **Missing**: Loading states, error handling

### InfoPage (`/about`, `/facilities`, `/contact`)
- Dynamic content based on `type` prop
- Contact form (no backend)

---

## Components

### SiteLayout
- Header: Logo, nav links, Login/Register buttons
- Mobile menu (hamburger)
- Outlet for child routes
- Footer with disclaimer

### FeatureCard
- Icon, title, text
- Used in Home and Facilities

---

## API Service (`services/api.ts`)

```typescript
// Axios instance
baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api"

// Interceptor: Adds Bearer token from localStorage

// Admin functions
getPendingUsers()
getApprovedUsers()
approveUser(id)
rejectUser(id)
suspendUser(id)

// Missing functions needed:
getPatients()
getPatient(id)
updatePatient(id, data)
getPredictions(patientId)
getPrediction(id)
getReports()
getReport(id)
downloadReport(id)
```

---

## State Management

- **Current**: None (localStorage only)
- **Needed**: AuthContext for token/user/role
- **Optional**: React Query / SWR for server state

---

## Forms & Validation

- HTML5 validation (`required`, `minLength`, `type="email"`)
- Custom: Password confirmation (Register)
- **Missing**: Client-side file validation (type, size)

---

## Image Upload

### Current (AddPatient)
```tsx
<input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
       onChange={e => setFile(e.target.files?.[0])} />
```
- No preview
- No client-side size check
- No progress indicator

### Required Enhancements
- Preview thumbnail
- File size warning (>10MB)
- Drag-drop zone
- Upload progress

---

## Prediction UI

### Current
- Text result only: "Analysis complete: Class (XX% confidence)"

### Required (Phase 15)
- Side-by-side: Original | Mask | Overlay
- Probability chart (Recharts bar/pie)
- Confidence indicator (color-coded)
- Download buttons for mask/overlay

---

## Report UI

### Current
- None (backend generates, no frontend page)

### Required (Phase 16)
- Report view page (`/reports/:id`)
- Embedded PDF viewer or download trigger
- Report metadata (generated at, by whom)

---

## Error Handling

- **Current**: Try/catch with generic error messages
- **Needed**:
  - Error boundary component
  - Toast/notification system
  - 401 → redirect to login
  - 403 → "Access denied" page
  - 503 → "AI service unavailable" message

---

## Loading States

- **Current**: None
- **Needed**:
  - Button disabled + spinner during API calls
  - Page skeleton loaders
  - Image upload progress

---

## Responsive Design

- Tailwind utility classes
- Mobile-first
- Hamburger menu on mobile
- Tables need horizontal scroll on mobile

---

## Missing Pages (Priority Order)

1. **PatientList** (`/patients`) - list with pagination
2. **PatientDetail** (`/patients/:id`) - view + edit
3. **PredictionHistory** (`/patients/:id/predictions`) - table
4. **PredictionDetail** (`/predictions/:id`) - visual comparison
5. **ReportView** (`/reports/:id`) - view/download
6. **Profile/Settings** - change password, etc.