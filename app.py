"""
UrbanAssist AI - backend API.

Endpoints:
  POST /api/report     file a citizen complaint -> classify, cluster, priority, ETA
  GET  /api/clusters    open incidents for the map
  GET  /api/queue       incidents sorted by priority for the command center table
  GET  /api/briefing    Gemini-generated daily briefing from live stats

Env vars required (put in a .env file, see .env.example):
  SUPABASE_URL, SUPABASE_KEY   -> from your Supabase project settings
  GEMINI_API_KEY               -> from Google AI Studio (ai.google.dev)
  GEMINI_MODEL                 -> e.g. "gemini-2.0-flash" (use whatever model
                                   string your Google AI Studio account shows)
"""

import os
import uuid
import math
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

from google.cloud import firestore
import auth_token

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# Initialize Firestore
db = firestore.Client()
model = joblib.load("model.joblib")

app = FastAPI(title="UrbanAssist AI")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# Serve static assets from front-end build directory if it exists
assets_dir = "urbanassist-frontend/dist/assets"
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

DEPT_META = {
    "water":       {"label": "Water & Sewerage",      "sla_days": 3},
    "roads":       {"label": "Roads & Infrastructure", "sla_days": 5},
    "electricity": {"label": "Electricity Dept",       "sla_days": 2},
    "sanitation":  {"label": "Sanitation Dept",        "sla_days": 1},
    "civil":       {"label": "Civil Registration",     "sla_days": 7},
    "revenue":     {"label": "Revenue / Property Tax", "sla_days": 10},
    "general":     {"label": "General / Uncategorized", "sla_days": 5},
}

URGENT_KEYWORDS = [
    "burst", "overflow", "flooding", "sewage overflow", "contaminat",
    "accident", "collapse", "caved", "sinkhole",
    "exposed wire", "spark", "shock", "fire", "sparking",
    "overflowing", "medical waste", "biohazard", "stench",
]

CLUSTER_RADIUS_METERS = 300
CLUSTER_WINDOW_DAYS = 14


# ── Pydantic models ──────────────────────────────────────────────────────────

class ReportIn(BaseModel):
    text: str
    lat: float
    lng: float
    photo: bool = False
    voice: bool = False


class SignUpIn(BaseModel):
    username: str
    email: str


class VerifySignupOTPIn(BaseModel):
    email: str
    otp: str


class CompleteSignupIn(BaseModel):
    username: str
    email: str
    password: str
    otp: str


class LoginIn(BaseModel):
    email: str
    password: str


class LogoutIn(BaseModel):
    username: str


class ForgotPasswordIn(BaseModel):
    email_or_username: str


class ResetPasswordIn(BaseModel):
    email_or_username: str
    otp: str
    new_password: str


class VerifyTokenIn(BaseModel):
    username: str
    token: str


# ── Helper functions ──────────────────────────────────────────────────────────

def haversine_m(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def classify(text: str):
    # Predict probabilities to support confidence thresholding
    probs = model.predict_proba([text])[0]
    max_prob = max(probs)
    classes = model.classes_
    
    # If confidence is low, assign to general category
    if max_prob < 0.40:
        dept = "general"
    else:
        dept = classes[probs.argmax()]
        
    urgent = any(k in text.lower() for k in URGENT_KEYWORDS)
    return dept, urgent


def priority_from(urgent: bool, cluster_count: int) -> int:
    if urgent or cluster_count >= 5:
        return 3
    if cluster_count >= 3:
        return 2
    return 3 if urgent else (2 if cluster_count >= 1 else 1)


def eta_for(dept: str, priority: int) -> str:
    sla = DEPT_META[dept]["sla_days"]
    if priority == 3:
        return "Immediate dispatch"
    if priority == 2:
        return f"{sla} day{'s' if sla > 1 else ''}"
    return f"{sla + 2} days"


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/signup")
def signup(body: SignUpIn):
    ok, msg = auth_token.initiate_signup(body.username, body.email)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    if msg == "__NO_OTP__":
        return {"success": True, "otp_required": False, "message": "Development Mode: Set your password directly to complete account creation."}
    return {"success": True, "otp_required": True, "message": msg}


@app.post("/api/auth/signup/verify-otp")
def signup_verify_otp(body: VerifySignupOTPIn):
    ok, msg = auth_token.verify_signup_otp_only(body.email, body.otp)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}


