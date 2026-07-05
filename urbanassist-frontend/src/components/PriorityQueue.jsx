import React from 'react';
import { ShieldAlert, Layers, MapPin, Eye } from 'lucide-react';

export default function PriorityQueue({ queue, onLocateIncident }) {
  const getPriorityBadgeClass = (priority) => {
    if (priority === 3) return 'critical';
    if (priority === 2) return 'medium';
    return 'low';
  };

  const getPriorityLabel = (priority) => {
    if (priority === 3) return 'critical';
    if (priority === 2) return 'medium';
    return 'low';
  };

  return (
    <div className="cc-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-title)' }}>
        <ShieldAlert size={18} style={{ color: '#ef4444' }} />
        Active Incident Dispatch Queue
      </div>

      <div style={{ overflowX: 'auto', flexGrow: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', color: '#374151' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Incident ID</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Department</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Reports</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Priority</th>
              <th style={{ padding: '12px 10px', fontWeight: 600 }}>Resolution SLA</th>
              <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 10px', textAlign: 'center', color: '#9ca3af' }}>
                  No open incidents in dispatch. City infrastructure is clean!
                </td>
              </tr>
            ) : (
              queue.map((incident) => (
                <tr 
                  key={incident.id} 
                  style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#111827' }}>
                    {incident.id}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 500 }}>
                    {incident.department}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} style={{ color: '#6b7280' }} />
                      <span>{incident.count}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span className={`badge ${getPriorityBadgeClass(incident.priority)}`}>
                      {getPriorityLabel(incident.priority)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 500 }}>
                    {incident.eta}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => onLocateIncident(incident.lat, incident.lng)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        transition: 'all 0.25s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      title="View incident on map"
                    >
                      <MapPin size={12} />
                      Locate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .table-row-hover:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}
