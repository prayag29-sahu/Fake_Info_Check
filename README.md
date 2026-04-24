# FactCheck AI — Full-Stack Setup Guide

## Architecture

```
Frontend (Next.js :3000)
    ↓ HTTP + JWT
Backend (Node.js/Express :5000)
    ↓ HTTP (multipart/JSON)
AI Engine (Python FastAPI :8000)
    ↓ External APIs
VirusTotal / Google Safe Browsing / HuggingFace models
```

---

## 1. Supabase Setup

1. Create a project at https://supabase.com
2. Go to **SQL Editor** → New Query
3. Paste and run the contents of `supabase_schema.sql`
4. Go to **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Firebase Setup

1. Create a project at https://console.firebase.google.com
2. Enable **Storage** (Firebase Storage)
3. Go to **Project Settings → Service Accounts** → Generate new private key
4. Save the JSON as `backend/config/firebase-service-account.json`
5. Copy your Storage bucket name (e.g. `your-project.appspot.com`)

---

## 3. AI Engine (Python FastAPI)

```bash
cd ai-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add API keys (all optional — degrades gracefully without them)
# VIRUSTOTAL_API_KEY=...
# GOOGLE_SAFE_BROWSING_KEY=...
# GOOGLE_FACT_CHECK_KEY=...

# Start server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Note on first run:** The HuggingFace model (~500MB) downloads automatically on first request.
This takes 1-3 minutes. Subsequent starts are instant (cached locally).

### Getting free API keys (optional but recommended):
- **VirusTotal**: https://www.virustotal.com/gui/sign-in → API Key (free tier: 500 req/day)
- **Google Safe Browsing**: https://developers.google.com/safe-browsing → Get API Key (free)
- **Google Fact Check**: https://developers.google.com/fact-check → Get API Key (free)

---

## 4. Backend (Node.js/Express)

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# FIREBASE_STORAGE_BUCKET=your-project.appspot.com
# AI_ENGINE_URL=http://localhost:8000
# PORT=5000
# FRONTEND_URL=http://localhost:3000

# Create logs directory
mkdir -p logs

# Start server
npm run dev       # development (nodemon)
# or
npm start         # production
```

---

## 5. Frontend (Next.js)

```bash
cd frontend

# Install dependencies (if not already)
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Open http://localhost:3000

---

## Running All Three Together

Open three terminal windows:

**Terminal 1 — AI Engine:**
```bash
cd ai-engine && source venv/bin/activate && uvicorn main:app --port 8000 --reload
```

**Terminal 2 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend && npm run dev
```

---

## API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/profile` | Get current user |
| POST | `/api/auth/logout` | Logout |

### AI Checks (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/text/check` | `{ text: string }` |
| POST | `/api/url/check` | `{ url: string }` |
| POST | `/api/image/check` | FormData: `image` file |
| POST | `/api/video/check` | FormData: `video` file |
| POST | `/api/document/check` | FormData: `document` file |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Scan history |
| DELETE | `/api/history/:id` | Delete scan |
| GET | `/api/profile` | User profile |
| PUT | `/api/profile` | Update profile |

### AI Engine (internal — called by backend)
| Method | Endpoint |
|--------|----------|
| POST | `http://localhost:8000/predict/text` |
| POST | `http://localhost:8000/predict/image` |
| POST | `http://localhost:8000/predict/video` |
| POST | `http://localhost:8000/predict/url` |
| POST | `http://localhost:8000/predict/document` |

---

## What the AI Engine Does

| Check | Method | Details |
|-------|--------|---------|
| Text | RoBERTa model (`jy46604790/Fake-News-Detect-Roberta-base`) + regex patterns + Google Fact Check API | Returns label, confidence, indicators, explanation |
| Image | ELA (Error Level Analysis) + Laplacian variance (noise) + bytes-per-pixel ratio | Returns label, confidence, ela_score, noise_level |
| Video | Frame extraction with OpenCV + per-frame ELA + sharpness variance | Returns label, confidence, frames_analyzed, avg_ela_score |
| URL | Regex heuristics + TLD blacklist + VirusTotal API + Google Safe Browsing | Returns label, confidence, threat_type |
| Document | PDF/DOCX text extraction (pypdf/python-docx) → text analysis pipeline | Returns label, confidence, extracted_data |
# Fake_Info_Check
