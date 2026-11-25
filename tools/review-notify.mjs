// Pushes "Draft of <parsha> to review" to the reviewers' phones; tapping opens review.html#<weekId>.
// Usage: node tools/review-notify.mjs <weekId>
// Env: FIREBASE_SA, VAPID_PUBLIC, VAPID_PRIVATE, SITE_URL (like notify.mjs). Needs: npm i firebase-admin web-push
// Only push docs whose `email` (stored by shim.js for Google-signed-in users) has a roles/{email} doc get it.
import { db } from "./_admin.mjs";
import * as wp from "web-push";
const webpush = wp.default ?? wp;

const id = process.argv[2];
if (!id) { console.error("usage: review-notify.mjs <weekId>"); process.exit(1); }
const d = db(), draft = await d.doc("drafts/" + id).get();
if (!draft.exists) { console.error("no such draft"); process.exit(1); }
const name = draft.data().name || {};
const MSG = {
  es: { title: "Revisión de contenido", body: `Borrador de ${name.es || id} para revisar` },
  en: { title: "Content review", body: `${name.en || id} draft ready to review` },
  he: { title: "סקירת תוכן", body: `טיוטת ${name.he || id} מוכנה לסקירה` },
};
const url = new URL("review#" + encodeURIComponent(id), process.env.SITE_URL).href;
webpush.setVapidDetails("mailto:noreply@example.com", process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

const roles = new Set((await d.collection("roles").get()).docs.map(r => r.id));
const snap = await d.collection("push").get();
let sent = 0, skipped = 0, gone = 0, failed = 0;
await Promise.all(snap.docs.map(async p => {
  const { sub, lang, email } = p.data();
  if (!email || !roles.has(String(email).toLowerCase())) { skipped++; return; }
  try {
    await webpush.sendNotification(sub, JSON.stringify({ ...(MSG[lang] || MSG.es), url }));
    sent++;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) { await p.ref.delete(); gone++; } else failed++;
  }
}));
console.log(JSON.stringify({ sent, skipped, gone, failed }));
