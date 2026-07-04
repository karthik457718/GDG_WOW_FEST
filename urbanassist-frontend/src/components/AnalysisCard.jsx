import React from 'react';
import { CheckCircle, AlertTriangle, Clock, Server, Layers, FileText } from 'lucide-react';

export default function AnalysisCard({ analysis, onReset }) {
  const getPriorityClass = (priority) => {
    if (priority === 'critical') return 'critical';
    if (priority === 'medium') return 'medium';
    return 'low';
  };

  return (
    <div className="premium-card animate-fade-in" style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 30px',
      textAlign: 'center',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ display: 'inline-flex', padding: '15px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-low)', marginBottom: '20px' }}>
        <CheckCircle size={48} />
      </div>

      <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        Grievance Lodged Successfully!
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
        Your report has been analyzed by our AI system and routed to the correct department.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px',
        textAlign: 'left',
        marginBottom: '30px'
      }}>
        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <FileText size={14} />
            Docket ID
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700 }}>
            {analysis.docket_id}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Server size={14} />
            Assigned Department
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            {analysis.department}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <AlertTriangle size={14} />
            Priority Level
          </div>
          <div>
            <span className={`badge ${getPriorityClass(analysis.priority)}`}>
              {analysis.priority}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Clock size={14} />
            Estimated SLA / ETA
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            {analysis.eta}
          </span>
        </div>
      </div>

      {analysis.was_merged && (
        <div className="glass-panel" style={{
          padding: '15px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          textAlign: 'left',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          marginBottom: '30px'
        }}>
          <Layers style={{ color: 'var(--accent-color)', flexShrink: 0 }} size={24} />
          <div>
            <strong>Merged with Active Incident</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
              We detected {analysis.cluster_count - 1} other report(s) nearby. Your grievance was merged into cluster <strong>{analysis.incident_id}</strong> to accelerate resolution.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="btn-glow-pulse"
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        Lodge Another Grievance
      </button>
    </div>
  );
}
