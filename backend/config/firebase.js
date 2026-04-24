const admin = require("firebase-admin");

let storage;

const initFirebase = () => {
    if (admin.apps.length === 0) {
        // Prefer environment variable JSON over file
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : require("./firebase-service-account.json");

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
    }
    storage = admin.storage().bucket();
    return storage;
};

const getStorage = () => {
    if (!storage) return initFirebase();
    return storage;
};

module.exports = { initFirebase, getStorage };
