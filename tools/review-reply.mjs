// Usage: node tools/review-reply.mjs <weekId> <itemKey> <text> [--before X --after Y]
// Adds a Claude message to a thread. With --after it also flags the thread as changed (reviewers see "confirm the change").
import { db } from "./_admin.mjs";
const a = process.argv.slice(2), flag = n => { const i = a.indexOf(n); return i < 0 ? undefined : a.splice(i, 2)[1]; };
const before = flag("--before"), after = flag("--after"), [id, key, text] = a;
if (!id || !key || !text) { console.error("usage: review-reply.mjs <weekId> <itemKey> <text> [--before X --after Y]"); process.exit(1); }
const t = db().doc(`drafts/${id}/threads/${key}`), at = Date.now();
const msg = { uid: "claude", name: "Claude", text, at, by: "claude" };
if (before !== undefined) msg.before = before;
if (after !== undefined) msg.after = after;
await t.collection("messages").add(msg);
await t.set({ last: { by: "claude", uid: "claude", at }, ...(after !== undefined ? { reply: { at, changed: true } } : {}) }, { merge: true });
console.log("replied", key);
