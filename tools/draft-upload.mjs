// Usage: node tools/draft-upload.mjs weeks/<id>.json [--force]
// Uploads a week as a review draft: drafts/{id} (meta, status "review") + drafts/{id}/days/{1..7} ({day, Q, K}).
// Refuses to overwrite a draft that is already approved/published unless --force. Existing threads are kept.
import fs from "node:fs";
import { db } from "./_admin.mjs";
const file = process.argv[2], force = process.argv.includes("--force");
if (!file) { console.error("usage: draft-upload.mjs weeks/<id>.json [--force]"); process.exit(1); }
const w = JSON.parse(fs.readFileSync(file, "utf8"));
const d = db(), ref = d.doc("drafts/" + w.id), old = await ref.get();
if (old.exists && old.data().status !== "review" && !force) { console.error("draft is", old.data().status, "- use --force"); process.exit(1); }
const days = [];
for (let n = 1; n <= 7; n++) days.push({ day: n, Q: w.Q.filter(x => x.day === n), K: w.K.filter(x => x.day === n) });
for (const x of days) if (JSON.stringify(x).length > 900000) { console.error("day", x.day, "too big for one doc"); process.exit(1); }
const rev = (old.exists ? old.data().rev || 1 : 0) + 1;
const batch = d.batch();
batch.set(ref, {
  id: w.id, name: w.name, shabbat: w.shabbat, status: "review", approvedBy: null, approvedName: null, approvedAt: null,
  rev, uploadedAt: Date.now(), counts: { adult: w.Q.length, kids: w.K.length },
});
for (const x of days) batch.set(ref.collection("days").doc(String(x.day)), x);
await batch.commit();
console.log("uploaded", w.id, "rev", rev, w.Q.length + "Q", w.K.length + "K");
