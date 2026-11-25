// Sends the weekly "quiz is ready" push to every subscriber, in their language.
// Usage: node tools/notify.mjs "<parsha es>" "<parsha en>" "<parsha he>"
// Env: FIREBASE_SA (service-account JSON), VAPID_PUBLIC, VAPID_PRIVATE, SITE_URL
// Needs: npm i firebase-admin web-push
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as wp from "web-push";
const webpush = wp.default ?? wp;

const [es, en, he] = process.argv.slice(2);
if (!es) { console.error("usage: notify.mjs <es> <en> <he>"); process.exit(1); }
const url = process.env.SITE_URL;
const MSG = {
  es: { title: "Quiz de la Parashá", body: `¡Ya está el quiz de ${es}!` },
  en: { title: "Parashah Quiz", body: `The ${en} quiz is ready!` },
  he: { title: "חידון הפרשה", body: `החידון של פרשת ${he} מוכן!` },
};

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
webpush.setVapidDetails("mailto:noreply@example.com", process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

const snap = await getFirestore().collection("push").get();
let sent = 0, gone = 0, failed = 0;
await Promise.all(snap.docs.map(async d => {
  const { sub, lang } = d.data();
  try {
    await webpush.sendNotification(sub, JSON.stringify({ ...(MSG[lang] || MSG.es), url }));
    sent++;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) { await d.ref.delete(); gone++; } else failed++;
  }
}));
console.log(JSON.stringify({ sent, removed: gone, failed }));
