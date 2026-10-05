import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport, downloadReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReportInfo {
  id: number;
  prediction_id: number;
  report_path: string;
}

export const ReportView: React.FC = () => {
  const { id, patientId, predictionId } = useParams<{ id: string; patientId: string; predictionId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const { role } = useAuth();

  const loadReport = async () => {
    const reportId = id || predictionId;
    if (!reportId) {
      setError('Invalid report ID');
      setLoading(false);
      return;
    }

    try {
      const data = await getReport(parseInt(reportId, 10));
      setReportInfo(data);
    } catch (error) {
      console.error('Failed to load report:', error);
      setError('Failed to load report. The report may not have been generated yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const reportId = id || predictionId;
    if (!reportId) return;
    
    try {
      setDownloading(true);
      const blob = await downloadReport(parseInt(reportId, 10));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
      setError('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenInNewTab = async () => {
    const reportId = id || predictionId;
    if (!reportId) return;
    
    try {
      const blob = await downloadReport(parseInt(reportId, 10));
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to open report:', error);
      setError('Failed to open report');
    }
  };

  useEffect(() => {
    loadReport();
  }, [id, predictionId]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  if (error && !reportInfo) return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">REPORT VIEW</p>
          <h1>Report View</h1>
        </div>
        <Link to="/dashboard" className="button secondary">Back to Dashboard</Link>
      </div>

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

      <div style={{ 
        padding: '30px', 
        background: '#f9fafb', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '10px', color: '#374151' }}>Report Not Available</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Reports are generated automatically after a prediction is completed. 
          Please run a prediction first, then the report will be available here.
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center', 
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          <Link to="/patients" className="button">Go to Patients</Link>
          <Link to="/dashboard" className="button secondary">Back to Dashboard</Link>
        </div>
      </div>
    </section>
  );

  return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p className="eyebrow">REPORT VIEW</p>
          <h1>Analysis Report</h1>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>
            Prediction ID: {reportInfo?.prediction_id} | Report ID: {reportInfo?.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="button secondary" 
            onClick={handleOpenInNewTab}
            disabled={!reportInfo}
          >
            Open in New Tab
          </button>
          <button 
            className="button" 
            onClick={handleDownload}
            disabled={downloading || !reportInfo}
          >
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <Link to="/dashboard" className="button secondary">Back to Dashboard</Link>
        </div>
      </div>

      <div style={{ 
        padding: '24px', 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Report Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report ID</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>#{reportInfo?.id}</p>
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prediction ID</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>#{reportInfo?.prediction_id}</p>
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Path</p>
            <p style={{ margin: 0, fontWeight: '500', color: '#1e293b', fontSize: '13px', wordBreak: 'break-all' }}>
              {reportInfo?.report_path}
            </p>
          </div>
        </div>
      </div>

      {/* PDF Embed Viewer */}
      <div style={{ 
        padding: '24px', 
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px',
        minHeight: '600px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Report Preview</h2>
        <div style={{ 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          overflow: 'hidden',
          background: '#f8fafc'
        }}>
          <iframe 
            src={`http://localhost:8080/api/reports/${reportInfo?.id}/download`}
            style={{ width: '100%', height: '550px', border: 'none' }}
            title="Analysis Report"
          />
        </div>
        
        <div style={{ marginTop: '16px', padding: '16px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', color: '#92400e' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Note:</strong> If the PDF doesn't display above, use the "Download PDF" or "Open in New Tab" buttons above. 
            Some browsers may block embedded PDFs for security reasons.
          </p>
        </div>
      </div>

      {/* How Reports Work */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <h3 style={{ color: '#374151', marginBottom: '10px' }}>About Analysis Reports</h3>
        <ul style={{ textAlign: 'left', color: '#6b7280', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>Reports are generated automatically after a successful prediction</li>
          <li>Each report contains the prediction results, confidence scores, and patient information</li>
          <li>Reports are saved as PDF files and can be downloaded or viewed in browser</li>
          <li>Only authorized users (patient's doctor or admin) can access reports</li>
          <li>Reports include the predicted tissue class, confidence percentage, and timestamp</li>
        </ul>
      </div>
    </section>
  );
};

export default ReportView;