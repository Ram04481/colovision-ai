import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPredictions, Prediction } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PredictionHistory: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const { role } = useAuth();
  const navigate = useNavigate();

  const loadPredictions = async () => {
    if (!patientId) {
      setError('Invalid patient ID');
      setLoading(false);
      return;
    }

    try {
      const data = await getPredictions(parseInt(patientId, 10));
      setPredictions(data);
      
      // Get patient info from the first prediction if available
      if (data.length > 0) {
        // We don't have patient info directly, but we can fetch it
        // For now, just show the predictions
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
      setError('Failed to load prediction history');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    const normalizedPath = path.replace(/\\/g, '/');
    return `http://localhost:8080/${normalizedPath}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#22c55e';
    if (confidence >= 0.5) return '#eab308';
    return '#ef4444';
  };

  const getPredictedClassColor = (className: string) => {
    const lower = className.toLowerCase();
    if (lower.includes('high-grade')) return '#dc2626';
    if (lower.includes('low-grade') || lower.includes('polyp') || lower.includes('serrated')) return '#f97316';
    if (lower.includes('adenocarcinoma')) return '#ef4444';
    return '#22c55e';
  };

  useEffect(() => {
    if (patientId) {
      loadPredictions();
    }
  }, [patientId]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  if (error) return (
    <section className="section">
      <p className="eyebrow">PREDICTION HISTORY</p>
      <h1>Prediction History</h1>
      <div style={{ 
        padding: '20px', 
        background: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '8px',
        color: '#991b1b',
        marginBottom: '20px'
      }}>
        {error}
      </div>
      <Link to="/patients" className="button secondary">Back to Patients</Link>
    </section>
  );

  return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p className="eyebrow">PREDICTION HISTORY</p>
          <h1>Prediction History for Patient {patientId}</h1>
        </div>
        <Link to="/patients/new" className="button">New Prediction</Link>
      </div>

      {predictions.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#f8fafc', 
          border: '1px dashed #cbd5e1', 
          borderRadius: '12px' 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No Predictions Yet</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            This patient doesn't have any AI predictions yet. Create a new prediction to get started.
          </p>
          <Link to="/patients/new" className="button">Create New Prediction</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {predictions.map((prediction) => (
            <Link 
              to={`/prediction/${prediction.id}/${patientId}`}
              key={prediction.id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '20px',
                alignItems: 'center',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {/* Thumbnail */}
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={getImageUrl(prediction.overlayPath)} 
                    alt={`Prediction ${prediction.id}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Details */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                      {prediction.predictedClass}
                    </h3>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      background: `${getPredictedClassColor(prediction.predictedClass)}15`,
                      color: getPredictedClassColor(prediction.predictedClass)
                    }}>
                      {prediction.predictedClass}
                    </span>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      background: `${getConfidenceColor(prediction.confidence)}15`,
                      color: getConfidenceColor(prediction.confidence)
                    }}>
                      {(prediction.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '24px', color: '#64748b', fontSize: '14px', flexWrap: 'wrap' }}>
                    <span>📅 {new Date(prediction.createdAt).toLocaleString()}</span>
                    <span>ID: #{prediction.id}</span>
                  </div>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ 
                    padding: '8px 16px', 
                    background: '#f1f5f9', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    View Details →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default PredictionHistory;