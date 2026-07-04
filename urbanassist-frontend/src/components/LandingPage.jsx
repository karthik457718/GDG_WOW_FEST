import React, { useEffect, useRef } from 'react';
import { ShieldAlert, Cpu, MapPin, Zap, BarChart3, ArrowRight, ChevronDown } from 'lucide-react';

import avatarManGlasses from '../assets/avatar_man_glasses.png';
import avatarWomanPink from '../assets/avatar_woman_pink.png';
import avatarManDark from '../assets/avatar_man_dark.png';

export default function LandingPage({ onGetStarted, user }) {
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('landing-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.landing-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const floatingAvatars = [
    {
      id: 'ramesh',
      name: 'Ramesh K.',
      role: 'Citizen',
      issue: 'Reported water logging near market',
      dept: 'Water & Sewerage',
      status: 'Routed to Water',
      img: avatarManGlasses,
      style: { top: '16%', left: '6%', width: '90px', height: '90px' },
      delay: '0s',
      color: 'rgba(59, 130, 246, 0.4)'
    },
    {
      id: 'priya',
      name: 'Priya S.',
      role: 'Resident',
      issue: 'Reported broken street lamp on 4th cross',
      dept: 'Electricity Dept',
      status: 'SLA Dispatched',
      img: avatarWomanPink,
      style: { top: '42%', right: '4%', width: '100px', height: '100px' },
      delay: '1.5s',
      color: 'rgba(245, 158, 11, 0.4)'
    },
    {
      id: 'aniket',
      name: 'Aniket M.',
      role: 'Local Resident',
      issue: 'Reported garbage heap clearing delay',
      dept: 'Sanitation Dept',
      status: 'Active Dispatch',
      img: avatarManDark,
      style: { bottom: '18%', left: '12%', width: '95px', height: '95px' },
      delay: '3s',
      color: 'rgba(16, 185, 129, 0.4)'
    },
    {
      id: 'sonia',
      name: 'Sonia R.',
      role: 'Commuter',
      issue: 'Reported deep pothole on NH-16 bypass',
      dept: 'Roads & Infrastructure',
      status: 'Immediate SLA',
      img: null,
      initials: 'SR',
      style: { bottom: '24%', right: '14%', width: '80px', height: '80px' },
      delay: '4.5s',
      color: 'rgba(239, 68, 68, 0.4)'
    }
  ];

  return (
    <div className="landing-page">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-orb landing-orb-1" />
          <div className="landing-orb landing-orb-2" />
          <div className="landing-orb landing-orb-3" />
          <div className="landing-grid-lines" />
        </div>

        <nav className="landing-nav">
          <div className="landing-nav-brand">
            <ShieldAlert size={24} style={{ color: 'var(--accent-color)' }} />
            <span className="landing-nav-title">
              URBANASSIST<span style={{ color: 'var(--accent-color)' }}>.</span>
            </span>
          </div>

          <div className="landing-nav-links">
            <button className="landing-nav-link" onClick={() => onGetStarted('portal')}>Citizen Portal</button>
            <button className="landing-nav-link" onClick={() => onGetStarted('signin')}>Command Center</button>
            <button className="landing-nav-link" onClick={scrollToFeatures}>About</button>
            <button className="landing-nav-link" onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}>Specs</button>
          </div>

          <div className="landing-nav-actions">
            {user ? (
              <>
                <span className="landing-btn-ghost signed-in-label" style={{ cursor: 'default' }}>
                  Signed in as: <strong>{user}</strong>
                </span>
                <button className="landing-btn-primary" onClick={() => onGetStarted('portal')}>
                  Enter Portal <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <button className="landing-btn-ghost" onClick={() => onGetStarted('signin')}>Sign in</button>
                <button className="landing-btn-primary nav-cta-btn" onClick={() => onGetStarted('signup')}>
                  Log in
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Floating Citizen Avatars */}
        {floatingAvatars.map((avatar) => (
          <div
            key={avatar.id}
            className="floating-avatar-container"
            style={{
              ...avatar.style,
              animationDelay: avatar.delay,
              boxShadow: `0 0 25px ${avatar.color}`,
              border: `2px solid ${avatar.color}`
            }}
          >
            {avatar.img ? (
              <img src={avatar.img} alt={avatar.name} className="floating-avatar-img" />
            ) : (
              <div className="floating-avatar-initials" style={{ background: avatar.color }}>
                {avatar.initials}
              </div>
            )}
            <div className="avatar-tooltip">
              <div className="tooltip-header">
                <strong>{avatar.name}</strong> <span>{avatar.role}</span>
              </div>
              <p>{avatar.issue}</p>
              <div className="tooltip-footer">
                <span className="tooltip-dept">{avatar.dept}</span>
                <span className="tooltip-status">{avatar.status}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Zap size={14} />
            AI-Powered Civic Dispatch
          </div>
          
          <h1 className="landing-hero-title">
            Ready to transform your city
            <br />
            with smart <span className="title-robot-emoji">🤖</span> AI routing?
          </h1>
          
          <p className="landing-hero-subtitle">
            File complaints, resolve duplicates, and dispatch municipal departments instantly — all powered by our machine learning grievance routing engine.
          </p>

          {/* Central Action Buttons */}
          <div className="landing-hero-ctas">
            {user ? (
              <button className="landing-btn-primary landing-btn-lg" onClick={() => onGetStarted('portal')}>
                Enter Portal <ArrowRight size={18} />
              </button>
            ) : (
              <button className="landing-btn-primary landing-btn-lg" onClick={() => onGetStarted('signup')}>
                Launch Portal <ArrowRight size={18} />
              </button>
            )}
            <button className="landing-btn-outline landing-btn-lg" onClick={scrollToFeatures}>
              Explore Features
            </button>
          </div>
        </div>

        {/* Large Overlapping Stats Overlay */}
        <div className="giant-stats-overlay">
          <span className="giant-stats-number">12,450+</span>
          <span className="giant-stats-label">Civic issues resolved by AI dispatch</span>
        </div>

        <button className="landing-scroll-hint" onClick={scrollToFeatures}>
          <ChevronDown size={20} />
        </button>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section ref={featuresRef} className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-animate landing-section-header">
            <span className="landing-section-tag">Core Capabilities</span>
            <h2 className="landing-section-title">Intelligent Infrastructure</h2>
            <p className="landing-section-desc">
              Every civic complaint is analyzed, classified, clustered, and dispatched — automatically.
            </p>
          </div>

          <div className="landing-features-grid landing-animate">
            <div className="landing-feature-card premium-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                <Cpu size={24} />
              </div>
              <h3>AI Classification</h3>
              <p>Machine learning model instantly classifies complaints into the correct department — Water, Roads, Electricity, Sanitation, and more.</p>
            </div>
            <div className="landing-feature-card premium-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <MapPin size={24} />
              </div>
              <h3>Geo-Clustering</h3>
              <p>Nearby reports within 300m are automatically merged into incident clusters, revealing systemic issues and eliminating duplicates.</p>
            </div>
            <div className="landing-feature-card premium-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                <Zap size={24} />
              </div>
              <h3>Priority Dispatch</h3>
              <p>Urgent keywords and cluster density drive a smart priority score. Critical incidents trigger immediate dispatch alerts.</p>
            </div>
            <div className="landing-feature-card premium-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                <BarChart3 size={24} />
              </div>
              <h3>Command Center</h3>
              <p>Real-time dashboard with live map, priority queue, and AI-generated daily briefings powered by Gemini for city officials.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section ref={howItWorksRef} className="landing-section landing-section-dark">
        <div className="landing-section-inner">
          <div className="landing-animate landing-section-header">
            <span className="landing-section-tag">Workflow</span>
            <h2 className="landing-section-title">Three Steps to Resolution</h2>
          </div>

          <div className="landing-steps landing-animate">
            <div className="landing-step">
              <div className="landing-step-number">01</div>
              <div className="landing-step-content">
                <h3>Citizen Files Report</h3>
                <p>Describe the issue, pin the location on a map, and optionally attach photo or voice evidence.</p>
              </div>
            </div>
            <div className="landing-step-connector">
              <ArrowRight size={20} />
            </div>
            <div className="landing-step">
              <div className="landing-step-number">02</div>
              <div className="landing-step-content">
                <h3>AI Analyzes & Clusters</h3>
                <p>The ML model classifies the department, detects urgency, and merges with nearby open incidents.</p>
              </div>
            </div>
            <div className="landing-step-connector">
              <ArrowRight size={20} />
            </div>
            <div className="landing-step">
              <div className="landing-step-number">03</div>
              <div className="landing-step-content">
                <h3>Department Dispatched</h3>
                <p>Priority score triggers SLA-based ETAs. Critical issues get immediate dispatch. Officials see everything live.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-stats-grid landing-animate">
            <div className="landing-stat-card">
              <div className="landing-stat-number">7</div>
              <div className="landing-stat-label">Departments Covered</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-number">300m</div>
              <div className="landing-stat-label">Cluster Radius</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-number">&lt;2s</div>
              <div className="landing-stat-label">AI Classification</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-number">24/7</div>
              <div className="landing-stat-label">Real-Time Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="landing-section landing-cta-section">
        <div className="landing-section-inner landing-animate" style={{ textAlign: 'center' }}>
          <h2 className="landing-section-title">Ready to Transform Your City?</h2>
          <p className="landing-section-desc" style={{ maxWidth: '500px', margin: '0 auto 32px' }}>
            Join the platform empowering citizens and officials with AI-driven civic intelligence.
          </p>
          <button className="landing-btn-primary landing-btn-lg" onClick={() => onGetStarted('signup')}>
            Get Started Now <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <ShieldAlert size={20} style={{ color: 'var(--accent-color)' }} />
            <span>URBANASSIST<span style={{ color: 'var(--accent-color)' }}>.</span></span>
          </div>
          <div className="landing-footer-links">
            <span>Civic Grievance Engine</span>
            <span>•</span>
            <span>Powered by ML & Gemini</span>
          </div>
          <div className="landing-footer-copy">
            &copy; {new Date().getFullYear()} UrbanAssist AI. Built for smarter cities.
          </div>
        </div>
      </footer>
    </div>
  );
}
