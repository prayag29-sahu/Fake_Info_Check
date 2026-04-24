require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { logger } = require("./utils/logger");

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

app.use(helmet());
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests. Please try again later." },
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 20,
    message: { success: false, error: "AI check rate limit exceeded. Wait a minute." },
});

app.use(globalLimiter);

// ─── ROUTES ───────────────────────────────────────────────────────────────────

const authRoutes     = require("./routes/authRoutes");
const textRoutes     = require("./routes/textRoutes");
const imageRoutes    = require("./routes/imageRoutes");
const urlRoutes      = require("./routes/urlRoutes");
const documentRoutes = require("./routes/documentRoutes");
const historyRoutes  = require("./routes/historyRoutes");
const profileRoutes  = require("./routes/profileRoutes");
const adminRoutes    = require("./routes/adminRoutes");
const videoRoutes    = require("./routes/videoRoutes");

app.use("/api", authRoutes);
app.use("/api", aiLimiter, textRoutes);
app.use("/api", aiLimiter, imageRoutes);
app.use("/api", aiLimiter, urlRoutes);
app.use("/api", aiLimiter, documentRoutes);
app.use("/api", aiLimiter, videoRoutes);
app.use("/api", historyRoutes);
app.use("/api", profileRoutes);
app.use("/api", adminRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "API running", version: "2.0" });
});

app.get("/", (req, res) => res.send("FactCheck Backend v2.0"));

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
    logger.error(`[${req.method}] ${req.path} → ${err.message}`);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

// ─── START ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
