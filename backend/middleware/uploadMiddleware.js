const multer = require("multer");

const storage = multer.memoryStorage();

const imageUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files allowed"), false);
        }
        cb(null, true);
    },
});

const videoUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("video/")) {
            return cb(new Error("Only video files allowed"), false);
        }
        cb(null, true);
    },
});

const documentUpload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only PDF, DOCX, and TXT files allowed"), false);
        }
        cb(null, true);
    },
});

module.exports = { imageUpload, videoUpload, documentUpload };
