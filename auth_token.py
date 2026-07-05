"""
auth_token.py — Production auth with Supabase (real PostgreSQL cloud DB).

WHY SUPABASE:
  - Free forever (500MB, unlimited users)
  - Real PostgreSQL — works like any production website
  - Data persists across ALL restarts permanently
  - No file system dependency

SETUP (5 minutes, free):
  1. Go to https://supabase.com → New Project (free)
  2. After project creates, go to SQL Editor → run this once:

      CREATE TABLE IF NOT EXISTS users (
        username   TEXT PRIMARY KEY,
        email      TEXT UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        token      TEXT,
        verified   BOOLEAN DEFAULT TRUE,
        created_at DOUBLE PRECISION,
        last_login DOUBLE PRECISION
      );
      CREATE TABLE IF NOT EXISTS otps (
        key        TEXT PRIMARY KEY,
        otp        TEXT NOT NULL,
        expires_at DOUBLE PRECISION NOT NULL
      );

  3. Go to Project Settings → API → copy:
       - Project URL      → SUPABASE_URL
       - service_role key → SUPABASE_KEY
         ⚠️  MUST be the service_role key (under "Secret"), NOT the anon/public key.
             The anon key is for browser clients and will cause RLS 401 errors.

  4. Add to .env:
       SUPABASE_URL = https://xxxx.supabase.co
       SUPABASE_KEY = eyJhb...your SERVICE ROLE key...
       BREVO_API_KEY = your-brevo-api-key
       EMAIL_SENDER  = your-verified-sender@example.com

  5. Restart server — done. All signups persist forever.

FALLBACK: If Supabase not configured, falls back to /tmp SQLite
          (works within a session but resets on container restart).
"""

import json, os, hashlib, secrets, time, random, sqlite3, urllib.request, urllib.error, urllib.parse


def _validate_env():
    warnings = []
    if not os.environ.get("SUPABASE_URL"):
        warnings.append("SUPABASE_URL not set — falling back to SQLite (data lost on restart)")
    if not os.environ.get("SUPABASE_KEY"):
        warnings.append("SUPABASE_KEY not set — falling back to SQLite")
    if not os.environ.get("BREVO_API_KEY"):
        warnings.append("BREVO_API_KEY not set — OTP emails will not be sent")
    if not os.environ.get("EMAIL_SENDER"):
        warnings.append("EMAIL_SENDER not set — OTP emails will not be sent")
    return warnings


STARTUP_WARNINGS = _validate_env()

# ── CONFIG ────────────────────────────────────────────────────────────────────
BREVO_API_KEY  = os.environ.get("BREVO_API_KEY", "")
EMAIL_SENDER   = os.environ.get("EMAIL_SENDER",  "")
SENDER_NAME    = "UrbanAssist AI"
SUPABASE_URL   = os.environ.get("SUPABASE_URL", "").rstrip("/")
if SUPABASE_URL.endswith("/rest/v1"):
    SUPABASE_URL = SUPABASE_URL[:-8].rstrip("/")
SUPABASE_KEY   = os.environ.get("SUPABASE_KEY", "")
SQLITE_PATH    = "/tmp/urbanassist_auth.db"
TMP_USERS      = SQLITE_PATH

# ── HELPERS ───────────────────────────────────────────────────────────────────
def hash_password(pw, salt=None):
    import hashlib, secrets as _sec
    if salt is None:
        salt = _sec.token_hex(16)
    dk = hashlib.pbkdf2_hmac('sha256', pw.encode(), salt.encode(), 100_000)
    return f"pbkdf2:{salt}:{dk.hex()}"


def verify_password(pw, stored):
    import hashlib
    if stored.startswith("pbkdf2:"):
        _, salt, _ = stored.split(":", 2)
        return hash_password(pw, salt) == stored
    return hashlib.sha256(pw.encode()).hexdigest() == stored


def generate_token():   return secrets.token_hex(32)
def generate_otp():     return str(random.randint(100000, 999999))
def _hf_ready():        return bool(SUPABASE_URL) and bool(SUPABASE_KEY)


# ══════════════════════════════════════════════════════════════════════════════
# SUPABASE REST API
# ══════════════════════════════════════════════════════════════════════════════
def _sb_headers():
    return {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
    }


