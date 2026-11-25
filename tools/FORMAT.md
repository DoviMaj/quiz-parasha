# Quiz de la Parashá: weekly content format and pipeline

Every week is one file, `weeks/<id>.json`. Everything else (the index entry and the PDFs) is
generated from it by `tools/build.py`. Never hand-edit `weeks/index.json` or the PDFs.

## Pipeline (same for a person or the Monday scheduled task)

1. **Write** `weeks/<id>.json` in the format below. `id` = `<parsha-in-latin-letters>-<Hebrew year>`, e.g. `vayishlach-5787`.
0. **Get the tool**: the app serves it as `tools/build.py.txt`; save it as `tools/build.py`.
2. **Check**: `python3 tools/build.py <app_dir> <id> --check-only` must print `"ok": true`.
3. **Verify** with three independent reviewers (agents), each writing findings to a JSON file:
   - Reviewer 1: facts and sources for aliyot 1–4 (adult and kids), checked on Sefaria.
   - Reviewer 2: facts and sources for aliyot 5–7, checked on Sefaria.
   - Reviewer 3: Spanish, English and Hebrew quality; consistency across languages; Hebrew verse text vs. Sefaria; giveaways in questions, verses, icons and drawings.
   Fix every "error" and "fix" finding, then re-run step 2.
4. **Build**: `python3 tools/build.py <app_dir> <id>`. It normalizes the drawings, rebuilds the index entry and renders the 12 PDFs (es/en/he × questions, answers, kids, kids answers). It prints the exact list of files to publish.
5. **Publish** exactly the files it prints (patch mode), plus any file you fixed. The publish tool needs the page file every time: send the freshly downloaded live `index.html` unchanged, unless you fixed a real bug in it (then your fix on top of the live copy, after testing the app).

## File format

```json
{
  "id": "vayishlach-5787", "order": 8, "shabbat": "2026-11-28",
  "heb": "פָּרָשַׁת וַיִּשְׁלַח",
  "name": {"es": "Vayishlaj", "en": "Vayishlach", "he": "וישלח"},
  "range": "בראשית לב:ד–לו:מג",
  "icons": {"<key>": "<inner SVG markup for a 48×48 viewBox>"},
  "Q": [ { "day": 1, "d": 1, "a": 2, "i": "<icon key>",
           "v": [ {"r": "בראשית לב:ו", "t": "<full verse with nikud>"} ],
           "t": { "es": {"q": "...", "o": ["...","...","...","..."], "e": "...", "s": "..."},
                  "en": {...}, "he": {...} } } ],
  "K": [ { "day": 1, "a": 0, "i": "<icon key, used as the sticker>",
           "img": "<inner SVG for a 320×160 viewBox>", "v": [optional],
           "t": { "es": {...}, "en": {...}, "he": {...} } } ]
}
```

- `day`: aliyah 1–7 (Diaspora full-kriyah aliyot). Each day opens on its weekday: Sunday = 1 … Shabbat = 7.
  The app shows each day's questions separately. A week has **30 adult questions per day — 10 easy, 10 medium, 10 hard (210)** and **10 kids' questions per day (70)**.
- `d`: level 1 easy, 2 medium, 3 hard (mix them within each day).
- `a`: index 0–3 of the correct option, the same in all three languages. Spread the positions evenly.
- `t.<lang>`: `q` question, `o` four options, `e` explanation (“Did you know…?” for kids), `s` source.
- Torah references always use the Hebrew book name and Hebrew numerals (בראשית לב:ו). In Spanish and English, wrap Hebrew in `<bdi dir="rtl">…</bdi>`. Hebrew text has no bdi tags.
- Quotation marks: Spanish/English “ ” and ‘ ’ (never « »); Hebrew ״ ״.
- Verses come from Sefaria (“Tanach with Nikkud”), with the Name written ה׳ and אֱלֹהִים (when it refers to G-d) written with ק.
- Icons and kids' drawings show the scene, **never the answer**. Put a friendly “?” where the answer would be.

## What `build.py` checks

Missing fields, 4 options in every language, icon keys exist, `a`/`d`/`day` ranges, 30 adult (10 per level) + 10 kids per day,
« » quotes, Latin book names, bdi in Hebrew, unsubstituted divine names in verses, the correct
answer appearing as text inside a kids' drawing, uneven answer positions, and duplicate SVG ids
(fixed automatically).

## Admin corrections

Corrections made in the app by the owner are stored as an override layer and are applied on top of
the week file. A later rebuild of the week file never erases them.
