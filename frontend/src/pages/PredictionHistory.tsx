import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPredictions, Prediction } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PredictionHistory: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = useAuth();

  const loadPredictions = async () => {
    try {
      // For admin, show all predictions; for user, show only their patients' predictions
      // We'll use the existing endpoint that filters by patient
      // For now, we'll need to implement a different approach
      // Since there's no "all predictions" endpoint, we'll need to fetch from each patient
      // For now, let's create a simple view
      setError("Prediction history view requires admin access or patient-specific queries");
    } catch (error) {
      console.error('Failed to load predictions:', error);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // We'll need a different approach - let's show a message for now
    setLoading(false);
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <section className="section">
      <p className="eyebrow">PREDICTION HISTORY</p>
      <h1>Prediction History</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px' }}>
        <p style={{ margin: 0, color: '#92400e' }}>
          <strong>Note:</strong> Prediction history is patient-specific. 
          Please navigate to a specific patient's details to view their prediction history.
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Quick Access</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          <Link to="/patients/new" className="button">
            Add New Patient & Analyze
          </Link>
          <Link to="/dashboard" className="button secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PredictionHistory;