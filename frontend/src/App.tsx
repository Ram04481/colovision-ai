import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { SiteLayout } from "./components/SiteLayout";
import { Home } from "./pages/Home";
import { InfoPage } from "./pages/InfoPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { AddPatient } from "./pages/AddPatient";
import { AdminDashboard } from "./pages/AdminDashboard";
import { PredictionHistory } from "./pages/PredictionHistory";
import { PredictionDetail } from "./pages/PredictionDetail";
import { ReportView } from "./pages/ReportView";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<InfoPage title="About the research" type="about" />} />
          <Route path="/facilities" element={<InfoPage title="Platform facilities" type="facilities" />} />
          <Route path="/contact" element={<InfoPage title="Contact the research team" type="contact" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes for authenticated users */}
          <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients/new" element={<AddPatient />} />
            <Route path="/patients/:patientId/predictions" element={<PredictionHistory />} />
            <Route path="/patients/:patientId/predictions/:id" element={<PredictionDetail />} />
            <Route path="/report/:id" element={<ReportView />} />
            <Route path="/patients/:patientId/report/:predictionId" element={<ReportView />} />
          </Route>

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
        
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}