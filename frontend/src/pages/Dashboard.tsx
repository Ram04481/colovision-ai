import { Activity, Plus, ScanLine, UsersRound, LogOut, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPatients, Patient } from "../services/api";
import { useState, useEffect } from "react";

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <section className="section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <p className="eyebrow">USER DASHBOARD</p>
          <h1>Welcome, {user?.name || "Researcher"}</h1>
        </div>
        <button className="button secondary" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
      
      <div className="stat-grid">
        <div><UsersRound/> <b>{patients.length}</b><span>Total patients</span></div>
        <div><Activity/> <b>0</b><span>Total predictions</span></div>
        <div><ScanLine/> <b>—</b><span>Recent analysis</span></div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Your Patients</h2>
          <Link className="button" to="/patients/new"><Plus size={18}/> Add Patient</Link>
        </div>

        {error && (
          <div style={{ 
            padding: '16px', 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {patients.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            background: '#f8fafc', 
            border: '1px dashed #cbd5e1', 
            borderRadius: '12px' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No Patients Yet</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              You haven't added any patients yet. Start by adding a new patient for analysis.
            </p>
            <Link to="/patients/new" className="button"><Plus size={18}/> Add Your First Patient</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {patients.map((patient) => (
              <Link 
                to={`/patients/${patient.id}/predictions`}
                key={patient.id}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ 
                  padding: '20px', 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '50%', 
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                        {patient.name}
                      </h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Patient ID: {patient.patientId} | Age: {patient.age} | {patient.gender}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: '500' }}>
                    <span>View Predictions</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}