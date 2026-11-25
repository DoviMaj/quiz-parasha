// Usage: node tools/role.mjs <email> <admin|approver|reviewer|none>
// Writes (or deletes) roles/{lowercase email}. Used once to create the first admin; after that admins manage users in review.html.
import { db } from "./_admin.mjs";
const [emailRaw, role] = process.argv.slice(2);
if (!emailRaw || !["admin", "approver", "reviewer", "none"].includes(role)) {
  console.error("usage: role.mjs <email> <admin|approver|reviewer|none>"); process.exit(1);
}
const email = emailRaw.trim().toLowerCase();
const ref = db().doc("roles/" + email);
if (role === "none") { await ref.delete(); console.log("removed", email); }
else { await ref.set({ role, addedBy: "cli", at: Date.now() }); console.log(email, "->", role); }
