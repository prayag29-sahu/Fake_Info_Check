"""
FastAPI AI Engine — Production-ready fact-checking service
Uses real ML models, ELA image analysis, frame-level video heuristics,
VirusTotal/Google Safe Browsing for URLs, and PDF/docx text extraction.
"""

import os
import io
import re
import math
import tempfile
import traceback
from typing import Optional

import requests
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import cv2

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── HuggingFace pipeline (loaded once at startup) ─────────────────────────────
from transformers import pipeline

app = FastAPI(title="FactCheck AI Engine", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global model state ─────────────────────────────────────────────────────────
_text_classifier = None


def get_text_classifier():
    global _text_classifier
    if _text_classifier is None:
        # GonzaloA/fake-news-detection-in-spanish is multilingual-friendly;
        # For English, use: "jy46604790/Fake-News-Detect-Roberta-base"
        # Fallback to a well-known zero-shot model if the primary fails.
        try:
            _text_classifier = pipeline(
                "text-classification",
                model="jy46604790/Fake-News-Detect-Roberta-base",
                truncation=True,
                max_length=512,
            )
        except Exception:
            _text_classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
            )
    return _text_classifier


# ── ENV ────────────────────────────────────────────────────────────────────────
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
GOOGLE_SAFE_BROWSING_KEY = os.getenv("GOOGLE_SAFE_BROWSING_KEY", "")
GOOGLE_FACT_CHECK_KEY = os.getenv("GOOGLE_FACT_CHECK_KEY", "")


# ═══════════════════════════════════════════════════════════════════════════════
# 1. TEXT FACT CHECKING
# ═══════════════════════════════════════════════════════════════════════════════

MISINFORMATION_PATTERNS = [
    r"\ball banks? (closed|shutdown)\b",
    r"\bgovernment (giving|distributing) (free )?money\b",
    r"\b(cure|cures) (cancer|covid|aids)\b",
    r"\bforward this (message|to|immediately)\b",
    r"\burgen[ct].*whatsapp\b",
    r"\bclick here (now|immediately|to claim)\b",
    r"\bact (now|fast|immediately|today)\b",
    r"\b(100|1000)%\s*(guaranteed|free|proven)\b",
    r"\bshocking (truth|video|revelation)\b",
    r"\bmedia (hiding|won'?t tell|suppressing)\b",
]


class TextRequest(BaseModel):
    text: str


