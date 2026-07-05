import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenPortal from './components/CitizenPortal';
import AnalysisCard from './components/AnalysisCard';
import CommandCenter from './components/CommandCenter';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import { authLogout } from './api';
import { ShieldAlert, Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('citizen');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiStatus, setApiStatus] = useState('offline');

  // Auth state — persisted in localStorage
  const [user, setUser] = useState(localStorage.getItem('ua_username') || null);
  const [userRole, setUserRole] = useState(localStorage.getItem('ua_role') || null); // 'citizen' | 'official'

  // Screen state: 'landing' | 'citizen-auth' | 'official-auth' | 'citizen-portal' | 'command-center'
  const [screen, setScreen] = useState(() => {
    // On load: if already logged in, restore the portal
    const savedRole = localStorage.getItem('ua_role');
    const savedUser = localStorage.getItem('ua_username');
    if (savedUser && savedRole === 'official') return 'landing'; // go to landing, they pick where to go
    if (savedUser && savedRole === 'citizen') return 'landing';
    return 'landing';
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      setApiStatus(res.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const username = localStorage.getItem('ua_username');
    if (username) {
      try { await authLogout(username); } catch (err) { console.error('Logout failed:', err); }
    }
    localStorage.removeItem('ua_token');
    localStorage.removeItem('ua_username');
    localStorage.removeItem('ua_role');
    setUser(null);
    setUserRole(null);
    setScreen('landing');
    setAnalysisResult(null);
  };

  // Called when user successfully logs in through AuthPage
  const handleCitizenLogin = (username) => {
    setUser(username);
    setUserRole('citizen');
    localStorage.setItem('ua_role', 'citizen');
    setScreen('citizen-portal');
  };

  const handleOfficialLogin = (username) => {
    setUser(username);
    setUserRole('official');
    localStorage.setItem('ua_role', 'official');
    setScreen('command-center');
  };

  // ── LANDING PAGE ─────────────────────────────────────────────────────────
  if (screen === 'landing') {
    return (
      <LandingPage
        user={user}
        userRole={userRole}
        onGetStarted={(destination) => {
          if (destination === 'citizen-portal') {
            // If already logged in as citizen, go directly
            if (user && userRole === 'citizen') {
              setScreen('citizen-portal');
            } else if (user && userRole === 'official') {
              // Officials can view citizen portal too (no re-auth needed)
              setScreen('citizen-portal');
            } else {
              setScreen('citizen-auth');
            }
          } else if (destination === 'command-center') {
            // Must be an official — always require official auth
            if (user && userRole === 'official') {
              setScreen('command-center');
            } else {
              setScreen('official-auth');
            }
          } else if (destination === 'signin') {
            setScreen('citizen-auth');
          } else if (destination === 'signup') {
            setScreen('citizen-auth');
          }
        }}
      />
    );
  }

  // ── CITIZEN AUTH PAGE ────────────────────────────────────────────────────
  if (screen === 'citizen-auth') {
    return (
      <AuthPage
        mode="citizen"
        initialView="signin"
        onLogin={handleCitizenLogin}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // ── OFFICIAL AUTH PAGE ───────────────────────────────────────────────────
  if (screen === 'official-auth') {
    return (
      <AuthPage
        mode="official"
        initialView="signin"
        onLogin={handleOfficialLogin}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // ── RESTRICTED ACCESS (citizen trying to access Command Center) ──────────
  if (screen === 'command-center' && userRole !== 'official') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '24px',
          padding: '60px 50px',
          textAlign: 'center',
          maxWidth: '460px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: '#fef2f2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <Lock size={32} style={{ color: '#ef4444' }} />
          </div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>
            Restricted Access
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 32px' }}>
            The Command Center is accessible only to verified municipal officials. Please sign in with an authorized official account to continue.
          </p>
          <button
            onClick={() => setScreen('official-auth')}
            style={{
              background: '#111827', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '14px 32px', fontFamily: "'Inter', sans-serif",
              fontWeight: 700, fontSize: '14px', cursor: 'pointer', width: '100%',
              marginBottom: '12px'
            }}
          >
            Sign In as Official
          </button>
          <button
            onClick={() => setScreen('landing')}
            style={{
              background: 'transparent', color: '#6b7280', border: 'none',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN APP (Citizen Portal OR Command Center) ──────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative ambient background glows */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-10%',
        width: '50vw', height: '50vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        zIndex: -1, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-15%',
        width: '60vw', height: '60vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(29, 78, 216, 0.05) 0%, transparent 70%)',
        zIndex: -1, pointerEvents: 'none'
      }} />

      <Navbar
        activeTab={screen === 'command-center' ? 'official' : 'citizen'}
        setActiveTab={(tab) => {
          if (tab === 'official') {
            if (userRole === 'official') {
              setScreen('command-center');
            } else {
              setScreen('official-auth');
            }
          } else {
            setScreen('citizen-portal');
            setAnalysisResult(null);
          }
        }}
        apiStatus={apiStatus}
        user={user}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1
      }}>
        {screen === 'citizen-portal' ? (
          analysisResult ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexGrow: 1, padding: '20px', minHeight: 'calc(100vh - 120px)'
            }}>
              <AnalysisCard
                analysis={analysisResult}
                onReset={() => setAnalysisResult(null)}
              />
            </div>
          ) : (
            <CitizenPortal onReportSubmitted={(data) => setAnalysisResult(data)} />
          )
        ) : (
          <CommandCenter />
        )}
      </main>
    </div>
  );
}