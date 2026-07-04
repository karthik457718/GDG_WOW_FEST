import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, AlertOctagon, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in Vite using CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map key for dept keys
const DEPT_LABELS = {
  water: "Water & Sewerage",
  roads: "Roads & Infrastructure",
  electricity: "Electricity Dept",
  sanitation: "Sanitation Dept",
  civil: "Civil Registration",
  revenue: "Revenue / Property Tax",
};

// Create custom DOM Marker Icon matching the dashboard styles
const createClusterIcon = (cluster) => {
  const priority = cluster.priority; // 1, 2, 3
  const priorityClass = priority === 3 ? 'critical' : (priority === 2 ? 'medium' : 'low');
  
  return L.divIcon({
    html: `<span>${cluster.count}</span>`,
    className: `custom-pin ${priorityClass}`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function IncidentMap({ clusters, center }) {
  const defaultCenter = [17.71, 83.30];

  const getPriorityLabel = (p) => {
    if (p === 3) return 'critical';
    if (p === 2) return 'medium';
    return 'low';
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />
        <ChangeView center={center} />

        {clusters.map((cluster) => (
          <Marker
            key={cluster.id}
            position={[cluster.lat, cluster.lng]}
            icon={createClusterIcon(cluster)}
          >
            <Popup>
              <div style={{ padding: '5px', minWidth: '180px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '5px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{cluster.id}</span>
                  <span className={`badge ${getPriorityLabel(cluster.priority)}`} style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
                    {getPriorityLabel(cluster.priority)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Department: <strong style={{ color: '#fff' }}>{DEPT_LABELS[cluster.dept] || cluster.dept}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                    <Layers size={13} />
                    Complaints: <strong style={{ color: '#fff' }}>{cluster.count} reports</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                    <Clock size={13} />
                    Status: <strong style={{ color: 'var(--color-low)' }}>{cluster.status}</strong>
                  </div>
                  {cluster.urgent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-critical)', fontWeight: 600, marginTop: '2px' }}>
                      <AlertOctagon size={13} />
                      Urgent Incident
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        padding: '10px 15px',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'none'
      }}>
        <div style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '2px' }}>
          Incident Priority
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-critical)' }}></div>
          <span>Critical Priority (SLA: Immediate)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-medium)' }}></div>
          <span>Medium Priority</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-low)' }}></div>
          <span>Low Priority</span>
        </div>
      </div>
    </div>
  );
}
