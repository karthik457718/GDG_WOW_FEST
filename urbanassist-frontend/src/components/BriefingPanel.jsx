import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { getBriefing } from '../api';

export default function BriefingPanel() {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBriefing();
      setBriefing(data.briefing);
    } catch (err) {
      setError('Could not retrieve briefing. Make sure backend is running and GEMINI_API_KEY is configured.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
    // Refresh briefing every 2 minutes
    const interval = setInterval(fetchBriefing, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cc-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-title)' }}>
          <Sparkles size={18} style={{ color: '#3b82f6' }} />
          Commissioner's AI Briefing
        </div>
        <button
          onClick={fetchBriefing}
          disabled={loading}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          title="Refresh briefing"
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
        </button>
      </div>

      <div style={{
        background: '#f9fafb',
        borderLeft: '3px solid #3b82f6',
        padding: '15px',
        borderRadius: '0 8px 8px 0',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #e5e7eb',
        borderLeftWidth: '3px'
      }}>
        {loading ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="shimmer-bar" style={{ width: '100%', height: '12px' }}></div>
            <div className="shimmer-bar" style={{ width: '90%', height: '12px' }}></div>
            <div className="shimmer-bar" style={{ width: '75%', height: '12px' }}></div>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', gap: '8px', color: '#ef4444', fontSize: '13px', alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <span>{error}</span>
          </div>
        ) : (
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151', fontStyle: 'italic', margin: 0 }}>
            "{briefing}"
          </p>
        )}
      </div>

      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .shimmer-bar {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