def _sb_get(table, filters=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}&select=*"
    req = urllib.request.Request(url, headers=_sb_headers())
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read().decode())
    except Exception:
        return []


def _sb_upsert(table, row):
    headers = {**_sb_headers(), "Prefer": "resolution=merge-duplicates,return=representation"}
    payload = json.dumps(row).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}",
        data=payload, headers=headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Supabase upsert error {e.code}: {e.read().decode()[:300]}")


def _sb_delete(table, filters):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}"
    req = urllib.request.Request(url, headers=_sb_headers(), method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=8):
            return True
    except Exception:
        return False


def _sb_patch(table, filters, data):
    headers = {**_sb_headers(), "Prefer": "return=representation"}
    payload = json.dumps(data).encode()
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}"
    req = urllib.request.Request(url, data=payload, headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Supabase patch error {e.code}: {e.read().decode()[:300]}")


# ══════════════════════════════════════════════════════════════════════════════
# SQLITE FALLBACK
# ══════════════════════════════════════════════════════════════════════════════
_db_conn = None


def _db():
    global _db_conn
    if _db_conn is None:
        _db_conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
        _db_conn.row_factory = sqlite3.Row
        _db_conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                username   TEXT PRIMARY KEY,
                email      TEXT UNIQUE NOT NULL,
                password   TEXT NOT NULL,
                token      TEXT,
                verified   INTEGER DEFAULT 1,
                created_at REAL,
                last_login REAL
            )""")
        _db_conn.execute("""
            CREATE TABLE IF NOT EXISTS otps (
                key        TEXT PRIMARY KEY,
                otp        TEXT NOT NULL,
                expires_at REAL NOT NULL
            )""")
        _db_conn.commit()
    return _db_conn


# ── Unified DB operations ─────────────────────────────────────────────────────

def _get_user(username_or_email):
    inp = username_or_email.strip().lower()
    if _hf_ready():
        rows = _sb_get("users", f"username=eq.{urllib.parse.quote(inp)}")
        if not rows:
            rows = _sb_get("users", f"email=eq.{urllib.parse.quote(inp)}")
        return rows[0] if rows else None
    else:
        c = _db().execute(
            "SELECT * FROM users WHERE lower(username)=? OR lower(email)=?",
            (inp, inp)
        ).fetchone()
        return dict(c) if c else None


def _get_user_by_username(username):
    u = username.strip()
    if _hf_ready():
        rows = _sb_get("users", f"username=eq.{urllib.parse.quote(u)}")
        return rows[0] if rows else None
    else:
        c = _db().execute("SELECT * FROM users WHERE lower(username)=?",
                          (u.lower(),)).fetchone()
        return dict(c) if c else None


def _get_user_by_email(email):
    e = email.strip().lower()
    if _hf_ready():
        rows = _sb_get("users", f"email=eq.{urllib.parse.quote(e)}")
        return rows[0] if rows else None
    else:
        c = _db().execute("SELECT * FROM users WHERE lower(email)=?",
                          (e,)).fetchone()
        return dict(c) if c else None


def _upsert_user(user: dict):
    if _hf_ready():
        # Coerce verified to integer — Supabase INTEGER column rejects Python bools
        user = dict(user)
        user["verified"] = 1 if user.get("verified") else 0
        _sb_upsert("users", user)
    else:
        db = _db()
        db.execute("""
            INSERT INTO users (username,email,password,token,verified,created_at,last_login)
            VALUES (:username,:email,:password,:token,:verified,:created_at,:last_login)
            ON CONFLICT(username) DO UPDATE SET
              token=excluded.token, last_login=excluded.last_login,
              password=excluded.password
        """, {
            "username":   user["username"],
            "email":      user["email"],
            "password":   user["password"],
            "token":      user.get("token"),
            "verified":   1,
            "created_at": user.get("created_at", time.time()),
            "last_login": user.get("last_login"),
        })
        db.commit()


def _update_user(username, data: dict):
    if _hf_ready():
        _sb_patch("users", f"username=eq.{urllib.parse.quote(username)}", data)
    else:
        cols = ", ".join(f"{k}=?" for k in data)
        vals = list(data.values()) + [username.lower()]
        _db().execute(f"UPDATE users SET {cols} WHERE lower(username)=?", vals)
        _db().commit()


def _get_otp(key):
    if _hf_ready():
        rows = _sb_get("otps", f"key=eq.{urllib.parse.quote(key)}")
        return rows[0] if rows else None
    else:
        c = _db().execute("SELECT * FROM otps WHERE key=?", (key,)).fetchone()
        return dict(c) if c else None


def _upsert_otp(key, otp, expires_at):
    if _hf_ready():
        _sb_upsert("otps", {"key": key, "otp": otp, "expires_at": expires_at})
    else:
        _db().execute("""
            INSERT INTO otps(key,otp,expires_at) VALUES(?,?,?)
            ON CONFLICT(key) DO UPDATE SET otp=excluded.otp, expires_at=excluded.expires_at
        """, (key, otp, expires_at))
        _db().commit()


def _delete_otp(key):
    if _hf_ready():
        _sb_delete("otps", f"key=eq.{urllib.parse.quote(key)}")
    else:
        _db().execute("DELETE FROM otps WHERE key=?", (key,))
        _db().commit()


def load_users():
    try:
        if _hf_ready():
            rows = _sb_get("users", "select=username")
            return {r["username"]: {} for r in rows}
        else:
            rows = _db().execute("SELECT username FROM users").fetchall()
            return {r["username"]: {} for r in rows}
    except Exception:
        return {}


# ══════════════════════════════════════════════════════════════════════════════
# OTP  (Brevo email)
# ══════════════════════════════════════════════════════════════════════════════
def send_otp_email(to_email, otp, purpose="signup"):
    if not BREVO_API_KEY:
        return False, "BREVO_API_KEY not set in environment."
    if not EMAIL_SENDER:
        return False, "EMAIL_SENDER not set in environment."

    html_body = """<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#080c16;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="460" cellpadding="0" cellspacing="0"
  style="background:#0f1626;border-radius:12px;overflow:hidden;border:1px solid rgba(59,130,246,.3);">
  <tr><td style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:28px 32px;text-align:center;">
    <div style="font-size:24px;letter-spacing:4px;color:white;font-weight:900;">🏙️ URBANASSIST AI</div>
    <div style="color:rgba(255,255,255,.6);font-size:11px;letter-spacing:3px;margin-top:6px;">CIVIC GRIEVANCE ENGINE</div>
  </td></tr>
  <tr><td style="padding:32px 36px;">
    <p style="color:rgba(255,255,255,.75);font-size:15px;margin:0 0 24px;">Your verification code is:</p>
    <div style="background:rgba(59,130,246,.1);border:2px solid rgba(59,130,246,.4);border-radius:8px;padding:24px;text-align:center;">
      <span style="font-size:44px;font-weight:900;letter-spacing:16px;color:#3b82f6;">""" + otp + """</span>
    </div>
    <p style="color:rgba(255,255,255,.4);font-size:12px;margin:20px 0 0;line-height:1.7;">
      Expires in <strong style="color:rgba(255,255,255,.6)">10 minutes</strong>.<br>
      If you didn't request this, ignore this email.
    </p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,.08);margin:22px 0;">
    <p style="color:rgba(255,255,255,.2);font-size:11px;text-align:center;margin:0;">UrbanAssist AI — Smart City Management</p>
  </td></tr>
