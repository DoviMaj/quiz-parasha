// Usage: node tools/review-export.mjs <weekId>   -> JSON {id, status, threads:[{key, marks, names, reply, last, messages:[...]}]}
// itemKey = q<day>_<index in that day's Q array> | k<day>_<index in K> | _general (approver notes). Indexes match drafts/{id}/days/{day}.
import { db } from "./_admin.mjs";
const id = process.argv[2];
if (!id) { console.error("usage: review-export.mjs <weekId>"); process.exit(1); }
const d = db(), meta = await d.doc("drafts/" + id).get();
if (!meta.exists) { console.error("no such draft"); process.exit(1); }
const threads = [];
for (const t of (await d.collection(`drafts/${id}/threads`).get()).docs) {
  const msgs = (await t.ref.collection("messages").orderBy("at").get()).docs.map(m => m.data());
  threads.push({ key: t.id, ...t.data(), messages: msgs });
}
console.log(JSON.stringify({ id, status: meta.data().status, threads }, null, 2));
