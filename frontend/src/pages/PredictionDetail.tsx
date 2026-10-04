import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPredictions, Prediction, downloadReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PredictionDetailProps {
  // This component receives the prediction ID from the URL
}

export const PredictionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = useAuth();

  const loadPrediction = async () => {
    if (!id) {
      setError('Invalid prediction ID');
      setLoading(false);
      return;
    }

    try {
      // We need to fetch prediction details. Since there's no single prediction endpoint,
      // we'll need to fetch from a patient's predictions or implement a new endpoint.
      // For now, we'll show a message
      setError('Prediction detail view requires admin access or specific patient access');
    } catch (error) {
      console.error('Failed to load prediction:', error);
      setError('Failed to load prediction details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // For now, just show a message
      setLoading(false);
    }
  }, [id]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">PREDICTION DETAIL</p>
          <h1>Prediction Detail</h1>
        </div>
        <Link to="/predictions" className="button secondary">Back to History</Link>
      </div>

      <div style={{ 
        padding: '20px', 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p style={{ margin: 0, color: '#92400e' }}>
          <strong>Note:</strong> Individual prediction details require patient-specific access.
          Please navigate through a patient's record to view their specific predictions.
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="button secondary">Dashboard</Link>
          <Link to="/patients/new" className="button">Add Patient</Link>
        </div>
      </div>
    </section>
  );
};

export default PredictionDetail;