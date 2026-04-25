const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, set, get, onValue } = require('firebase/database');
const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = require('firebase/storage');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://your-project-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abc123"
};

const isFirebaseConfigured = () => {
  const requiredValues = [
    process.env.FIREBASE_API_KEY,
    process.env.FIREBASE_AUTH_DOMAIN,
    process.env.FIREBASE_DATABASE_URL,
    process.env.FIREBASE_PROJECT_ID,
    process.env.FIREBASE_STORAGE_BUCKET,
    process.env.FIREBASE_APP_ID
  ];

  return requiredValues.every((value) => {
    return value && !String(value).includes('your-') && !String(value).includes('abc123');
  });
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

module.exports = {
  app,
  database,
  ref,
  push,
  set,
  get,
  onValue,
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL,
  isFirebaseConfigured
};
