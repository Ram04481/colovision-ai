import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPredictions, Prediction } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ProbabilityItem {
  label: string;
  value: number;
  color: string;
}

export const PredictionDetail: React.FC = () => {
  const { id, patientId } = useParams<{ id: string; patientId: string }>();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = useAuth();

  const probabilities: ProbabilityItem[] = [
    { label: 'Adenocarcinoma', value: 0, color: '#ef4444' },
    { label: 'High-grade IN', value: 0, color: '#dc2626' },
    { label: 'Low-grade IN', value: 0, color: '#f97316' },
    { label: 'Normal', value: 0, color: '#22c55e' },
    { label: 'Polyp', value: 0, color: '#eab308' },
    { label: 'Serrated Adenoma', value: 0, color: '#a855f7' },
  ];

  const loadPrediction = async () => {
    if (!id || !patientId) {
      setError('Invalid prediction or patient ID');
      setLoading(false);
      return;
    }

    try {
      const predictions = await getPredictions(parseInt(patientId, 10));
      const found = predictions.find(p => p.id === parseInt(id, 10));
      
      if (!found) {
        setError('Prediction not found');
        setLoading(false);
        return;
      }

      setPrediction(found);
      
      // Update probabilities array
      probabilities[0].value = found.adenocarcinomaProbability;
      probabilities[1].value = found.highGradeProbability;
      probabilities[2].value = found.lowGradeProbability;
      probabilities[3].value = found.normalProbability;
      probabilities[4].value = found.polypProbability;
      probabilities[5].value = found.serratedProbability;
      
    } catch (error) {
      console.error('Failed to load prediction:', error);
      setError('Failed to load prediction details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && patientId) {
      loadPrediction();
    }
  }, [id, patientId]);

  const getImageUrl = (path: string) => {
    // Convert backslashes to forward slashes and prepend API base URL
    const normalizedPath = path.replace(/\\/g, '/');
    return `http://localhost:8080/${normalizedPath}`;
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  if (error) return (
    <section className="section">
      <p className="eyebrow">PREDICTION DETAIL</p>
      <h1>Prediction Detail</h1>
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

  if (!prediction) return null;

  const predictedClass = prediction.predictedClass;
  const confidence = prediction.confidence * 100;

  return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p className="eyebrow">PREDICTION DETAIL</p>
          <h1>{predictedClass}</h1>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>
            Patient ID: {patientId} | Prediction ID: {prediction.id} | {new Date(prediction.createdAt).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={`/patients/${patientId}`} className="button secondary">Back to Patient</Link>
          <Link to={`/report/${prediction.id}`} className="button">View Report</Link>
        </div>
      </div>

      {/* Main Result Card */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Prediction Summary */}
        <div style={{ 
          padding: '24px', 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px',
          borderLeft: `4px solid ${predictedClass.toLowerCase().includes('high-grade') ? '#dc2626' : predictedClass.toLowerCase().includes('low-grade') ? '#f97316' : '#22c55e'}`
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>AI Prediction Result</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%',
              background: `conic-gradient(${predictedClass.toLowerCase().includes('high-grade') ? '#dc2626' : predictedClass.toLowerCase().includes('low-grade') ? '#f97316' : '#22c55e'} ${confidence}%, #e2e8f0 ${confidence}%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                {confidence.toFixed(1)}%
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {predictedClass}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                Confidence Score
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${confidence}%`, 
              height: '100%', 
              background: predictedClass.toLowerCase().includes('high-grade') ? '#dc2626' : predictedClass.toLowerCase().includes('low-grade') ? '#f97316' : '#22c55e',
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Segmentation Mask & Overlay */}
        <div style={{ 
          padding: '24px', 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Visualization</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Segmentation Mask</p>
              <img 
                src={getImageUrl(prediction.segmentationPath)} 
                alt="Segmentation Mask"
                style={{ 
                  width: '100%', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  background: '#f1f5f9'
                }}
              />
            </div>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Overlay</p>
              <img 
                src={getImageUrl(prediction.overlayPath)} 
                alt="Overlay"
                style={{ 
                  width: '100%', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  background: '#f1f5f9'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6-Class Probabilities */}
      <div style={{ 
        padding: '24px', 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>Class Probabilities (6 Classes)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {probabilities.map((prob, index) => {
            const percentage = prob.value * 100;
            const percentageStr = percentage.toFixed(2);
            const isPredicted = prob.label.toLowerCase().replace(/\s+/g, '-') === predictedClass.toLowerCase().replace(/\s+/g, '-');
            return (
              <div key={index} style={{ 
                background: isPredicted ? `${prob.color}15` : 'white',
                border: `1px solid ${isPredicted ? prob.color : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '4px', 
                  background: prob.color,
                  flexShrink: 0
                }} />
                <div style={{ 
                  flex: 1, 
                  fontWeight: isPredicted ? '600' : '500',
                  color: '#1e293b'
                }}>
                  {prob.label}
                  {isPredicted && <span style={{ marginLeft: '8px', fontSize: '12px', background: prob.color, color: 'white', padding: '2px 6px', borderRadius: '4px' }}>PREDICTED</span>}
                </div>
                <div style={{ 
                  width: '200px', 
                  height: '8px', 
                  background: '#e2e8f0', 
                  borderRadius: '4px', 
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <div style={{ 
                    width: `${Math.max(percentage, 0.1)}%`, 
                    height: '100%', 
                    background: prob.color,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <span style={{ 
                  fontWeight: '600', 
                  color: prob.value > 0.01 ? prob.color : '#64748b',
                  minWidth: '60px',
                  textAlign: 'right'
                }}>
                  {percentageStr}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Info */}
      <div style={{ 
        padding: '24px', 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>Technical Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prediction ID</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>#{prediction.id}</p>
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient ID</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{patientId}</p>
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyzed At</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{new Date(prediction.createdAt).toLocaleString()}</p>
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{confidence.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#fffbeb', 
        border: '1px solid #fde68a', 
        borderRadius: '8px',
        color: '#92400e',
        fontSize: '14px'
      }}>
        <strong>Disclaimer:</strong> This AI analysis is for research and decision-support use only. 
        It is not a definitive medical diagnosis. Please consult with a qualified healthcare professional 
        for clinical decision-making.
      </div>
    </section>
  );
};

export default PredictionDetail;