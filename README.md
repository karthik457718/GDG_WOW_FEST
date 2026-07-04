# UrbanAssist AI — backend (real data, real model, real DB)

## What's real here
- **Dataset**: live NYC Open Data 311 complaints (millions of real, labeled citizen
  complaints) pulled via the Socrata API at train time — not synthetic.
  https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9
- **Model**: TF-IDF + LinearSVC trained on that data, mapped to your 6 departments.
  Civil Registration and Property Tax aren't NYC 311 categories, so those two are
  seeded with handwritten examples — swap in real local grievance data if you get
  access to any before judging.
- **DB**: Supabase Postgres — real persistence, real duplicate/cluster detection
  by geo-distance (haversine, 300m radius) + department + 14-day window.
- **LLM**: Gemini API call for the daily briefing text — the one part that should
  stay an actual model call, not a template.

## Setup (10 minutes)

1. **Supabase**: create a free project at supabase.com → SQL Editor → paste and
   run `supabase_schema.sql` → copy your Project URL and `anon` key from
   Settings → API.
2. **Gemini key**: console at ai.google.dev → Get API key. Set `GEMINI_MODEL` to
   whatever model string your account currently shows (you're already using
   Gemini 3.5 Flash in Antigravity — same key/model works here).
3. Copy `.env.example` to `.env` and fill in the three values.
4. Install deps:
   ```
   pip install -r requirements.txt
   ```
5. Train the classifier (pulls ~12,000 real complaints live, takes ~1-2 min):
   ```
   python train_classifier.py
   ```
   This writes `model.joblib`. Check the printed classification report —
   expect 85-95% accuracy on water/roads/electricity/sanitation (they're
   well-separated categories in real complaint text).
6. Run the API:
   ```
   uvicorn app:app --reload --port 8000
   ```
   Test it:
   ```
   curl -X POST localhost:8000/api/report -H "Content-Type: application/json" \
     -d '{"text":"Water pipe burst near market, road flooding","lat":17.71,"lng":83.30}'
   ```

## Deploy (for judging, so it's not "localhost only")

- **Backend** → Render.com: New Web Service → connect this folder → build
  command `pip install -r requirements.txt` → start command
  `uvicorn app:app --host 0.0.0.0 --port $PORT` → add the same env vars. Free
  tier is fine for a demo. Remember to run `train_classifier.py` once (locally)
  and commit `model.joblib` to the repo so Render doesn't need to retrain.
- **Frontend** → Vercel: drag in the `urbanassist.html` file (or wrap it as a
  static site) — Vercel serves static HTML with zero config.

## Wiring the frontend you already have to this real backend

In `urbanassist.html`, the whole `state` object + `fileComplaint()` /
`renderAll()` functions currently run entirely in-browser with fake data.
Replace them with real calls:

```js
const API = "https://your-render-app.onrender.com"; // or http://localhost:8000

async function submitReport(){
  const text = document.getElementById("reportText").value.trim();
  const photo = document.getElementById("chipPhoto").classList.contains("on");
  const voice = document.getElementById("chipVoice").classList.contains("on");
  // pickedCell.lat/lng: convert your grid cell to real lat/lng if you switch
  // to a real map, or keep using cell centroid coordinates for now.
  const res = await fetch(`${API}/api/report`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ text, lat: pickedCell.lat, lng: pickedCell.lng, photo, voice })
  });
  const analysis = await res.json();
  // render `analysis` into #analysisCard exactly as before, using
  // analysis.department, analysis.priority, analysis.eta, analysis.was_merged
}

async function renderAll(){
  const [clusters, queue, briefing] = await Promise.all([
    fetch(`${API}/api/clusters`).then(r=>r.json()),
    fetch(`${API}/api/queue`).then(r=>r.json()),
    fetch(`${API}/api/briefing`).then(r=>r.json()),
  ]);
  // feed `clusters` into renderCommandMap(), `queue` into the table,
  // `briefing.briefing` into #briefingBox
}
```

Poll `renderAll()` every 5-10s (`setInterval`) in the Command Center view so
the dashboard feels live across multiple judges' phones filing reports at once
— that's actually a stronger demo than the single-browser version.

## Honest limitations to state if asked in Q&A
- Civil Registration / Property Tax classes are seeded, not from real complaint
  volume — say so; it's a legitimate scoping call given no public dataset exists
  for those categories.
- Geo-clustering uses straight-line distance, not road-network distance — fine
  for a 300m radius, would matter at city scale.
- No auth on the API yet (RLS policies are wide open) — call this out as the
  first thing you'd harden post-hackathon.
