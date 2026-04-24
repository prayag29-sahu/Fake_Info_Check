const { getStorage } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const { logger } = require("../utils/logger");

/**
 * Upload a Multer file to Firebase Storage.
 * Returns { path, url }
 */
exports.uploadFile = async (file, userId, scanId, folder = "uploads") => {
    const bucket = getStorage();
    const ext = (file.originalname || "file").split(".").pop();
    const filename = `${folder}/${userId}/${scanId}/${uuidv4()}.${ext}`;

    const blob = bucket.file(filename);

    await new Promise((resolve, reject) => {
        const stream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                metadata: { userId, scanId },
            },
            resumable: false,
        });
        stream.on("error", reject);
        stream.on("finish", resolve);
        stream.end(file.buffer);
    });

    await blob.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    logger.info(`Uploaded file to Firebase: ${url}`);

    return { path: filename, url };
};
