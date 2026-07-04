const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Auth API ─────────────────────────────────────────────────────────────────

export async function signUp(username, email) {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Sign up failed');
  return data;
}

export async function verifySignUpOTP(email, otp) {
  const res = await fetch(`${API_URL}/api/auth/signup/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'OTP verification failed');
  return data;
}

export async function completeSignUp(username, email, password, otp) {
  const res = await fetch(`${API_URL}/api/auth/signup/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Sign up completion failed');
  return data;
}

export async function signIn(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Sign in failed');
  return data;
}

export async function authLogout(username) {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Logout failed');
  return data;
}

export async function forgotPassword(email_or_username) {
  const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_username }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export async function resetPassword(email_or_username, otp, new_password) {
  const res = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_username, otp, new_password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Reset failed');
  return data;
}

export async function verifyToken(username, token) {
  const res = await fetch(`${API_URL}/api/auth/verify-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Token invalid');
  return data;
}

// ── Incident API ─────────────────────────────────────────────────────────────

export async function submitReport(text, lat, lng, photo = false, voice = false) {
  const res = await fetch(`${API_URL}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lat, lng, photo, voice }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to submit report: ${errText || res.statusText}`);
  }
  return res.json();
}

export async function getClusters() {
  const res = await fetch(`${API_URL}/api/clusters`);
  if (!res.ok) {
    throw new Error('Failed to fetch clusters');
  }
  return res.json();
}

export async function getQueue() {
  const res = await fetch(`${API_URL}/api/queue`);
  if (!res.ok) {
    throw new Error('Failed to fetch queue');
  }
  return res.json();
}

export async function getBriefing() {
  const res = await fetch(`${API_URL}/api/briefing`);
  if (!res.ok) {
    throw new Error('Failed to fetch briefing');
  }
  return res.json();
}
