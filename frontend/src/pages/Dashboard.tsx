import { Activity, Plus, ScanLine, UsersRound, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <section className="section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <p className="eyebrow">USER DASHBOARD</p>
          <h1>Welcome, {user?.name || "Researcher"}</h1>
        </div>
        <button className="button secondary" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
      <div className="stat-grid">
        <div><UsersRound/> <b>0</b><span>Total patients</span></div>
        <div><Activity/> <b>0</b><span>Total predictions</span></div>
        <div><ScanLine/> <b>—</b><span>Recent analysis</span></div>
      </div>
      <Link className="button" to="/patients/new"><Plus size={18}/> Add patient</Link>
    </section>
  );
}