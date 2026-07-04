import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Mail, Lock, User, ArrowLeft, Loader, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { signUp, verifySignUpOTP, completeSignUp, signIn, forgotPassword, resetPassword } from '../api';

export default function AuthPage({ onLogin, onBack, initialView = 'signin' }) {
  // Views: 'signin', 'signup', 'otp', 'forgot', 'forgot-otp', 'reset-success'
  const [view, setView] = useState(initialView);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // OTP input refs
  const otpRefs = useRef([]);

  // Pending signup data (for OTP verification)
  const [pendingSignup, setPendingSignup] = useState(null);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setNewPassword('');
    setOtp(['', '', '', '', '', '']);
    setForgotIdentifier('');
    clearMessages();
  };

  // ── OTP Input Handler ──────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const otpString = otp.join('');

  // ── Sign Up ────────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!username.trim() || !email.trim()) {
      setError('Username and email are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await signUp(username, email);
      setPendingSignup({ username, email });
      if (data.otp_required) {
        setOtp(['', '', '', '', '', '']);
        setView('otp');
        setSuccess(data.message);
      } else {
        // Dev Mode: direct to password setting
        setSuccess(data.message);
        setTimeout(() => {
          setView('password');
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP (signup) ────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    clearMessages();
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    const emailToVerify = pendingSignup?.email || email;
    if (!emailToVerify.trim()) {
      setError('Email address is required.');
      return;
    }
    setLoading(true);
    try {
      await verifySignUpOTP(emailToVerify, otpString);
      setPendingSignup({
        username: pendingSignup?.username || '',
        email: emailToVerify,
        otp: otpString
      });
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        clearMessages();
        setView('password');
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Complete Sign Up (Password Creation) ──────────────────────────────
  const handleCompleteSignUp = async (e) => {
    e.preventDefault();
    clearMessages();
    const finalUsername = pendingSignup?.username || username;
    if (!finalUsername.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await completeSignUp(
        finalUsername,
        pendingSignup.email,
        password,
        pendingSignup.otp || ''
      );
      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => {
        resetForm();
        setView('signin');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Sign In ────────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await signIn(email, password);
      localStorage.setItem('ua_token', data.token);
      localStorage.setItem('ua_username', data.username);
      onLogin(data.username, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!forgotIdentifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    setLoading(true);
    try {
      const data = await forgotPassword(forgotIdentifier);
      if (data.otp_required) {
        setOtp(['', '', '', '', '', '']);
        setView('forgot-otp');
        setSuccess(data.message);
      } else {
        setSuccess(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(forgotIdentifier, otpString, newPassword);
      setSuccess('Password updated!');
      setView('reset-success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── UI Helpers ─────────────────────────────────────────────────────────
  const renderOTPInputs = () => (
    <div className="auth-otp-container">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (otpRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(i, e)}
          className="auth-otp-input"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );

  const renderMessage = () => (
    <>
      {error && (
        <div className="auth-message auth-message-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="auth-message auth-message-success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="auth-page">
      {/* Left side: branding */}
      <div className="auth-branding">
        <div className="auth-branding-bg">
          <div className="landing-orb landing-orb-1" />
          <div className="landing-orb landing-orb-2" />
        </div>
        <div className="auth-branding-content">
          <div className="auth-branding-logo">
            <ShieldAlert size={40} style={{ color: 'var(--accent-color)' }} />
          </div>
          <h1 className="auth-branding-title">
            URBAN ASSIST <span style={{ color: 'var(--accent-color)' }}>AI</span>
          </h1>
          <p className="auth-branding-tagline">Civic Grievance Engine</p>
          <div className="auth-branding-features">
            <div className="auth-branding-feature">
              <div className="auth-branding-feature-dot" />
              AI-Powered Complaint Classification
            </div>
            <div className="auth-branding-feature">
              <div className="auth-branding-feature-dot" />
              Real-Time Incident Clustering
            </div>
            <div className="auth-branding-feature">
              <div className="auth-branding-feature-dot" />
              Smart Department Dispatch
            </div>
            <div className="auth-branding-feature">
              <div className="auth-branding-feature-dot" />
              Live Command Center Dashboard
            </div>
          </div>
        </div>
      </div>

      {/* Right side: form */}
      <div className="auth-form-side">
        <button className="auth-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Home
        </button>

        <div className="auth-form-container">
          {/* ── SIGN IN ──────────────────────────────────────────────────── */}
          {view === 'signin' && (
            <div className="auth-form-card premium-card animate-fade-in">
              <div className="auth-form-header">
                <h2>Welcome Back</h2>
                <p>Sign in to access the civic platform</p>
              </div>

              <form onSubmit={handleSignIn}>
                <div className="auth-input-group">
                  <label>Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {renderMessage()}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <><Loader size={18} className="auth-spinner" /> Signing in...</>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="auth-form-footer">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
                  <button className="auth-link-btn" onClick={() => { resetForm(); setView('forgot'); }}>
                    Forgot password?
                  </button>
                  <button className="auth-link-btn" onClick={() => { resetForm(); setView('otp'); }}>
                    Verify pending OTP / Enter Code
                  </button>
                </div>
                <div className="auth-divider">
                  <span>Don't have an account?</span>
                </div>
                <button className="auth-switch-btn" onClick={() => { resetForm(); setView('signup'); }}>
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* ── SIGN UP ──────────────────────────────────────────────────── */}
          {view === 'signup' && (
            <div className="auth-form-card premium-card animate-fade-in">
              <div className="auth-form-header">
                <h2>Create Account</h2>
                <p>Join the civic intelligence platform</p>
              </div>

              <form onSubmit={handleSignUp}>
                <div className="auth-input-group">
                  <label>Username</label>
                  <div className="auth-input-wrapper">
                    <User size={18} className="auth-input-icon" />
                    <input
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {renderMessage()}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <><Loader size={18} className="auth-spinner" /> Sending code...</>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>

              <div className="auth-form-footer">
                <button className="auth-link-btn" onClick={() => { resetForm(); setView('otp'); }} style={{ marginBottom: '8px' }}>
                  Already have a verification code?
                </button>
                <div className="auth-divider">
                  <span>Already have an account?</span>
                </div>
                <button className="auth-switch-btn" onClick={() => { resetForm(); setView('signin'); }}>
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* ── OTP VERIFICATION (Signup) ────────────────────────────────── */}
          {view === 'otp' && (
            <div className="auth-form-card premium-card animate-fade-in">
              <div className="auth-form-header">
                <h2>Verify Email</h2>
                <p>Enter the 6-digit verification code</p>
              </div>

              <form onSubmit={handleVerifyOTP}>
                {!pendingSignup?.email ? (
                  <div className="auth-input-group" style={{ marginBottom: '20px' }}>
                    <label>Email Address</label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} className="auth-input-icon" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
                    Code sent to <strong>{pendingSignup.email}</strong>
                  </p>
                )}

                {renderOTPInputs()}
                {renderMessage()}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <><Loader size={18} className="auth-spinner" /> Verifying...</>
                  ) : (
                    'Verify Email'
                  )}
                </button>
              </form>

              <div className="auth-form-footer">
                <button className="auth-link-btn" onClick={() => { resetForm(); setView('signup'); }}>
                  ← Back to Sign Up
                </button>
              </div>
            </div>
          )}

          {/* ── PASSWORD CREATION (Signup) ────────────────────────────────── */}
          {view === 'password' && (
            <div className="auth-form-card premium-card animate-fade-in">
              <div className="auth-form-header">
                <h2>Set Password</h2>
                <p>Choose a secure password for your account</p>
              </div>

              <form onSubmit={handleCompleteSignUp}>
                {!pendingSignup?.username && (
                  <div className="auth-input-group" style={{ marginBottom: '15px' }}>
                    <label>Username</label>
                    <div className="auth-input-wrapper">
                      <User size={18} className="auth-input-icon" />
                      <input
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div className="auth-input-group">
                  <label>Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus={!!pendingSignup?.username}
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {renderMessage()}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <><Loader size={18} className="auth-spinner" /> Completing registration...</>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </form>

              <div className="auth-form-footer">
                <button className="auth-link-btn" onClick={() => { resetForm(); setView('signup'); }}>
                  ← Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD ──────────────────────────────────────────── */}
          {view === 'forgot' && (
            <div className="auth-form-card premium-card animate-fade-in">
              <div className="auth-form-header">
                <h2>Reset Password</h2>
                <p>Enter your email or username to receive a reset code</p>
              </div>

              <form onSubmit={handleForgotPassword}>
                <div className="auth-input-group">
                  <label>Email or Username</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="text"
                      placeholder="Enter email or username"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {renderMessage()}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <><Loader size={18} className="auth-spinner" /> Sending code...</>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>

              <div className="auth-form-footer">
                <button className="auth-link-btn" onClick={() => { resetForm(); setView('signin'); }}>
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD OTP ──────────────────────────────────────── */}
          {view === 'forgot-otp' && (
            <div className="auth-form-card premium-card animate-fade-in">
              <div className="auth-form-header">
                <h2>Enter Reset Code</h2>
                <p>Enter the 6-digit code and your new password</p>
              </div>

              <form onSubmit={handleResetPassword}>
                {renderOTPInputs()}

                <div className="auth-input-group" style={{ marginTop: '20px' }}>
                  <label>New Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {renderMessage()}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <><Loader size={18} className="auth-spinner" /> Resetting...</>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <div className="auth-form-footer">
                <button className="auth-link-btn" onClick={() => { resetForm(); setView('forgot'); }}>
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* ── RESET SUCCESS ────────────────────────────────────────────── */}
          {view === 'reset-success' && (
            <div className="auth-form-card premium-card animate-fade-in" style={{ textAlign: 'center' }}>
              <div style={{ margin: '20px 0' }}>
                <CheckCircle size={56} style={{ color: 'var(--color-low)' }} />
              </div>
              <h2 style={{ marginBottom: '8px' }}>Password Reset!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
                Your password has been updated successfully.
              </p>
              <button
                className="auth-submit-btn"
                onClick={() => { resetForm(); setView('signin'); }}
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
