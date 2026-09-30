import React, { useState, useEffect } from 'react';
import {
  getPendingUsers,
  getApprovedUsers,
  approveUser,
  rejectUser,
  suspendUser
} from '../services/api';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  status: string;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'members'>('pending');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, approved] = await Promise.all([
        getPendingUsers(),
        getApprovedUsers()
      ]);
      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    await approveUser(id);
    loadData();
  };

  const handleReject = async (id: number) => {
    await rejectUser(id);
    loadData();
  };

  const handleSuspend = async (id: number) => {
    await suspendUser(id);
    loadData();
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Admin Dashboard</h1>

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
    </div>
  );
};

export default AdminDashboard;