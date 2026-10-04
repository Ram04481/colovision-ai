import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { downloadReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportInfo, setReportInfo] = useState<any>(null);

  const loadReport = async () => {
    if (!id) {
      setError('Invalid report ID');
      setLoading(false);
      return;
    }

    try {
      // Fetch report info first
      // We would need an endpoint to get report info
      // For now, show a message
      setError('Report viewing requires the report to be generated first through a prediction.');
    } catch (error) {
      console.error('Failed to load report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    
    try {
      const blob = await downloadReport(parseInt(id, 10));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
      setError('Failed to download report');
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">REPORT VIEW</p>
          <h1>Report View</h1>
        </div>
        <a href="/dashboard" className="button secondary">Back to Dashboard</a>
      </div>

      {error && (
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
      )}

      <div style={{ 
        padding: '30px', 
        background: '#f9fafb', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '10px', color: '#374151' }}>Report View</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Reports are generated automatically after a prediction is completed. 
          Once a prediction is made, the system generates a PDF report that can be viewed and downloaded here.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center', 
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          <button 
            className="button" 
            onClick={handleDownload}
            disabled={!true}
          >
            Download Report (PDF)
          </button>
          <a href="/dashboard" className="button secondary">Back to Dashboard</a>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px' }}>
        <h3 style={{ color: '#92400e', marginBottom: '10px' }}>How Reports Work</h3>
        <ul style={{ textAlign: 'left', color: '#92400e', lineHeight: '1.8' }}>
          <li>Reports are generated automatically after a successful prediction</li>
          <li>Each report contains the prediction results, confidence scores, and segmentation visualization</li>
          <li>Reports are saved as PDF files and can be downloaded</li>
          <li>Only authorized users (patient's doctor or admin) can access reports</li>
        </ul>
      </div>
    </section>
  );
}

export default ReportView;