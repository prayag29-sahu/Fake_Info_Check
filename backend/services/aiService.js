const axios = require("axios");
const FormData = require("form-data");
const { logger } = require("../utils/logger");

const AI_BASE_URL = process.env.AI_ENGINE_URL || "http://localhost:8000";
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT_MS || "60000");

// ── TEXT ──────────────────────────────────────────────────────────────────────

exports.checkText = async (text) => {
    const res = await axios.post(
        `${AI_BASE_URL}/predict/text`,
        { text },
        { timeout: AI_TIMEOUT }
    );
    return res.data;
};

// ── IMAGE ─────────────────────────────────────────────────────────────────────

exports.checkImage = async (buffer, originalname = "image.jpg", mimetype = "image/jpeg") => {
    const form = new FormData();
    form.append("image", buffer, { filename: originalname, contentType: mimetype });

    const res = await axios.post(`${AI_BASE_URL}/predict/image`, form, {
        headers: form.getHeaders(),
        timeout: AI_TIMEOUT,
        maxBodyLength: Infinity,
    });
    return res.data;
};

// ── VIDEO ─────────────────────────────────────────────────────────────────────

exports.checkVideo = async (buffer, originalname = "video.mp4", mimetype = "video/mp4") => {
    const form = new FormData();
    form.append("video", buffer, { filename: originalname, contentType: mimetype });

    const res = await axios.post(`${AI_BASE_URL}/predict/video`, form, {
        headers: form.getHeaders(),
        timeout: AI_TIMEOUT * 3,   // video analysis is slower
        maxBodyLength: Infinity,
    });
    return res.data;
};

// ── URL ───────────────────────────────────────────────────────────────────────

exports.checkURL = async (url) => {
    const res = await axios.post(
        `${AI_BASE_URL}/predict/url`,
        { url },
        { timeout: AI_TIMEOUT }
    );
    return res.data;
};

// ── DOCUMENT ──────────────────────────────────────────────────────────────────

exports.checkDocument = async (buffer, originalname = "file.pdf", mimetype = "application/pdf") => {
    const form = new FormData();
    form.append("document", buffer, { filename: originalname, contentType: mimetype });

    const res = await axios.post(`${AI_BASE_URL}/predict/document`, form, {
        headers: form.getHeaders(),
        timeout: AI_TIMEOUT,
        maxBodyLength: Infinity,
    });
    return res.data;
};
