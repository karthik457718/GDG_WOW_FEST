import React, { useState, useEffect } from 'react';
import { ShieldAlert, Server, BarChart3, AlertOctagon } from 'lucide-react';
import IncidentMap from './IncidentMap';
import PriorityQueue from './PriorityQueue';
import BriefingPanel from './BriefingPanel';
import { getClusters, getQueue } from '../api';

export default function CommandCenter() {
  const [clusters, setClusters] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Custom map reference state to center map on locate click
  const [mapCenter, setMapCenter] = useState(null);

  const fetchDashboardData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    setError(null);
    try {
      const [clustersData, queueData] = await Promise.all([
        getClusters(),
        getQueue(),
      ]);
      setClusters(clustersData);
      setQueue(queueData);
    } catch (err) {
      setError('Could not connect to FastAPI server. Ensure python app is running.');
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll data every 10 seconds for real-time dashboard updates
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLocateIncident = (lat, lng) => {
    // We can change center state or notify map. For react-leaflet, we can update MapContainer center.
    // However, MapContainer center is immutable after mount unless we use state + map.setView.
    // In our map component we can use a helper component to change view dynamically.
    setMapCenter([lat, lng]);
  };

  // Live Aggregated Statistics
  const totalOpenIncidents = clusters.length;
  const criticalCount = clusters.filter(c => c.priority === 3).length;
  const totalMergedReports = clusters.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="animate-fade-in" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 20px 40px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Top Banner stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px'
      }}>
        <div className="premium-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)' }}>
            <Server size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Clusters</div>
            <strong style={{ fontSize: '24px', fontWeight: 800 }}>{totalOpenIncidents}</strong>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'var(--color-critical-glow)', color: 'var(--color-critical)' }}>
            <AlertOctagon size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical Dispatches</div>
            <strong style={{ fontSize: '24px', fontWeight: 800 }}>{criticalCount}</strong>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)', color: '#fff' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consolidated Reports</div>
            <strong style={{ fontSize: '24px', fontWeight: 800 }}>{totalMergedReports}</strong>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-low)' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Status</div>
            <strong style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-low)' }}>MONITORED</strong>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 500px) 1fr',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Left Side: Briefing & Table Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <BriefingPanel />
          <PriorityQueue queue={queue} onLocateIncident={handleLocateIncident} />
        </div>

        {/* Right Side: Map */}
        <div className="premium-card" style={{ height: '620px', overflow: 'hidden', padding: '5px' }}>
          <IncidentMap clusters={clusters} center={mapCenter} />
        </div>
      </div>
    </div>
  );
}
