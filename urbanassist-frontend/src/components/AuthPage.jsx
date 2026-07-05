import React, { useState, useRef } from 'react';
import { ShieldAlert, Mail, Lock, User, ArrowLeft, Loader, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { signUp, verifySignUpOTP, completeSignUp, signIn, forgotPassword, resetPassword } from '../api';

// mode: 'citizen' | 'official'
export default function AuthPage({ onLogin, onBack, initialView = 'signin', mode = 'citizen' }) {
  const isOfficial = mode === 'official';

  // Views: 'signin', 'signup', 'otp', 'password', 'forgot', 'forgot-otp', 'reset-success'
  const [view, setView] = useState(initialView);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingSignup, setPendingSignup] = useState(null);

  const otpRefs = useRef([]);

  const accentColor = isOfficial ? '#dc2626' : '#2563eb';
  const accentBg = isOfficial ? '#fef2f2' : '#eff6ff';
  const accentBorder = isOfficial ? '#fca5a5' : '#bfdbfe';

  const clearMessages = () => { setError(''); setSuccess(''); };
  const resetForm = () => {
    setUsername(''); setEmail(''); setPassword('');
    setNewPassword(''); setOtp(['', '', '', '', '', '']);
    setForgotIdentifier(''); clearMessages();
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      otpRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const otpString = otp.join('');

  const handleSignUp = async (e) => {
    e.preventDefault(); clearMessages();
    if (!username.trim() || !email.trim()) { setError('Username and email are required.'); return; }
    setLoading(true);
    try {
      const data = await signUp(username, email);
      setPendingSignup({ username, email });
      if (data.otp_required) {
        setOtp(['', '', '', '', '', '']); setView('otp'); setSuccess(data.message);
      } else {
        setSuccess(data.message);
        setTimeout(() => setView('password'), 1000);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault(); clearMessages();
    if (otpString.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    const emailToVerify = pendingSignup?.email || email;
    if (!emailToVerify.trim()) { setError('Email address is required.'); return; }
    setLoading(true);
    try {
      await verifySignUpOTP(emailToVerify, otpString);
      setPendingSignup({ username: pendingSignup?.username || '', email: emailToVerify, otp: otpString });
      setSuccess('Email verified successfully!');
      setTimeout(() => { clearMessages(); setView('password'); }, 1000);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCompleteSignUp = async (e) => {
    e.preventDefault(); clearMessages();
    const finalUsername = pendingSignup?.username || username;
    if (!finalUsername.trim()) { setError('Username is required.'); return; }
    if (!password.trim() || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await completeSignUp(finalUsername, pendingSignup.email, password, pendingSignup.otp || '');
      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => { resetForm(); setView('signin'); }, 1500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSignIn = async (e) => {
    e.preventDefault(); clearMessages();
    if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return; }
    setLoading(true);
    try {
      const data = await signIn(email, password);
      localStorage.setItem('ua_token', data.token);
      localStorage.setItem('ua_username', data.username);
      onLogin(data.username, data.token);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault(); clearMessages();
    if (!forgotIdentifier.trim()) { setError('Please enter your email or username.'); return; }
    setLoading(true);
    try {
      const data = await forgotPassword(forgotIdentifier);
      if (data.otp_required) { setOtp(['', '', '', '', '', '']); setView('forgot-otp'); setSuccess(data.message); }
      else setSuccess(data.message);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); clearMessages();
    if (otpString.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    if (!newPassword.trim() || newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await resetPassword(forgotIdentifier, otpString, newPassword);
      setSuccess('Password updated!'); setView('reset-success');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const renderOTPInputs = () => (
    <div className="auth-otp-container">
      {otp.map((digit, i) => (
        <input
          key={i} ref={(el) => (otpRefs.current[i] = el)}
          type="text" inputMode="numeric" maxLength={6}
          value={digit}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(i, e)}
          className="auth-otp-input" autoFocus={i === 0}
        />
      ))}
    </div>
  );

  const renderMessage = () => (
    <>
      {error && (
        <div className="auth-message auth-message-error">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="auth-message auth-message-success">
          <CheckCircle size={16} /><span>{success}</span>
        </div>
      )}
    </>
  );

  return (
    <div className="auth-page" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="auth-card-wrapper">

        {/* ── LEFT SIDE: Branding / Illustration ──────────────────────── */}
        <div className="auth-branding" style={{
          background: isOfficial
            ? 'linear-gradient(135deg, #1a0000 0%, #2d0a0a 40%, #0f0f0f 100%)'
            : 'linear-gradient(135deg, #0a0a1a 0%, #0d1b4b 40%, #0a0a1a 100%)'
        }}>
          {/* Large background glow orb */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '300px', height: '300px', borderRadius: '50%',
            background: `radial-gradient(circle, ${isOfficial ? 'rgba(220,38,38,0.2)' : 'rgba(37,99,235,0.2)'} 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '40px 32px' }}>
            {/* Icon badge */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: accentBg, border: `2px solid ${accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              {isOfficial
                ? <Shield size={38} style={{ color: accentColor }} />
                : <ShieldAlert size={38} style={{ color: accentColor }} />
              }
            </div>

            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: '26px', fontWeight: 800,
              color: '#ffffff', margin: '0 0 12px', letterSpacing: '-0.5px'
            }}>
              {isOfficial ? 'Officials Portal' : 'UrbanAssist AI'}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 32px' }}>
              {isOfficial
                ? 'Secure access for verified municipal and government officials only.'
                : 'AI-powered civic grievance dispatch for smarter city management.'}
            </p>

            {/* Official warning banner */}
            {isOfficial && (
              <div style={{
                background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: '10px', padding: '14px 16px', textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#fca5a5', margin: 0, lineHeight: 1.6 }}>
                    <strong>Restricted Access:</strong> This portal is for authorized municipal authorities only. All access attempts are logged and monitored.
                  </p>
                </div>
              </div>
            )}

            {/* Feature pills */}
            {!isOfficial && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                {['ML-Powered Complaint Routing', 'Real-Time Geo Clustering', 'OTP-Verified Secure Login'].map(f => (
                  <div key={f} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <CheckCircle size={14} style={{ color: accentColor, flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.65)', textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {isOfficial && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {['Live Incident Command Dashboard', 'AI Commissioner Briefings', 'Verified Official Accounts Only'].map(f => (
                  <div key={f} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <Shield size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDE: Form ─────────────────────────────────────────── */}
        <div className="auth-form-side">
          <button className="auth-back-btn" onClick={onBack}>
            <ArrowLeft size={18} /> Back to Home
          </button>

          <div className="auth-form-container">

            {/* ── SIGN IN ──────────────────────────────────────────────── */}
            {view === 'signin' && (
              <div className="auth-form-card animate-fade-in" style={{
                background: '#fff', borderRadius: '20px', padding: '40px',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
              }}>
                <div className="auth-form-header">
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: accentBg, border: `1px solid ${accentBorder}`,
                    borderRadius: '30px', padding: '5px 14px', marginBottom: '16px'
                  }}>
                    {isOfficial
                      ? <Shield size={13} style={{ color: accentColor }} />
                      : <ShieldAlert size={13} style={{ color: accentColor }} />
                    }
                    <span style={{ fontSize: '11px', fontWeight: 700, color: accentColor, letterSpacing: '0.04em' }}>
                      {isOfficial ? 'OFFICIALS ONLY' : 'CITIZEN PORTAL'}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '26px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                    Welcome Back
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {isOfficial ? 'Sign in to access the command dashboard' : 'Sign in to access the civic platform'}
                  </p>
                </div>

                <form onSubmit={handleSignIn} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="auth-input-group">
                    <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>Email Address</label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} className="auth-input-icon" />
                      <input type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus style={{ fontFamily: "'Inter', sans-serif" }} />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} className="auth-input-icon" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ fontFamily: "'Inter', sans-serif" }} />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {renderMessage()}

                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{
                    background: isOfficial ? '#dc2626' : '#111827',
                    fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    marginTop: '4px'
                  }}>
                    {loading ? <><Loader size={18} className="auth-spinner" /> Signing in...</> : 'Sign In'}
                  </button>
                </form>

                <div className="auth-form-footer" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
                    <button className="auth-link-btn" onClick={() => { resetForm(); setView('forgot'); }} style={{ fontFamily: "'Inter', sans-serif" }}>
                      Forgot password?
                    </button>
                    <button className="auth-link-btn" onClick={() => { resetForm(); setView('otp'); }} style={{ fontFamily: "'Inter', sans-serif" }}>
                      Verify pending OTP / Enter Code
                    </button>
                  </div>
                  <div className="auth-divider"><span>Don't have an account?</span></div>
                  <button className="auth-switch-btn" onClick={() => { resetForm(); setView('signup'); }} style={{ fontFamily: "'Inter', sans-serif", borderColor: isOfficial ? '#dc2626' : undefined, color: isOfficial ? '#dc2626' : undefined }}>
                    {isOfficial ? 'Register as Official' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}

            {/* ── SIGN UP ──────────────────────────────────────────────── */}
            {view === 'signup' && (
              <div className="auth-form-card animate-fade-in" style={{
                background: '#fff', borderRadius: '20px', padding: '40px',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
              }}>
                <div className="auth-form-header">
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: accentBg, border: `1px solid ${accentBorder}`,
                    borderRadius: '30px', padding: '5px 14px', marginBottom: '16px'
                  }}>
                    {isOfficial ? <Shield size={13} style={{ color: accentColor }} /> : <ShieldAlert size={13} style={{ color: accentColor }} />}
                    <span style={{ fontSize: '11px', fontWeight: 700, color: accentColor, letterSpacing: '0.04em' }}>
                      {isOfficial ? 'OFFICIALS REGISTRATION' : 'CREATE ACCOUNT'}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '26px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                    {isOfficial ? 'Official Registration' : 'Create Account'}
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {isOfficial ? 'Register as a verified municipal authority' : 'Join the civic intelligence platform'}
                  </p>
                </div>

                <form onSubmit={handleSignUp} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="auth-input-group">
                    <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>
                      {isOfficial ? 'Official Name / Designation' : 'Username'}
                    </label>
                    <div className="auth-input-wrapper">
                      <User size={18} className="auth-input-icon" />
                      <input type="text" placeholder={isOfficial ? 'e.g. Commissioner Sharma' : 'Choose a username'} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus style={{ fontFamily: "'Inter', sans-serif" }} />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>
                      {isOfficial ? 'Official Email (Govt / Municipal)' : 'Email Address'}
                    </label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} className="auth-input-icon" />
                      <input type="email" placeholder={isOfficial ? 'name@muncipalcorp.gov.in' : 'Enter your email'} value={email} onChange={(e) => setEmail(e.target.value)} style={{ fontFamily: "'Inter', sans-serif" }} />
                    </div>
                  </div>

                  {renderMessage()}

                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{
                    background: isOfficial ? '#dc2626' : '#111827',
                    fontFamily: "'Inter', sans-serif", fontWeight: 700
                  }}>
                    {loading ? <><Loader size={18} className="auth-spinner" /> Sending code...</> : 'Send Verification Code'}
                  </button>
                </form>

                <div className="auth-form-footer" style={{ marginTop: '24px' }}>
                  <div className="auth-divider"><span>Already have an account?</span></div>
                  <button className="auth-switch-btn" onClick={() => { resetForm(); setView('signin'); }} style={{ fontFamily: "'Inter', sans-serif", borderColor: isOfficial ? '#dc2626' : undefined, color: isOfficial ? '#dc2626' : undefined }}>
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ── OTP VERIFICATION ─────────────────────────────────────── */}
            {view === 'otp' && (
              <div className="auth-form-card animate-fade-in" style={{
                background: '#fff', borderRadius: '20px', padding: '40px',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
              }}>
                <div className="auth-form-header">
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '26px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Verify Email</h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Enter the 6-digit verification code sent to your inbox</p>
                </div>

                <form onSubmit={handleVerifyOTP} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {!pendingSignup?.email ? (
                    <div className="auth-input-group">
                      <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>Email Address</label>
                      <div className="auth-input-wrapper">
                        <Mail size={18} className="auth-input-icon" />
                        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus style={{ fontFamily: "'Inter', sans-serif" }} />
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
                      Code sent to <strong style={{ color: '#111827' }}>{pendingSignup.email}</strong>
                    </p>
                  )}
                  {renderOTPInputs()}
                  {renderMessage()}
                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: isOfficial ? '#dc2626' : '#111827', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                    {loading ? <><Loader size={18} className="auth-spinner" /> Verifying...</> : 'Verify Email'}
                  </button>
                </form>

                <div className="auth-form-footer" style={{ marginTop: '20px' }}>
                  <button className="auth-link-btn" onClick={() => { resetForm(); setView('signup'); }} style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Sign Up</button>
                </div>
              </div>
            )}

            {/* ── PASSWORD CREATION ────────────────────────────────────── */}
            {view === 'password' && (
              <div className="auth-form-card animate-fade-in" style={{
                background: '#fff', borderRadius: '20px', padding: '40px',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
              }}>
                <div className="auth-form-header">
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '26px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Set Password</h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Choose a secure password for your account</p>
                </div>

                <form onSubmit={handleCompleteSignUp} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {!pendingSignup?.username && (
                    <div className="auth-input-group">
                      <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>Username</label>
                      <div className="auth-input-wrapper">
                        <User size={18} className="auth-input-icon" />
                        <input type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus style={{ fontFamily: "'Inter', sans-serif" }} />
                      </div>
                    </div>
                  )}
                  <div className="auth-input-group">
                    <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} className="auth-input-icon" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus={!!pendingSignup?.username} style={{ fontFamily: "'Inter', sans-serif" }} />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {renderMessage()}
                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: isOfficial ? '#dc2626' : '#111827', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                    {loading ? <><Loader size={18} className="auth-spinner" /> Completing registration...</> : 'Complete Registration'}
                  </button>
                </form>

                <div className="auth-form-footer" style={{ marginTop: '20px' }}>
                  <button className="auth-link-btn" onClick={() => { resetForm(); setView('signup'); }} style={{ fontFamily: "'Inter', sans-serif" }}>← Cancel</button>
                </div>
              </div>
            )}

            {/* ── FORGOT PASSWORD ──────────────────────────────────────── */}
            {view === 'forgot' && (
              <div className="auth-form-card animate-fade-in" style={{
                background: '#fff', borderRadius: '20px', padding: '40px',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
              }}>
                <div className="auth-form-header">
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '26px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Reset Password</h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Enter your email or username to receive a reset code</p>
                </div>
                <form onSubmit={handleForgotPassword} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="auth-input-group">
                    <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>Email or Username</label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} className="auth-input-icon" />
                      <input type="text" placeholder="Enter email or username" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} autoFocus style={{ fontFamily: "'Inter', sans-serif" }} />
                    </div>
                  </div>
                  {renderMessage()}
                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: isOfficial ? '#dc2626' : '#111827', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                    {loading ? <><Loader size={18} className="auth-spinner" /> Sending code...</> : 'Send Reset Code'}
                  </button>
                </form>
                <div className="auth-form-footer" style={{ marginTop: '20px' }}>
                  <button className="auth-link-btn" onClick={() => { resetForm(); setView('signin'); }} style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Sign In</button>
                </div>
              </div>
            )}

            {/* ── FORGOT PASSWORD OTP ──────────────────────────────────── */}
            {view === 'forgot-otp' && (
              <div className="auth-form-card animate-fade-in" style={{
                background: '#fff', borderRadius: '20px', padding: '40px',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
              }}>
                <div className="auth-form-header">
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '26px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Enter Reset Code</h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Enter the 6-digit code and your new password</p>
                </div>
                <form onSubmit={handleResetPassword} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {renderOTPInputs()}
                  <div className="auth-input-group">
                    <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#374151', display: 'block', marginBottom: '7px' }}>New Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} className="auth-input-icon" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ fontFamily: "'Inter', sans-serif" }} />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {renderMessage()}
                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: isOfficial ? '#dc2626' : '#111827', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                    {loading ? <><Loader size={18} className="auth-spinner" /> Resetting...</> : 'Reset Password'}
                  </button>
                </form>
                <div className="auth-form-footer" style={{ marginTop: '20px' }}>
                  <button className="auth-link-btn" onClick={() => { resetForm(); setView('forgot'); }} style={{ fontFamily: "'Inter', sans-serif" }}>← Back</button>
                </div>
              </div>
            )}

            {/* ── RESET SUCCESS ────────────────────────────────────────── */}
            {view === 'reset-success' && (
              <div className="auth-form-card animate-fade-in" style={{
                background: '#fff', borderRadius: '20px', padding: '50px 40px',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
                textAlign: 'center'
              }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={36} style={{ color: '#10b981' }} />
                </div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>Password Reset!</h2>
                <p style={{ fontFamily: "'Inter', sans-serif", color: '#6b7280', marginBottom: '32px', fontSize: '14px' }}>Your password has been updated successfully.</p>
                <button className="auth-submit-btn" onClick={() => { resetForm(); setView('signin'); }} style={{ background: isOfficial ? '#dc2626' : '#111827', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                  Sign In Now
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
