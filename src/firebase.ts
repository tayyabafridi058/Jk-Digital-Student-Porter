import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import the AI Studio provided configuration
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// @ts-ignore - firestoreDatabaseId might not be in the type but is used in AI Studio
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export default app;
