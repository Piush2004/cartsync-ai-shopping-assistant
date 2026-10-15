import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "mock-api-key-for-local-development",
  authDomain: "cartsyncai-mock.firebaseapp.com",
  projectId: "cartsyncai-mock",
  storageBucket: "cartsyncai-mock.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:mock123456"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators if running locally
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log("Connecting to Firebase Emulators...");
  
  // Prevent duplicate connections if module hot-reloads
  const globalEmulatorFlag = (window as any).__EMULATORS_CONNECTED__;
  if (!globalEmulatorFlag) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    (window as any).__EMULATORS_CONNECTED__ = true;
  }
}

export { app, auth, db, storage, functions };