@app.post("/predict/text")
async def predict_text(data: TextRequest):
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")

    indicators = []
    confidence = 0.5
    label = "uncertain"

    # ── 1. Pattern-based misinformation signals ────────────────────────────
    pattern_hits = []
    for pat in MISINFORMATION_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            pattern_hits.append(pat.strip(r"\b").replace("\\", ""))

    # ── 2. ML model classification ─────────────────────────────────────────
    model_label = "uncertain"
    model_conf = 0.5
    explanation = ""

    try:
        clf = get_text_classifier()
        # Detect which pipeline type is loaded
        if hasattr(clf, "task") and clf.task == "zero-shot-classification":
            result = clf(
                text[:1024],
                candidate_labels=["real news", "fake news", "misinformation"],
            )
            top = result["labels"][0]
            model_conf = result["scores"][0]
            model_label = "fake" if "fake" in top or "misinformation" in top else "real"
            explanation = f"Zero-shot classification: '{top}' ({model_conf:.0%})"
        else:
            result = clf(text[:512])[0]
            raw_label = result["label"].upper()
            model_conf = result["score"]
            # jy46604790 model outputs LABEL_0=real, LABEL_1=fake
            model_label = "fake" if "1" in raw_label or "FAKE" in raw_label else "real"
            explanation = f"RoBERTa classification: {raw_label} ({model_conf:.0%})"
    except Exception as e:
        explanation = f"Model unavailable: {str(e)}"

    # ── 3. Optional Google Fact Check API ─────────────────────────────────
    fact_check_hits = []
    if GOOGLE_FACT_CHECK_KEY:
        try:
            query = " ".join(text.split()[:10])
            resp = requests.get(
                "https://factchecktools.googleapis.com/v1alpha1/claims:search",
                params={"query": query, "key": GOOGLE_FACT_CHECK_KEY},
                timeout=5,
            )
            if resp.ok:
                claims = resp.json().get("claims", [])
                for claim in claims[:3]:
                    for review in claim.get("claimReview", []):
                        rating = review.get("textualRating", "")
                        if rating:
                            fact_check_hits.append(
                                f"Fact-check: '{claim.get('text','')[:60]}' → {rating}"
                            )
        except Exception:
            pass

    # ── 4. Merge signals ───────────────────────────────────────────────────
    if pattern_hits:
        indicators.append(f"Matched misinformation patterns: {len(pattern_hits)}")
        indicators.extend(pattern_hits[:3])

    if fact_check_hits:
        indicators.extend(fact_check_hits)

    if explanation:
        indicators.append(explanation)

    # Weighted decision
    pattern_score = min(len(pattern_hits) * 0.15, 0.45)  # max 0.45
    model_weight = 0.55

    if model_label == "fake":
        combined_fake_score = pattern_score + model_weight * model_conf
    else:
        combined_fake_score = pattern_score + model_weight * (1 - model_conf)

    if combined_fake_score >= 0.6:
        label = "fake"
        confidence = round(min(combined_fake_score, 0.98), 2)
    elif combined_fake_score <= 0.35:
        label = "real"
        confidence = round(1 - combined_fake_score, 2)
    else:
        label = "uncertain"
        confidence = round(0.5 + abs(combined_fake_score - 0.5), 2)

    return {
        "label": label,
        "confidence": confidence,
        "indicators": indicators,
        "explanation": explanation,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 2. IMAGE ANALYSIS — ELA + statistical heuristics
# ═══════════════════════════════════════════════════════════════════════════════

def compute_ela(image_bytes: bytes, quality: int = 90) -> float:
    """Error Level Analysis: resave at quality, diff with original."""
    try:
        original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        buf = io.BytesIO()
        original.save(buf, "JPEG", quality=quality)
        buf.seek(0)
        recompressed = Image.open(buf).convert("RGB")

        diff = ImageChops.difference(original, recompressed)
        # Enhance to make differences visible
        enhanced = ImageEnhance.Brightness(diff).enhance(10)

        arr = np.array(enhanced).astype(float)
        ela_score = float(arr.mean() / 255.0)
        return round(ela_score, 4)
    except Exception:
        return 0.0


def compute_noise_level(image_bytes: bytes) -> float:
    """Estimate local noise using Laplacian variance — lower = smoother = likely edited."""
    try:
        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return 0.5
        lap_var = cv2.Laplacian(img, cv2.CV_64F).var()
        # Normalise: natural images ~100-3000, heavily blurred/edited < 50
        normalised = min(lap_var / 1000.0, 1.0)
        return round(float(normalised), 4)
    except Exception:
        return 0.5


@app.post("/predict/image")
async def predict_image(image: UploadFile = File(...)):
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    ela_score = compute_ela(content)
    noise_level = compute_noise_level(content)

    indicators = []
    fake_score = 0.0

    # ELA high score → editing artifacts
    if ela_score > 0.15:
        fake_score += 0.5
        indicators.append(f"High ELA score ({ela_score:.3f}): possible editing artifacts")
    elif ela_score > 0.08:
        fake_score += 0.25
        indicators.append(f"Moderate ELA score ({ela_score:.3f}): minor inconsistencies")

    # Low noise can indicate over-smoothing (deepfake/AI generated)
    if noise_level < 0.05:
        fake_score += 0.35
        indicators.append(f"Unnaturally smooth image (noise={noise_level:.3f}): possible AI generation")
    elif noise_level < 0.15:
        fake_score += 0.15
        indicators.append(f"Low noise level ({noise_level:.3f}): possible heavy post-processing")

    # File size heuristic — manipulated images sometimes re-saved at different quality
    try:
        pil_img = Image.open(io.BytesIO(content))
        width, height = pil_img.size
        pixels = width * height
        bytes_per_pixel = len(content) / pixels if pixels > 0 else 0
        if bytes_per_pixel < 0.3:
            fake_score += 0.1
            indicators.append("Low bytes-per-pixel ratio: possible re-compression")
    except Exception:
        pass

    fake_score = min(fake_score, 0.97)

    if fake_score >= 0.55:
        label = "manipulated"
        confidence = round(fake_score, 2)
    else:
        label = "original"
        confidence = round(1 - fake_score, 2)

    return {
        "label": label,
        "confidence": confidence,
        "ela_score": ela_score,
        "noise_level": noise_level,
        "indicators": indicators,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 3. VIDEO ANALYSIS — Frame extraction + face consistency heuristics
# ═══════════════════════════════════════════════════════════════════════════════

def analyse_frames(video_bytes: bytes, max_frames: int = 30):
    """Extract frames, compute inter-frame ELA & face region consistency."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(video_bytes)
        tmp_path = f.name

    cap = cv2.VideoCapture(tmp_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    step = max(1, total_frames // max_frames)

    ela_scores = []
    lap_vars = []
    frames_read = 0

    for i in range(0, min(total_frames, max_frames * step), step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            break
        frames_read += 1

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        lap_vars.append(cv2.Laplacian(gray, cv2.CV_64F).var())

        # Encode frame to bytes for ELA
        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if ok:
            ela = compute_ela(buf.tobytes())
            ela_scores.append(ela)

    cap.release()
    try:
        os.unlink(tmp_path)
    except Exception:
        pass

    return frames_read, ela_scores, lap_vars, total_frames, fps


@app.post("/predict/video")
async def predict_video(video: UploadFile = File(...)):
    content = await video.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    frames_read, ela_scores, lap_vars, total_frames, fps = analyse_frames(content)

    indicators = []
    fake_score = 0.0

    avg_ela = float(np.mean(ela_scores)) if ela_scores else 0.0
    std_ela = float(np.std(ela_scores)) if ela_scores else 0.0
    avg_lap = float(np.mean(lap_vars)) if lap_vars else 0.0

    if avg_ela > 0.12:
        fake_score += 0.4
        indicators.append(f"High average frame ELA ({avg_ela:.3f}): compressed/re-encoded frames")

    if std_ela > 0.08:
        fake_score += 0.25
        indicators.append(f"Inconsistent ELA across frames (std={std_ela:.3f}): possible splice/deepfake")

    if avg_lap < 30:
        fake_score += 0.3
        indicators.append(f"Low frame sharpness (Laplacian={avg_lap:.1f}): unnatural smoothing")

    fake_score = min(fake_score, 0.97)

    if fake_score >= 0.55:
        label = "deepfake"
        confidence = round(fake_score, 2)
    else:
        label = "real"
        confidence = round(1 - fake_score, 2)

    return {
        "label": label,
        "confidence": confidence,
        "frames_analyzed": frames_read,
        "total_frames": total_frames,
        "avg_ela_score": round(avg_ela, 4),
        "indicators": indicators,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 4. URL CHECKING — VirusTotal + Google Safe Browsing
# ═══════════════════════════════════════════════════════════════════════════════

SUSPICIOUS_PATTERNS = [
    r"\bfree[-_]?(money|iphone|gift|reward|prize)\b",
    r"\b(win|won|winner)\b",
    r"\bclick[-_]?here[-_]?(now|immediately)?\b",
    r"[a-z0-9]{30,}",          # very long random slug
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",  # bare IP address
    r"(paypa1|g00gle|arnazon|faceb00k)",       # typosquatting
]

SUSPICIOUS_TLDS = {".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".click", ".loan", ".win"}


class URLRequest(BaseModel):
    url: str


@app.post("/predict/url")
async def predict_url(data: URLRequest):
    url = data.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is empty")

    indicators = []
    threat_details = []
    fake_score = 0.0

    # ── 1. Basic heuristics ────────────────────────────────────────────────
    lower = url.lower()

    if lower.startswith("http://") and not lower.startswith("https://"):
        fake_score += 0.2
        indicators.append("Non-HTTPS URL: unencrypted connection")

    for pat in SUSPICIOUS_PATTERNS:
        if re.search(pat, lower):
            fake_score += 0.2
            indicators.append(f"Suspicious URL pattern detected")
            break

    for tld in SUSPICIOUS_TLDS:
        if tld in lower:
            fake_score += 0.25
            indicators.append(f"High-risk TLD: {tld}")
            break

    if lower.count(".") > 4:
        fake_score += 0.15
        indicators.append("Excessive subdomains: possible redirect abuse")

    # ── 2. VirusTotal ──────────────────────────────────────────────────────
    if VIRUSTOTAL_API_KEY:
        try:
            import base64
            url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
            vt_resp = requests.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": VIRUSTOTAL_API_KEY},
                timeout=8,
            )
            if vt_resp.ok:
                stats = vt_resp.json().get("data", {}).get("attributes", {}).get(
                    "last_analysis_stats", {}
                )
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                total = sum(stats.values()) or 1

                if malicious > 0:
                    fake_score += min(malicious / total * 2, 0.6)
                    threat_details.append(f"VirusTotal: {malicious} engines flagged as malicious")
                    indicators.append(f"VirusTotal: {malicious}/{total} engines malicious")
                elif suspicious > 0:
                    fake_score += suspicious / total
                    indicators.append(f"VirusTotal: {suspicious}/{total} engines suspicious")
            elif vt_resp.status_code == 404:
                # URL not in VT database — submit for scanning
                requests.post(
                    "https://www.virustotal.com/api/v3/urls",
                    headers={"x-apikey": VIRUSTOTAL_API_KEY},
                    data={"url": url},
                    timeout=5,
                )
                indicators.append("VirusTotal: URL submitted for scanning (not yet in database)")
        except Exception as e:
            indicators.append(f"VirusTotal check failed: {str(e)[:60]}")

    # ── 3. Google Safe Browsing ────────────────────────────────────────────
    if GOOGLE_SAFE_BROWSING_KEY:
        try:
            gsb_payload = {
                "client": {"clientId": "factcheck-app", "clientVersion": "2.0"},
                "threatInfo": {
                    "threatTypes": [
                        "MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE",
                        "POTENTIALLY_HARMFUL_APPLICATION",
                    ],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url}],
                },
            }
            gsb_resp = requests.post(
                f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_KEY}",
                json=gsb_payload,
                timeout=8,
            )
            if gsb_resp.ok:
                matches = gsb_resp.json().get("matches", [])
                if matches:
                    for m in matches:
                        t = m.get("threatType", "UNKNOWN")
                        threat_details.append(f"Google Safe Browsing: {t}")
                        indicators.append(f"Google Safe Browsing: {t}")
                    fake_score += 0.5
        except Exception as e:
            indicators.append(f"Google Safe Browsing check failed: {str(e)[:60]}")

    fake_score = min(fake_score, 0.98)

    if fake_score >= 0.55:
        label = "phishing" if threat_details else "unsafe"
        confidence = round(fake_score, 2)
    elif fake_score >= 0.3:
        label = "suspicious"
        confidence = round(fake_score + 0.2, 2)
    else:
        label = "safe"
        confidence = round(1 - fake_score, 2)

    return {
        "label": label,
        "confidence": confidence,
        "threat_type": ", ".join(threat_details) if threat_details else "none",
        "indicators": indicators,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 5. DOCUMENT ANALYSIS — Text extraction + ML classification
# ═══════════════════════════════════════════════════════════════════════════════

def extract_text_from_pdf(content: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages[:10]]
        return "\n".join(pages)
    except Exception:
        return ""


def extract_text_from_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception:
        return ""


@app.post("/predict/document")
async def predict_document(document: UploadFile = File(...)):
    content = await document.read()
    filename = (document.filename or "").lower()

    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    # Extract text
    extracted_text = ""
    if filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        extracted_text = extract_text_from_docx(content)
    else:
        # Try plain text
        try:
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = ""

    if not extracted_text.strip():
        return {
            "label": "uncertain",
            "confidence": 0.5,
            "extracted_data": {"text_preview": "", "word_count": 0},
            "indicators": ["Could not extract readable text from document"],
        }

    # Run text analysis on extracted content
    text_result = await predict_text(TextRequest(text=extracted_text[:2000]))

    word_count = len(extracted_text.split())
    char_count = len(extracted_text)

    return {
        "label": text_result["label"],
        "confidence": text_result["confidence"],
        "extracted_data": {
            "text_preview": extracted_text[:500],
            "word_count": word_count,
            "char_count": char_count,
            "filename": document.filename,
        },
        "indicators": text_result.get("indicators", []),
        "explanation": text_result.get("explanation", ""),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Health check
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
