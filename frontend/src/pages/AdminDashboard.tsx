import React, { useState, useEffect } from 'react';
import { getPendingUsers, getApprovedUsers, approveUser, rejectUser, suspendUser, getAdminStats, getAllPatients } from '../services/api';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  status: string;
}

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  suspendedUsers: number;
  totalPatients: number;
  totalPredictions: number;
  totalReports: number;
  totalAdmins: number;
}

interface Patient {
  id: number;
  patientId: string;
  name: string;
  address: string;
  age: number;
  gender: string;
  contact: string;
  photoPath?: string;
  createdBy: number;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'members' | 'patients'>('pending');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pending, approved, patientsList, statsData] = await Promise.all([
        getPendingUsers(),
        getApprovedUsers(),
        getAllPatients(),
        getAdminStats()
      ]);
      setPendingUsers(pending);
      setApprovedUsers(approved);
      setPatients(patientsList);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveUser(id);
      loadData();
    } catch (error) {
      setError('Failed to approve user');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectUser(id);
      loadData();
    } catch (error) {
      setError('Failed to reject user');
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      await suspendUser(id);
      loadData();
    } catch (error) {
      setError('Failed to suspend user');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Admin Dashboard</h1>
      
      {/* Stats Cards */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <StatCard title="Total Users" value={stats.totalUsers} color="#3b82f6" />
          <StatCard title="Pending Users" value={stats.pendingUsers} color="#f59e0b" />
          <StatCard title="Approved Users" value={stats.approvedUsers} color="#10b981" />
          <StatCard title="Rejected Users" value={stats.rejectedUsers} color="#ef4444" />
          <StatCard title="Suspended Users" value={stats.suspendedUsers} color="#8b5cf6" />
          <StatCard title="Total Patients" value={stats.totalPatients} color="#06b6d4" />
          <StatCard title="Total Predictions" value={stats.totalPredictions} color="#f97316" />
          <StatCard title="Total Reports" value={stats.totalReports} color="#84cc16" />
          <StatCard title="Total Admins" value={stats.totalAdmins} color="#6366f1" />
        </div>
      )}

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{ fontWeight: activeTab === 'pending' ? 'bold' : 'normal', padding: '8px 16px' }}
        >
          Pending Requests ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          style={{ fontWeight: activeTab === 'members' ? 'bold' : 'normal', padding: '8px 16px' }}
        >
          User Management ({approvedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          style={{ fontWeight: activeTab === 'patients' ? 'bold' : 'normal', padding: '8px 16px' }}
        >
          Patient Management ({patients.length})
        </button>
      </div>

      {/* Tab 1: Pending Users */}
      {activeTab === 'pending' && (
        <div>
          <h2>Pending User Approvals</h2>
          {pendingUsers.length === 0 ? <p>No pending users.</p> : (
            <table width="100%" cellPadding="10" border={1} style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <button onClick={() => handleApprove(u.id)} style={{ color: 'green', marginRight: '8px' }}>Approve</button>
                      <button onClick={() => handleReject(u.id)} style={{ color: 'red' }}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Existing Approved Members */}
      {activeTab === 'members' && (
        <div>
          <h2>Active Members</h2>
          {approvedUsers.length === 0 ? <p>No active members.</p> : (
            <table width="100%" cellPadding="10" border={1} style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.status}</td>
                    <td>
                      <button onClick={() => handleSuspend(u.id)} style={{ color: 'orange' }}>Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Patient Management */}
      {activeTab === 'patients' && (
        <div>
          <h2>Patient Management</h2>
          {patients.length === 0 ? <p>No patients found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table width="100%" cellPadding="10" border={1} style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Contact</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.patientId}</td>
                      <td>{p.name}</td>
                      <td>{p.age}</td>
                      <td>{p.gender}</td>
                      <td>{p.contact}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          onClick={() => window.open(`/admin/patients/${p.id}`, '_blank')}
                          style={{ color: 'blue', marginRight: '8px' }}
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => window.open(`/patients/${p.id}/predictions`, '_blank')}
                          style={{ color: 'green', marginRight: '8px' }}
                        >
                          View Predictions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <div style={{ 
    background: 'white', 
    border: '1px solid #e5e7eb', 
    borderRadius: '8px', 
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }}>
    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>
      {value}
    </div>
  </div>
);

export default AdminDashboard;