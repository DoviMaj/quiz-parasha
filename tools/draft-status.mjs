// Usage: node tools/draft-status.mjs <weekId> [--published]
// Prints {"id","status","approved":bool,"approvedBy","approvedName","approvedAt"}; exit code 0 only when approved.
// --published: after you have published to the app, marks the draft status "published" (only allowed from "approved").
import { db } from "./_admin.mjs";
const id = process.argv[2];
if (!id) { console.error("usage: draft-status.mjs <weekId> [--published]"); process.exit(1); }
const ref = db().doc("drafts/" + id), s = await ref.get();
if (!s.exists) { console.error("no such draft"); process.exit(2); }
let x = s.data();
if (process.argv.includes("--published")) {
  if (x.status !== "approved") { console.error("not approved, refusing"); process.exit(3); }
  await ref.update({ status: "published" }); x = { ...x, status: "published" };
}
const ok = x.status === "approved";
console.log(JSON.stringify({ id, status: x.status, approved: ok, approvedBy: x.approvedBy, approvedName: x.approvedName, approvedAt: x.approvedAt }));
process.exit(ok || x.status === "published" ? 0 : 3);
