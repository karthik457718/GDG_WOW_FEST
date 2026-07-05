import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ShieldAlert, Cpu, MapPin, Zap, BarChart3, ArrowRight, ChevronDown,
  ChevronRight, Activity, Globe, Mail,
  Phone, Shield, CheckCircle, TrendingUp, Users, Clock
} from 'lucide-react';

import avatarManGlasses from '../assets/avatar_man_glasses.png';
import avatarWomanPink from '../assets/avatar_woman_pink.png';
import avatarManDark from '../assets/avatar_man_dark.png';
import glowingShield3d from '../assets/glowing_shield_3d.png';

/* ─── Magnetic Button Hook ─────────────────────────────────────────── */
function useMagnet(strength = 0.35) {
  const ref = useRef(null);
  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [strength]);
  const onMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = '';
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

/* ─── Animated Counter ─────────────────────────────────────────────── */
function AnimCounter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const numeric = parseFloat(String(target).replace(/[^0-9.]/g, ''));
        const steps = 60;
        let current = 0;
        const inc = numeric / steps;
        const iv = setInterval(() => {
          current = Math.min(current + inc, numeric);
          setCount(current);
          if (current >= numeric) clearInterval(iv);
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  const display = count > 0
    ? (Number.isInteger(parseFloat(String(target))) ? Math.round(count) : count.toFixed(1))
    : 0;
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── 3D Tilt Card ─────────────────────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const handleMouseMove = (e) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 16;
    el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px)`;
    el.style.boxShadow = `${-x * 1.5}px ${y * 1.5}px 40px rgba(59,130,246,0.2)`;
  };
  const handleMouseLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = '';
    el.style.boxShadow = '';
  };
  return (
    <div ref={ref} className={className}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', willChange: 'transform' }}>
      {children}
    </div>
  );
}

export default function LandingPage({ onGetStarted, user, userRole }) {
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const heroRef = useRef(null);
  const [activeQueue, setActiveQueue] = useState(0);
  const [hoveredStep, setHoveredStep] = useState(null);

  const primaryBtn = useMagnet(0.4);
  const outlineBtn = useMagnet(0.4);

  const queuesData = [
    { id: 'water', name: 'Water & Sewerage', desc: 'Pipeline ruptures, sewage blockages, and water supply contamination.', stat: '12 Active Complaints', sla: '2.5 hrs Avg Dispatch', color: '#3b82f6', icon: '💧' },
    { id: 'roads', name: 'Roads & Infrastructure', desc: 'Pothole restoration, traffic signal failures, and street sign repairs.', stat: '28 Active Complaints', sla: '4.8 hrs Avg Dispatch', color: '#10b981', icon: '🛣️' },
    { id: 'electricity', name: 'Electricity & Grid', desc: 'High-voltage line hazards, streetlight failures, and local power cuts.', stat: '8 Active Complaints', sla: '1.2 hrs Avg Dispatch', color: '#f59e0b', icon: '⚡' },
    { id: 'sanitation', name: 'Sanitation & Waste', desc: 'Illegal garbage dumping, public bin overflows, and drainage clogging.', stat: '19 Active Complaints', sla: '3.1 hrs Avg Dispatch', color: '#ec4899', icon: '🗑️' }
  ];

  const features = [
    { icon: <Cpu size={22} />, title: 'ML-Powered Routing', desc: 'TF-IDF + Naive Bayes classifier routes every complaint to the exact department in under 2 seconds.', color: '#3b82f6' },
    { icon: <MapPin size={22} />, title: 'Geo Clustering', desc: 'Haversine formula merges nearby complaints within 300m to prevent duplicate dispatches.', color: '#10b981' },
    { icon: <BarChart3 size={22} />, title: 'Live Command Center', desc: 'Officials get a real-time priority queue with SLA timers, cluster maps, and AI briefings.', color: '#f59e0b' },
    { icon: <Shield size={22} />, title: 'Verified Auth', desc: 'Brevo OTP-based email verification for citizens and officials with role-based access control.', color: '#8b5cf6' },
    { icon: <TrendingUp size={22} />, title: 'Priority Scoring', desc: 'Urgency scoring from 1–10 triggers immediate dispatch for critical infrastructure failures.', color: '#ef4444' },
    { icon: <Globe size={22} />, title: 'Civic Transparency', desc: 'Citizens track complaint status, expected resolution date, and assigned department in real time.', color: '#06b6d4' },
  ];

  const floatingAvatars = [
    { id: 'ramesh', name: 'Ramesh K.', role: 'Citizen', issue: 'Reported water logging near market', dept: 'Water & Sewerage', status: 'Routed to Water', img: avatarManGlasses, style: { top: '16%', left: '6%', width: '90px', height: '90px' }, delay: '0s', color: 'rgba(59, 130, 246, 0.5)' },
    { id: 'priya', name: 'Priya S.', role: 'Resident', issue: 'Broken street lamp on 4th cross', dept: 'Electricity Dept', status: 'SLA Dispatched', img: avatarWomanPink, style: { top: '42%', right: '4%', width: '100px', height: '100px' }, delay: '1.5s', color: 'rgba(245, 158, 11, 0.5)' },
    { id: 'aniket', name: 'Aniket M.', role: 'Local Resident', issue: 'Garbage heap clearing delay', dept: 'Sanitation Dept', status: 'Active Dispatch', img: avatarManDark, style: { bottom: '18%', left: '12%', width: '95px', height: '95px' }, delay: '3s', color: 'rgba(16, 185, 129, 0.5)' },
    { id: 'sonia', name: 'Sonia R.', role: 'Commuter', issue: 'Deep pothole on NH-16 bypass', dept: 'Roads & Infrastructure', status: 'Immediate SLA', img: null, initials: 'SR', style: { bottom: '24%', right: '14%', width: '80px', height: '80px' }, delay: '4.5s', color: 'rgba(239, 68, 68, 0.5)' }
  ];

  /* ── Scroll reveal ── */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('landing-visible'), i * 80);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.landing-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── Hero parallax cursor ── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const cx = (e.clientX - rect.width / 2) / rect.width;
      const cy = (e.clientY - rect.height / 2) / rect.height;
      const orbs = heroRef.current.querySelectorAll('.landing-orb');
      orbs.forEach((orb, i) => {
        const f = (i + 1) * 20;
        orb.style.transform = `translate(${cx * f}px, ${cy * f}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  /* ── Auto-cycle queue ── */
  useEffect(() => {
    const t = setInterval(() => setActiveQueue(p => (p + 1) % queuesData.length), 3200);
    return () => clearInterval(t);
  }, []);

  const scrollToFeatures = () => featuresRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing-page">

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero-bg">
          <div className="landing-orb landing-orb-1" />
          <div className="landing-orb landing-orb-2" />
          <div className="landing-orb landing-orb-3" />
          <div className="landing-grid-lines" />
          {[...Array(14)].map((_, i) => (
            <div key={i} className="hero-particle" style={{
              left: `${5 + i * 7}%`, top: `${8 + (i % 5) * 18}%`,
              animationDelay: `${i * 0.5}s`, animationDuration: `${3 + (i % 3)}s`
            }} />
          ))}
        </div>

        <nav className="landing-nav">
          <div className="landing-nav-brand">
            <ShieldAlert size={24} style={{ color: 'var(--accent-color)' }} />
            <span className="landing-nav-title">URBANASSIST<span style={{ color: 'var(--accent-color)' }}>.</span></span>
          </div>
          <div className="landing-nav-links">
            {[
              { label: 'Citizen Portal', action: () => onGetStarted('citizen-portal') },
              { label: 'Command Center', action: () => onGetStarted('command-center') },
              { label: 'About', action: scrollToFeatures },
              { label: 'Specs', action: scrollToFeatures },
            ].map((link) => (
              <button key={link.label} className="landing-nav-link nav-link-animated" onClick={link.action}>
                {link.label}
                <span className="nav-link-underline" />
              </button>
            ))}
          </div>
          <div className="landing-nav-actions">
            {user ? (
              <>
                <span className="landing-btn-ghost signed-in-label" style={{ cursor: 'default' }}>
                  {userRole === 'official' ? '🏛️' : '👤'} <strong>{user}</strong>
                </span>
                <button className="landing-btn-primary nav-cta-btn" onClick={() => onGetStarted('citizen-portal')}>
                  Enter Portal <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <button className="landing-btn-ghost nav-link-animated" onClick={() => onGetStarted('citizen-portal')}>
                  Sign in<span className="nav-link-underline" />
                </button>
                <button className="landing-btn-primary nav-cta-btn" onClick={() => onGetStarted('citizen-portal')}>Log in</button>
              </>
            )}
          </div>
        </nav>

        {floatingAvatars.map((avatar) => (
          <div key={avatar.id} className="floating-avatar-container"
            style={{ ...avatar.style, animationDelay: avatar.delay, boxShadow: `0 0 32px ${avatar.color}`, border: `2.5px solid ${avatar.color}` }}>
            {avatar.img
              ? <img src={avatar.img} alt={avatar.name} className="floating-avatar-img" />
              : <div className="floating-avatar-initials" style={{ background: avatar.color }}>{avatar.initials}</div>
            }
            <div className="avatar-tooltip">
              <div className="tooltip-header"><strong>{avatar.name}</strong> <span>{avatar.role}</span></div>
              <p>{avatar.issue}</p>
              <div className="tooltip-footer">
                <span className="tooltip-dept">{avatar.dept}</span>
                <span className="tooltip-status">{avatar.status}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="landing-hero-content">
          <div className="landing-hero-badge"><Zap size={14} /> AI-Powered Civic Dispatch</div>
          <h1 className="landing-hero-title">
            Ready to transform your city
            <br />with smart <span className="title-robot-emoji">🤖</span> AI routing?
          </h1>
          <p className="landing-hero-subtitle">
            File complaints, resolve duplicates, and dispatch municipal departments instantly — all powered by our machine learning grievance routing engine.
          </p>
          <div className="landing-hero-ctas">
            <button ref={primaryBtn.ref} onMouseMove={primaryBtn.onMouseMove} onMouseLeave={primaryBtn.onMouseLeave}
              className="landing-btn-primary landing-btn-lg hero-cta-primary" onClick={() => onGetStarted('citizen-portal')}>
              {user && userRole === 'citizen' ? 'Enter Portal' : 'Launch Portal'} <ArrowRight size={18} />
            </button>
            <button ref={outlineBtn.ref} onMouseMove={outlineBtn.onMouseMove} onMouseLeave={outlineBtn.onMouseLeave}
              className="landing-btn-outline landing-btn-lg hero-cta-outline" onClick={scrollToFeatures}>
              Explore Features
            </button>
          </div>
        </div>

        <div className="giant-stats-overlay">
          <span className="giant-stats-number">12,450+</span>
          <span className="giant-stats-label">Civic issues resolved by AI dispatch</span>
        </div>
        <button className="landing-scroll-hint" onClick={scrollToFeatures}><ChevronDown size={20} /></button>
      </section>

      {/* ═══════════════════ CAPABILITIES ═══════════════════ */}
      <section ref={featuresRef} className="landing-section denta-section">
        <div className="denta-container landing-animate">
          <div className="denta-left-col">
            <span className="denta-tag">AI Dispatch Systems</span>
            <h2 className="denta-title">Intelligent Care<br />for a Perfect<br />Smart City.</h2>
            <p className="denta-desc">From real-time ML categorization to instant geo-distance clustering and priority dispatch, we take a comprehensive approach to civic health.</p>
            <div className="denta-left-footer">
              <div className="denta-stat-item"><span className="denta-stat-label">System Performance</span><strong className="denta-stat-value">99.98% uptime</strong></div>
              <div className="denta-stat-item"><span className="denta-stat-label">Average Response</span><strong className="denta-stat-value">14 mins Dispatch</strong></div>
            </div>
          </div>
          <div className="denta-center-col">
            <div className="denta-shield-glow-wrapper">
              <img src={glowingShield3d} alt="Shield" className="denta-shield-img" />
              <div className="denta-shield-glow-orb" />
            </div>
            <div className="denta-floating-info-card">
              <div className="floating-info-header">
                <Activity size={14} style={{ color: queuesData[activeQueue].color }} /><span>Live Queue Status</span>
              </div>
              <h4 style={{ color: queuesData[activeQueue].color }}>{queuesData[activeQueue].icon} {queuesData[activeQueue].name}</h4>
              <p>{queuesData[activeQueue].desc}</p>
              <div className="floating-info-stats"><span>{queuesData[activeQueue].stat}</span><span>{queuesData[activeQueue].sla}</span></div>
            </div>
          </div>
          <div className="denta-right-col">
            <div className="denta-right-header"><h3>Live Dispatch Queues</h3><p>Hover a department to view active load and response stats.</p></div>
            <div className="denta-queues-list">
              {queuesData.map((q, idx) => (
                <div key={q.id} className={`denta-queue-item ${activeQueue === idx ? 'active' : ''}`}
                  onMouseEnter={() => setActiveQueue(idx)} style={{ '--accent-color': q.color }}>
                  <div className="queue-item-meta">
                    <span className="queue-number">0{idx + 1}</span>
                    <strong className="queue-name">{q.icon} {q.name}</strong>
                  </div>
                  <ChevronRight size={16} className="queue-arrow" />
                  <div className="queue-hover-border" />
                </div>
              ))}
            </div>
            <div className="denta-right-footer">
              <div className="denta-tech-info"><span>Advanced Dispatch</span><strong>ML Classifier + Haversine Clustering</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES GRID ═══════════════════ */}
      <section className="landing-section landing-section-dark features-section">
        <div className="landing-section-inner">
          <div className="landing-animate landing-section-header">
            <span className="landing-section-tag">Platform Capabilities</span>
            <h2 className="landing-section-title">Everything You Need for Smart Civic Management</h2>
            <p className="landing-section-desc" style={{ maxWidth: '560px', margin: '0 auto' }}>A full-stack civic intelligence platform — from grievance intake to ML dispatch to real-time official monitoring.</p>
          </div>
          <div className="features-grid landing-animate">
            {features.map((feat, i) => (
              <TiltCard key={i} className="feature-card">
                <div className="feature-card-icon" style={{ background: `${feat.color}18`, color: feat.color, border: `1px solid ${feat.color}35` }}>{feat.icon}</div>
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.desc}</p>
                <div className="feature-card-glow" style={{ background: `radial-gradient(circle at 50% 100%, ${feat.color}20, transparent 70%)` }} />
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section ref={howItWorksRef} className="landing-section landing-section-mid">
        <div className="landing-section-inner">
          <div className="landing-animate landing-section-header">
            <span className="landing-section-tag">Workflow</span>
            <h2 className="landing-section-title">Three Steps to Resolution</h2>
          </div>
          <div className="landing-steps landing-animate">
            {[
              { n: '01', title: 'Citizen Files Report', desc: 'Describe the issue, pin the location on a map, and optionally attach photo or voice evidence.', icon: <Users size={28} />, color: '#3b82f6' },
              { n: '02', title: 'AI Analyzes & Clusters', desc: 'The ML model classifies the department, detects urgency, and merges with nearby open incidents.', icon: <Cpu size={28} />, color: '#8b5cf6' },
              { n: '03', title: 'Department Dispatched', desc: 'Priority score triggers SLA-based ETAs. Critical issues get immediate dispatch. Officials see everything live.', icon: <CheckCircle size={28} />, color: '#10b981' }
            ].map((step, i) => (
              <React.Fragment key={i}>
                <div className={`landing-step ${hoveredStep === i ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredStep(i)} onMouseLeave={() => setHoveredStep(null)}
                  style={{ '--step-color': step.color }}>
                  <div className="step-icon-ring" style={{ background: `${step.color}15`, border: `1.5px solid ${step.color}40`, color: step.color }}>{step.icon}</div>
                  <div className="landing-step-number" style={{ color: step.color }}>{step.n}</div>
                  <div className="landing-step-content"><h3>{step.title}</h3><p>{step.desc}</p></div>
                  <div className="step-hover-glow" style={{ background: `radial-gradient(circle at 50% 100%, ${step.color}18, transparent 70%)` }} />
                </div>
                {i < 2 && <div className="landing-step-connector"><ArrowRight size={20} /></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section className="landing-section landing-section-dark stats-section">
        <div className="landing-section-inner">
          <div className="landing-stats-grid landing-animate">
            {[
              { val: '7', suf: '', label: 'Departments Covered', icon: '🏛️', color: '#3b82f6' },
              { val: '300', suf: 'm', label: 'Cluster Radius', icon: '📍', color: '#10b981' },
              { val: '2', suf: 's', label: 'AI Classification', icon: '⚡', color: '#f59e0b' },
              { val: '24', suf: '/7', label: 'Real-Time Monitoring', icon: '📡', color: '#8b5cf6' },
              { val: '12450', suf: '+', label: 'Issues Resolved', icon: '✅', color: '#ef4444' },
              { val: '98', suf: '%', label: 'Routing Accuracy', icon: '🎯', color: '#06b6d4' },
            ].map((s, i) => (
              <div key={i} className="landing-stat-card stat-animated" style={{ '--stat-color': s.color, animationDelay: `${i * 0.1}s` }}>
                <div className="stat-emoji">{s.icon}</div>
                <div className="landing-stat-number" style={{ color: s.color }}>
                  <AnimCounter target={s.val} suffix={s.suf} />
                </div>
                <div className="landing-stat-label">{s.label}</div>
                <div className="stat-card-glow" style={{ background: `radial-gradient(circle at 50% 100%, ${s.color}22, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="landing-section landing-cta-section">
        <div className="landing-section-inner landing-animate" style={{ textAlign: 'center' }}>
          <div className="cta-badge"><Zap size={13} /> Launching Now — Free for All Citizens</div>
          <h2 className="landing-section-title cta-title">Ready to Transform<br />Your City?</h2>
          <p className="landing-section-desc" style={{ maxWidth: '500px', margin: '0 auto 32px' }}>
            Join the platform empowering citizens and officials with AI-driven civic intelligence.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="landing-btn-primary landing-btn-lg hero-cta-primary" onClick={() => onGetStarted('citizen-portal')}>
              Get Started as Citizen <ArrowRight size={18} />
            </button>
            <button className="landing-btn-outline landing-btn-lg" onClick={() => onGetStarted('command-center')}>
              Official Login
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="landing-footer-new">

        {/* Live Status Bar */}
        <div className="footer-status-bar">
          <div className="footer-status-inner">
            <div className="footer-status-dot" />
            <span>All Systems Operational</span>
            <span className="footer-status-divider">|</span>
            <span>Backend API: 200 OK</span>
            <span className="footer-status-divider">|</span>
            <span>ML Model: Active</span>
            <span className="footer-status-divider">|</span>
            <span>Last updated: Just now</span>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="footer-main">

          {/* Brand Column */}
          <div className="footer-col footer-brand-col">
            <div className="footer-brand-logo">
              <ShieldAlert size={28} style={{ color: '#3b82f6' }} />
              <span className="footer-brand-name">URBANASSIST<span style={{ color: '#3b82f6' }}>.</span></span>
            </div>
            <p className="footer-brand-tagline">
              AI-powered civic grievance management for smarter, more responsive cities. Built for citizens, trusted by officials.
            </p>
            <div className="footer-socials">
              {[
                {
                  icon: (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                  href: '#',
                  label: 'Twitter'
                },
                {
                  icon: (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                    </svg>
                  ),
                  href: 'https://github.com',
                  label: 'GitHub'
                },
                {
                  icon: (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  ),
                  href: '#',
                  label: 'LinkedIn'
                },
                { icon: <Globe size={16} />, href: '#', label: 'Website' },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="footer-social-btn" aria-label={s.label}>{s.icon}</a>
              ))}
            </div>
            <div className="footer-badges">
              <span className="footer-badge">🏆 Smart City Award 2024</span>
              <span className="footer-badge">🛡️ ISO 27001 Certified</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-links-list">
              {[
                { label: 'Citizen Portal', action: () => onGetStarted('citizen-portal') },
                { label: 'Command Center', action: () => onGetStarted('command-center') },
                { label: 'Govt Certificate Hub', action: () => onGetStarted('citizen-portal') },
                { label: 'File a Grievance', action: () => onGetStarted('citizen-portal') },
                { label: 'Track Status', action: () => onGetStarted('citizen-portal') },
                { label: 'API Documentation', action: () => {} },
              ].map((link) => (
                <li key={link.label}>
                  <button className="footer-link-btn" onClick={link.action}>
                    <ChevronRight size={12} className="footer-link-arrow" />{link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Departments */}
          <div className="footer-col">
            <h4 className="footer-col-title">Departments</h4>
            <ul className="footer-links-list">
              {['💧 Water & Sewerage', '🛣️ Roads & Infrastructure', '⚡ Electricity & Grid', '🗑️ Sanitation & Waste', '🌳 Parks & Recreation', '🚦 Traffic Management', '🏥 Health Services', '📚 Education'].map((dept) => (
                <li key={dept}><span className="footer-dept-item">{dept}</span></li>
              ))}
            </ul>
          </div>

          {/* Govt Certificates */}
          <div className="footer-col">
            <h4 className="footer-col-title">Govt Services</h4>
            <ul className="footer-links-list">
              {['Birth Certificate', 'Death Certificate', 'Marriage Certificate', 'Income Certificate', 'Caste Certificate', 'Driving Licence', 'Ration Card', 'Property Mutation', 'Land Records / Pahani', 'Pension Schemes'].map((cert) => (
                <li key={cert}>
                  <button className="footer-link-btn" onClick={() => onGetStarted('citizen-portal')}>
                    <ChevronRight size={12} className="footer-link-arrow" />{cert}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Subscribe */}
          <div className="footer-col">
            <h4 className="footer-col-title">Support & Contact</h4>
            <ul className="footer-links-list footer-contact-list">
              <li><span className="footer-contact-item"><Mail size={14} /> help@urbanassist.in</span></li>
              <li><span className="footer-contact-item"><Phone size={14} /> 1800-XXX-CIVIC (Toll Free)</span></li>
              <li><span className="footer-contact-item"><Clock size={14} /> Mon–Sat, 9 AM – 6 PM IST</span></li>
              <li><span className="footer-contact-item"><MapPin size={14} /> Visakhapatnam, Andhra Pradesh</span></li>
            </ul>
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>Subscribe for civic updates</p>
              <div className="footer-subscribe-row">
                <input type="email" placeholder="your@email.com" className="footer-email-input" />
                <button className="footer-subscribe-btn" onClick={() => alert('Subscribed! You will receive civic updates.')}>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-inner">
            <div className="footer-bottom-left">
              <span>© {new Date().getFullYear()} UrbanAssist AI. Built for smarter cities.</span>
              <span className="footer-bottom-sep">|</span>
              <span>Powered by ML + Gemini AI</span>
            </div>
            <div className="footer-bottom-right">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'RTI Act', 'Grievance Officer'].map((link, i) => (
                <React.Fragment key={link}>
                  <button className="footer-bottom-link">{link}</button>
                  {i < 4 && <span className="footer-bottom-sep">·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
