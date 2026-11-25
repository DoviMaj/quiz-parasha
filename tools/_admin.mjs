// Shared Admin SDK init. Env FIREBASE_SA = service-account JSON (like notify.mjs).
// For local tests against the Firestore emulator, set FIRESTORE_EMULATOR_HOST instead.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
export function db() {
  if (process.env.FIREBASE_SA) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
  else if (process.env.FIRESTORE_EMULATOR_HOST) initializeApp({ projectId: "quiz-parasha-32110" });
  else { console.error("set FIREBASE_SA (service-account JSON)"); process.exit(1); }
  return getFirestore();
}