@app.post("/api/auth/signup/complete")
def signup_complete(body: CompleteSignupIn):
    ok, token, msg = auth_token.complete_signup(body.username, body.email, body.password, body.otp)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "token": token, "username": body.username.strip(), "message": msg}


@app.post("/api/auth/login")
def auth_login(body: LoginIn):
    ok, token, username, msg = auth_token.login(body.email, body.password)
    if not ok:
        raise HTTPException(status_code=401, detail=msg)
    return {"success": True, "token": token, "username": username, "message": msg}


@app.post("/api/auth/logout")
def auth_logout(body: LogoutIn):
    auth_token.logout(body.username)
    return {"success": True, "message": "Logged out."}


@app.post("/api/auth/forgot-password")
def forgot_password(body: ForgotPasswordIn):
    ok, msg = auth_token.reset_password_request(body.email_or_username)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    if msg == "__NO_OTP__":
        return {"success": True, "otp_required": False, "message": "Email service not configured. Contact admin."}
    return {"success": True, "otp_required": True, "message": msg}


@app.post("/api/auth/reset-password")
def reset_password(body: ResetPasswordIn):
    ok, msg = auth_token.reset_password_confirm(body.email_or_username, body.otp, body.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}


@app.post("/api/auth/verify-token")
def verify_token_endpoint(body: VerifyTokenIn):
    valid = auth_token.verify_token(body.username, body.token)
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")
    return {"success": True, "valid": True}


# ══════════════════════════════════════════════════════════════════════════════
# INCIDENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/report")
def file_report(r: ReportIn):
    dept, urgent = classify(r.text)

    # Fetch active open incidents for this department
    incidents_ref = db.collection("incidents")
    existing_docs = incidents_ref.where("dept", "==", dept).where("status", "==", "open").stream()

    cutoff = datetime.now(timezone.utc) - timedelta(days=CLUSTER_WINDOW_DAYS)
    match = None
    for doc in existing_docs:
        inc = doc.to_dict()
        # Parse created_at. Firestore returns timezone-aware datetime objects natively.
        created_at = inc.get("created_at")
        if created_at and created_at < cutoff:
            continue
        if haversine_m(r.lat, r.lng, inc["lat"], inc["lng"]) <= CLUSTER_RADIUS_METERS:
            match = inc
            break

    if match:
        new_count = match["count"] + 1
        new_priority = priority_from(urgent or match["urgent"], new_count)
        incidents_ref.document(match["id"]).update({
            "count": new_count,
            "urgent": match["urgent"] or urgent,
            "priority": new_priority,
        })
        incident_id = match["id"]
        cluster_count = new_count
        priority = new_priority
        was_merged = True
    else:
        incident_id = "INC-" + uuid.uuid4().hex[:6].upper()
        priority = priority_from(urgent, 1)
        incidents_ref.document(incident_id).set({
            "id": incident_id,
            "dept": dept,
            "lat": r.lat,
            "lng": r.lng,
            "count": 1,
            "urgent": urgent,
            "priority": priority,
            "status": "open",
            "created_at": datetime.now(timezone.utc)
        })
        cluster_count = 1
        was_merged = False

    docket_id = "DOC-" + uuid.uuid4().hex[:6].upper()
    db.collection("complaints").document(docket_id).set({
        "id": docket_id,
        "incident_id": incident_id,
        "text": r.text,
        "dept": dept,
        "lat": r.lat,
        "lng": r.lng,
        "photo": r.photo,
        "voice": r.voice,
        "priority": priority,
        "status": 0,
        "created_at": datetime.now(timezone.utc)
    })

    return {
        "docket_id": docket_id,
        "incident_id": incident_id,
        "department": DEPT_META[dept]["label"],
        "priority": {1: "low", 2: "medium", 3: "critical"}[priority],
        "eta": eta_for(dept, priority),
        "was_merged": was_merged,
        "cluster_count": cluster_count,
    }