</table></td></tr></table>
</body></html>"""

    payload = json.dumps({
        "sender":      {"name": SENDER_NAME, "email": EMAIL_SENDER},
        "to":          [{"email": to_email}],
        "subject":     f"UrbanAssist AI — Your code: {otp}",
        "htmlContent": html_body,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email", data=payload,
        headers={"accept": "application/json", "api-key": BREVO_API_KEY,
                 "content-type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return (True, "OTP sent!") if r.status in (200, 201, 202) \
                   else (False, f"Brevo status {r.status}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', 'ignore')
        return False, f"Brevo error {e.code}: {err_msg[:200]}"
    except Exception as e:
        return False, f"Email failed: {e}"


def store_otp(email, otp, purpose="signup"):
    _upsert_otp(f"{purpose}:{email.lower().strip()}", otp, time.time() + 600)


def verify_otp(email, otp_input, purpose="signup", delete_on_success=True):
    key = f"{purpose}:{email.lower().strip()}"
    rec = _get_otp(key)
    if not rec:
        return False, "Code not found. Please request a new one."
    if time.time() > float(rec["expires_at"]):
        _delete_otp(key)
        return False, "Code expired. Please request a new one."
    if rec["otp"] != otp_input.strip():
        return False, "Incorrect code. Please try again."
    if delete_on_success:
        _delete_otp(key)
    return True, "Verified!"


# ══════════════════════════════════════════════════════════════════════════════
# SIGNUP
# ══════════════════════════════════════════════════════════════════════════════
def initiate_signup(username, email):
    username = username.strip()
    email    = email.strip().lower()
    if _get_user_by_username(username):
        return False, "Username already taken."
    if _get_user_by_email(email):
        return False, "Email already registered. Please sign in."
    if not BREVO_API_KEY or not EMAIL_SENDER:
        return True, "__NO_OTP__"
    otp = generate_otp()
    ok, msg = send_otp_email(email, otp)
    if not ok:
        return False, msg
    store_otp(email, otp)
    return True, f"Code sent to {email}"


def verify_signup_otp_only(email, otp_input):
    return verify_otp(email, otp_input, delete_on_success=False)


def complete_signup(username, email, password, otp_input):
    # Verify OTP if email service is active
    if BREVO_API_KEY and EMAIL_SENDER:
        ok, msg = verify_otp(email, otp_input)
        if not ok:
            return False, None, msg
    
    token = generate_token()
    _upsert_user({
        "username":   username.strip(),
        "email":      email.strip().lower(),
        "password":   hash_password(password),
        "token":      token,
        "verified":   1,
        "created_at": time.time(),
        "last_login": None,
    })
    return True, token, "Account created! Please sign in."


# ══════════════════════════════════════════════════════════════════════════════
# LOGIN
# ══════════════════════════════════════════════════════════════════════════════
def login(email, password):
    user = _get_user_by_email(email)
    if not user:
        return False, None, None, "Account not found. Please sign up first."
    if not verify_password(password, user["password"]):
        return False, None, None, "Incorrect password. Please try again."
    if not user["password"].startswith("pbkdf2:"):
        _update_user(user["username"], {"password": hash_password(password)})
    token = generate_token()
    real_username = user["username"]
    _update_user(real_username, {"token": token, "last_login": time.time()})
    return True, token, real_username, "Login successful!"


# ══════════════════════════════════════════════════════════════════════════════
# TOKEN / LOGOUT
# ══════════════════════════════════════════════════════════════════════════════
def verify_token(username, token):
    user = _get_user_by_username(username)
    return bool(user and user.get("token") == token)


def logout(username):
    try:
        _update_user(username.strip(), {"token": None})
        return True
    except Exception:
        return False


# ══════════════════════════════════════════════════════════════════════════════
# PASSWORD RESET (OTP-based)
# ══════════════════════════════════════════════════════════════════════════════
def reset_password_request(email_or_username: str):
    """Step 1: look up user, send OTP for password reset."""
    email_or_username = email_or_username.strip().lower()
    user = _get_user(email_or_username)
    if not user:
        return False, "No account found with that email or username."
    email = user["email"]
    if not BREVO_API_KEY or not EMAIL_SENDER:
        return True, "__NO_OTP__"
    otp = generate_otp()
    ok, msg = send_otp_email(email, otp, purpose="reset")
    if not ok:
        return False, msg
    store_otp(email, otp, purpose="reset")
    if "Code generated!" in msg:
        return True, msg
    return True, f"Reset code sent to {email}"


def reset_password_confirm(email_or_username: str, otp_input: str, new_password: str):
    """Step 2: verify OTP then update password."""
    email_or_username = email_or_username.strip().lower()
    user = _get_user(email_or_username)
    if not user:
        return False, "Account not found."
    email = user["email"]
    if new_password and len(new_password) < 6:
        return False, "New password must be at least 6 characters."
    if BREVO_API_KEY and EMAIL_SENDER:
        ok, msg = verify_otp(email, otp_input, purpose="reset")
        if not ok:
            return False, msg
    _update_user(user["username"], {"password": hash_password(new_password)})
    return True, "Password updated! You can now sign in."
