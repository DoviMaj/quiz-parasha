# Content review (review.html): weekly flow and tools

Every weekly quiz is reviewed by people before it reaches the app. The app page is `review.html`.
Only a user signed in with Google (verified email) who has a `roles/{email}` doc can open it. `firestore.rules` enforces this; the UI only mirrors it.

## Roles (Firestore `roles/{lowercase email}` = `{role, addedBy, at}`)

| role | can |
|---|---|
| `reviewer` | read drafts, mark each question "Bien" / "Pedir cambio", comment |
| `approver` | the same, plus approve the week (the only role that sees the Approve button active, together with admin) |
| `admin` | the same as approver, plus manage people in review.html > Equipo (invite by email, change a role, remove). An admin cannot demote or delete themselves. |

Claude (the weekly agent, Admin SDK) writes drafts and answers threads; it never approves. Comments are suggestions, not orders: verify a claim (for example "this citation is wrong") on Sefaria before changing anything.

First admin (run once, with the service account):

    FIREBASE_SA="$(cat .sa.json)" node tools/role.mjs you@gmail.com admin

After that, admins add people from the Equipo screen. `role.mjs <email> <admin|approver|reviewer|none>` still works for emergencies. Admin SDK tools need `npm i firebase-admin web-push` (ESM resolves packages from the repo's node_modules).

## Data

- `drafts/{weekId}`: meta `{id, name:{es,en,he}, shabbat, status:"review"|"approved"|"published", rev, counts:{adult,kids}, approvedBy, approvedName, approvedAt, marked:{uid: n}}`. `marked` is how many items each reviewer has marked (maintained by review.html; the quiz app uses it for the "pending" badge).
- `drafts/{weekId}/days/{1..7}`: `{day, Q:[...], K:[...]}`, same item format as `weeks/<id>.json` (split per day to stay under 1 MB).
- `drafts/{weekId}/threads/{itemKey}`: `{marks:{uid:"ok"|"change"}, names:{uid:name}, reply?:{at,changed}, last:{by,uid,at}}`; messages in `.../messages/{id}` = `{uid, name, text, at, by:"human"|"claude", kind?:"hint"|"fact"|"lang"|"typo"|"other", before?, after?}`.
  `itemKey` = `q<day>_<index in that day's Q array>` | `k<day>_<index in K>` | `_general` (the approver's "send back to Claude with a note").
  A change request ("Pedir cambio") is a `change` mark plus a message with `kind` and the required description of what to change.

### Sources: `src` on every item (the writing agent MUST record these)

For each question, store the exact Sefaria texts the writer read, so reviewers see where it came from:

```json
"src": [{
  "ref": "Ramban on Genesis 32:26",
  "url": "https://www.sefaria.org/Ramban_on_Genesis.32.26",
  "edition": "Sefaria · edición vocalizada",
  "readAt": "lunes 10:14",
  "text": {"he": "<full commentary, Hebrew>", "en": "<full commentary, English, if available>"},
  "used": "<the exact fragment of text.he that the question and correct answer come from>",
  "question": "what in the text the question is built on",
  "correct": "the highlighted phrase, translated",
  "distractors": "invented; no commentator says them"
}]
```

review.html shows each entry as a "De dónde salió" card: the used fragment highlighted, "Ver comentario completo" for the whole text, a link to Sefaria, and "Cómo lo usó Claude". Only `ref` is required; with `text` missing the full commentary is fetched live from Sefaria and cached. When an item has no `src` at all (older weeks), review.html derives best-effort refs from the `s` source text and the `v[].r` verse (`review-refs.mjs`, tested by `node tools/refs.test.mjs`) and marks them "estimated". Do not rely on that: record `src`.

`draft-upload.mjs` copies items as they are, so `src` is kept.

## Weekly flow (the routine)

1. **Monday: upload and notify.** Write `weeks/<id>.json` (see FORMAT.md, with `src` on every item), then:

       node tools/draft-upload.mjs weeks/<id>.json         # status "review"; refuses to overwrite an approved draft without --force
       node tools/review-notify.mjs <id>                    # push "Borrador de <parsha> para revisar" -> opens review.html#<id>

   `review-notify` needs `FIREBASE_SA`, `VAPID_PUBLIC`, `VAPID_PRIVATE`, `SITE_URL`; it only reaches phones whose push subscription was stored by a Google-signed-in reviewer (their email has a role). Reviewers also see a banner on the quiz screen, a dot on their avatar and a row in Ajustes > Cuenta while a draft is in review.
2. **Monday to Wednesday:** reviewers mark and comment. Nothing is published.
3. **Wednesday: read, verify, answer.**

       node tools/review-export.mjs <id> > threads.json     # every thread with marks and messages

   For each thread with a `change` mark or an unanswered human message (`last.by == "human"`): verify the claim on Sefaria, apply what is right to `weeks/<id>.json`, and answer in the thread:

       node tools/review-reply.mjs <id> q3_8 "Acorté C y ajusté A y D." --before "<old text>" --after "<new text>"

   `--after` flags the thread as changed: the reviewer sees "Cambio aplicado · confirmar" with antes → después and confirms or keeps talking. Without `--after` it is a plain reply (for example "no cambio porque ..."). Re-upload the fixed week with `draft-upload.mjs <file> ` (threads are kept, `rev` goes up). Item indexes are positions in each day's array, so do not reorder items within a day after reviews start.
4. **Thursday: publish only if approved.**

       node tools/draft-status.mjs <id>      # prints {"status","approved",...}; exit code 0 only when approved (or already published)

   If approved: publish to the app as usual (FORMAT.md pipeline), then `node tools/draft-status.mjs <id> --published`.
   **If not approved by Thursday (18:00): publish nothing and notify the owner** (for example "Vayishlaj no fue aprobada: N pendientes, M cambios sin confirmar"). Never approve on anyone's behalf.

## Tests

- `node tools/refs.test.mjs`: the Sefaria-ref mapper.
- `tools/rules.test.mjs`: Firestore rules suite (needs Java for the emulator): copy it where `@firebase/rules-unit-testing@3` and `firebase@10` are installed and run `npx firebase-tools emulators:exec --only firestore "node rules.test.mjs firestore.rules"` with the firestore emulator on port 8089.
- Local UI test: serve the repo and open `http://localhost:PORT/review.html?mock=1` (`&as=out|anon|norole|reviewer|approver|admin`, `&ready=1`, `&lang=he`). `?mock=1` is ignored on any host other than `localhost`. The quiz app's entry points: `index.html?mockreview=1` (also localhost only).
