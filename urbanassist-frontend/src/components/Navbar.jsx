import React from 'react';
import { ShieldAlert, Users, Radio, Cpu, LogOut, UserCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus, user, onLogout }) {
  return (
    <header className="glass-panel" style={{
      margin: '20px 20px 10px 20px',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
      animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShieldAlert size={28} style={{ color: 'var(--accent-color)', filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }} />
        <div>
          <h1 style={{ 
            fontFamily: 'var(--font-title)', 
            fontSize: '20px', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            background: 'linear-gradient(90deg, #fff 0%, #9ca3af 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            URBAN ASSIST <span style={{ color: 'var(--accent-color)', WebkitTextFillColor: 'initial', filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.3))' }}>AI</span>
          </h1>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Civic Grievance Engine</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setActiveTab('citizen')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: activeTab === 'citizen' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            background: activeTab === 'citizen' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'citizen' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'citizen' ? '0 0 20px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0,0,0,0.3)' : 'none',
            transform: activeTab === 'citizen' ? 'translateY(0)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'citizen') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'citizen') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <Users size={16} />
          Citizen Portal
        </button>
        <button 
          onClick={() => setActiveTab('official')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: activeTab === 'official' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            background: activeTab === 'official' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'official' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'official' ? '0 0 20px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0,0,0,0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'official') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'official') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <Radio size={16} />
          Command Center
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span className={`badge ${apiStatus === 'online' ? 'low' : 'critical'}`} style={{ 
          textTransform: 'none', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          fontWeight: 600,
          boxShadow: apiStatus === 'online' ? '0 0 10px rgba(16,185,129,0.15)' : '0 0 10px rgba(239,68,68,0.2)'
        }}>
          <Cpu size={12} />
          {apiStatus === 'online' ? 'Server Connected' : 'Server Offline'}
        </span>

        {user && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
            }}>
              <UserCircle size={16} style={{ color: 'var(--accent-color)', filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.4))' }} />
              {user}
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-sm)',
                color: 'rgba(248, 113, 113, 0.95)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.8)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(239, 68, 68, 0.40)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                e.currentTarget.style.color = 'rgba(248, 113, 113, 0.95)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
