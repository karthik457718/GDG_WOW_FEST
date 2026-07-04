import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenPortal from './components/CitizenPortal';
import AnalysisCard from './components/AnalysisCard';
import CommandCenter from './components/CommandCenter';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import { authLogout } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('citizen');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiStatus, setApiStatus] = useState('offline');
  const [user, setUser] = useState(localStorage.getItem('ua_username') || null);
  const [authScreen, setAuthScreen] = useState('landing');
  const [authInitialView, setAuthInitialView] = useState('signin');
  const [showPortal, setShowPortal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (err) {
      setApiStatus('offline');
    }
  };

  useEffect(() => {
    checkBackendHealth();
    // Poll API status every 10 seconds for real-time monitoring
    const interval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const username = localStorage.getItem('ua_username');
    if (username) {
      try {
        await authLogout(username);
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
    localStorage.removeItem('ua_token');
    localStorage.removeItem('ua_username');
    setUser(null);
    setAuthScreen('landing');
    setShowPortal(false);
  };

  if (!showPortal) {
    if (authScreen === 'auth') {
      return (
        <AuthPage 
          key={authInitialView}
          initialView={authInitialView}
          onLogin={(username) => {
            setUser(username);
            setShowPortal(true);
          }} 
          onBack={() => setAuthScreen('landing')} 
        />
      );
    }
    return (
      <LandingPage 
        user={user}
        onGetStarted={(view) => {
          if (view === 'portal') {
            setShowPortal(true);
          } else {
            setAuthInitialView(view || 'signup');
            setAuthScreen('auth');
          }
        }} 
      />
    );
  }

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
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-15%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(29, 78, 216, 0.05) 0%, transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>

      {/* Main Header / Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If switching views, clear the success receipt state
          if (tab === 'official') setAnalysisResult(null);
        }} 
        apiStatus={apiStatus} 
        user={user}
        onLogout={handleLogout}
      />

      {/* View Switch Rendering Router */}
      <main style={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1
      }}>
        {activeTab === 'citizen' ? (
          analysisResult ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexGrow: 1, 
              padding: '20px',
              minHeight: 'calc(100vh - 120px)'
            }}>
              <AnalysisCard 
                analysis={analysisResult} 
                onReset={() => setAnalysisResult(null)} 
              />
            </div>
          ) : (
            <CitizenPortal 
              onReportSubmitted={(data) => setAnalysisResult(data)} 
            />
          )
        ) : (
          <CommandCenter />
        )}
      </main>
    </div>
  );
}