@app.get("/api/clusters")
def get_clusters():
    docs = db.collection("incidents").where("status", "==", "open").stream()
    return [doc.to_dict() for doc in docs]


@app.get("/api/queue")
def get_queue():
    docs = db.collection("incidents").where("status", "==", "open").stream()
    rows = [doc.to_dict() for doc in docs]
    rows.sort(key=lambda c: (-c["priority"], -c["count"]))
    for c in rows:
        c["department"] = DEPT_META[c["dept"]]["label"]
        c["eta"] = eta_for(c["dept"], c["priority"])
    return rows


@app.get("/api/briefing")
def get_briefing():
    docs = db.collection("incidents").where("status", "==", "open").stream()
    clusters = [doc.to_dict() for doc in docs]
    stats = {
        "total_open": len(clusters),
        "critical": sum(1 for c in clusters if c["priority"] == 3),
        "top": sorted(clusters, key=lambda c: (-c["priority"], -c["count"]))[0] if clusters else None,
        "load_by_dept": {},
    }
    for c in clusters:
        stats["load_by_dept"][c["dept"]] = stats["load_by_dept"].get(c["dept"], 0) + c["count"]

    # Fallback text briefing if Gemini key is missing or is the default placeholder
    fallback_briefing = (
        f"Command Center Status: {stats['total_open']} open incidents currently active in dispatch, "
        f"with {stats['critical']} marked critical. "
    )
    if stats['top']:
        top_dept_label = DEPT_META.get(stats['top']['dept'], {}).get('label', stats['top']['dept'])
        fallback_briefing += (
            f"The highest priority incident is {stats['top']['id']} in {top_dept_label} "
            f"with {stats['top']['count']} aggregated complaints. Please assign emergency dispatchers."
        )
    else:
        fallback_briefing += "No urgent issues detected. City infrastructure status is normal."

    is_placeholder = not GEMINI_API_KEY or "your-google-ai-studio-key" in GEMINI_API_KEY
    if is_placeholder:
        return {"briefing": fallback_briefing}

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gmodel = genai.GenerativeModel(GEMINI_MODEL)
        prompt = (
            "You are writing a professional, high-level daily briefing for the City Commissioner "
            "responsible for municipal operations. "
            "Below is the live civic complaint data summary in JSON format:\n"
            f"{json.dumps(stats, default=str)}\n\n"
            "Please write a concise 3-sentence daily briefing. "
            "Sentence 1: Summarize the current state of municipal operations, mentioning the total open incidents and critical issues. "
            "Sentence 2: Identify the department experiencing the highest load or the single most critical active incident. "
            "Sentence 3: Provide one specific, concrete, and actionable recommendation for today's deployment. "
            "Rules: Use a direct, professional, and confident tone. Do NOT include any preamble (such as 'Here is your briefing:'), "
            "introductory greetings, or notes. Output exactly the 3 sentences of the briefing."
        )
        resp = gmodel.generate_content(prompt)
        return {"briefing": resp.text.strip()}
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"briefing": fallback_briefing}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def read_root():
    index_path = "urbanassist-frontend/dist/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("Frontend build not found. Run npm run build inside urbanassist-frontend first.")


@app.get("/{catchall:path}")
def serve_frontend(catchall: str):
    if catchall.startswith("api/") or catchall.startswith("health") or catchall.startswith("docs") or catchall.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="API route not found")
    
    index_path = "urbanassist-frontend/dist/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("Frontend build not found. Run npm run build inside urbanassist-frontend first.")
