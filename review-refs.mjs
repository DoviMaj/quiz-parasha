// Best-effort Sefaria refs from an item's source text (`s`) and its verse refs (`v[].r`).
// Pure functions, no DOM. Tested by tools/refs.test.mjs. Used by review.html when an item has no explicit `src`.
const BOOKS = { "בראשית": "Genesis", "שמות": "Exodus", "ויקרא": "Leviticus", "במדבר": "Numbers", "דברים": "Deuteronomy" };
const GEM = { א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50, ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90, ק: 100, ר: 200, ש: 300, ת: 400 };
export const heNum = s => { let n = 0; for (const c of String(s)) n += GEM[c] || 0; return n || null; };
const HN = "[א-ת\"״׳']{1,5}";
const VERSE = new RegExp(`(${Object.keys(BOOKS).join("|")})\\s+(${HN})\\s*[:׃]\\s*(${HN})(?:\\s*[-–־]\\s*(${HN}))?`);

const clean = s => String(s ?? "").replace(/<[^>]*>/g, "").replace(/[‎‏‪-‮⁦-⁩]/g, "").replace(/[֑-ׇ]/g, "");

/** "בראשית לב:ד" -> "Genesis 32:4" (also ranges: "בראשית לב:ד-ה" -> "Genesis 32:4-5"); null when not a Torah ref */
export function verseRef(text) {
  const m = VERSE.exec(clean(text)); if (!m) return null;
  const c = heNum(m[2]), v = heNum(m[3]), e = m[4] ? heNum(m[4]) : null;
  return c && v ? `${BOOKS[m[1]]} ${c}:${v}${e ? "-" + e : ""}` : null;
}

// [regex on the plain segment, how to build the Sefaria ref from "Genesis 32:4"]
const COMM = [
  [/rash[ií](?![a-z])|רש["״']י/i, v => "Rashi on " + v],
  [/ramb[aá]n|רמב["״']ן/i, v => "Ramban on " + v],
  [/or ha-?(?:j|ch|h)a[ií]m|אור החיים/i, v => "Or HaChaim on " + v],
  [/kli yaka?r|כלי יקר/i, v => "Kli Yakar on " + v],
  [/sforno|ספורנו/i, v => "Sforno on " + v],
  [/ibn ezra|אבן עזרא/i, v => "Ibn Ezra on " + v],
  [/rashbam|רשב["״']ם/i, v => "Rashbam on " + v],
  [/ba'?al ha-?turim|בעל הטורים/i, v => "Baal HaTurim on " + v],
  [/[chj]izkuni|חזקוני/i, v => "Chizkuni, " + v],
  [/onk[ae]los|אונקלוס/i, v => "Onkelos " + v],
];
const TRACT = { "ברכות": "Berakhot", "שבת": "Shabbat", "עירובין": "Eruvin", "פסחים": "Pesachim", "יומא": "Yoma", "סוכה": "Sukkah", "ביצה": "Beitzah", "ראש השנה": "Rosh Hashanah", "תענית": "Taanit", "מגילה": "Megillah", "מועד קטן": "Moed Katan", "חגיגה": "Chagigah", "יבמות": "Yevamot", "כתובות": "Ketubot", "נדרים": "Nedarim", "נזיר": "Nazir", "סוטה": "Sotah", "גיטין": "Gittin", "קידושין": "Kiddushin", "בבא קמא": "Bava Kamma", "בבא מציעא": "Bava Metzia", "בבא בתרא": "Bava Batra", "סנהדרין": "Sanhedrin", "מכות": "Makkot", "שבועות": "Shevuot", "עבודה זרה": "Avodah Zarah", "הוריות": "Horayot", "זבחים": "Zevachim", "מנחות": "Menachot", "חולין": "Chullin", "בכורות": "Bekhorot", "ערכין": "Arakhin", "תמורה": "Temurah", "כריתות": "Keritot", "מעילה": "Meilah", "נדה": "Niddah" };
const TRACT_RE = new RegExp(`(${Object.keys(TRACT).join("|")})\\s+(?:דף\\s+)?(${HN})\\s*,?\\s*ע["״׳']?([אב])`, "g");
const TRACT_LAT = new RegExp(`\\b(${Object.values(TRACT).join("|")})\\s+(\\d{1,3})([ab])\\b`, "g");
const RABBAH = /(?:bereshit|b[’']reishit) rab+[aá]h?\s+(\d+|[א-ת"״׳']{1,5})\s*[:,.]\s*(\d+|[א-ת"״׳']{1,5})|בראשית רבה\s+([א-ת"״׳']{1,5})\s*[:,.]\s*([א-ת"״׳']{1,5})/i;
const num = x => /^\d+$/.test(x) ? +x : heNum(x);

/** s: the item's source text (any language, may contain <bdi>); verses: item.v ([{r,t}]). Returns [{ref, est:true}] */
export function deriveRefs(s, verses = []) {
  const text = clean(s), out = [], add = ref => { if (ref && !out.some(o => o.ref === ref)) out.push({ ref, est: true }); };
  const fallback = (verses || []).map(v => verseRef(v.r)).find(Boolean) || verseRef(text);
  for (const seg of text.split(/[;；]/)) {
    const vr = verseRef(seg) || fallback;
    if (vr) for (const [re, build] of COMM) if (re.test(seg)) add(build(vr));
    const rb = RABBAH.exec(seg);
    if (rb) { const c = num(rb[1] || rb[3]), v = num(rb[2] || rb[4]); if (c && v) add(`Bereshit Rabbah ${c}:${v}`); }
    for (const m of seg.matchAll(TRACT_RE)) { const n = heNum(m[2]); if (n) add(`${TRACT[m[1]]} ${n}${m[3] === "א" ? "a" : "b"}`); }
    for (const m of seg.matchAll(TRACT_LAT)) add(`${m[1]} ${m[2]}${m[3]}`);
  }
  return out;
}

/** The verse refs of an item ("Genesis 32:4"), deduped */
export const verseRefs = verses => [...new Set((verses || []).map(v => verseRef(v.r)).filter(Boolean))];
export const sefUrl = ref => "https://www.sefaria.org/" + encodeURI(ref.replace(/ /g, "_"));
export const apiUrl = ref => "https://www.sefaria.org/api/v3/texts/" + encodeURI(ref.replace(/ /g, "_")) + "?version=hebrew&version=english&return_format=text_only";
/** nested arrays of segments -> one plain string */
export const flat = x => Array.isArray(x) ? x.map(flat).filter(Boolean).join("\n\n") : String(x ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
/** Sefaria v3 response -> {he, en} */
export function parseText(j) {
  const o = { he: "", en: "" };
  for (const v of (j && j.versions) || []) { const l = v.language === "he" ? "he" : v.language === "en" ? "en" : null; if (l && !o[l]) o[l] = flat(v.text); }
  return o;
}

// ---- display labels: app convention = commentator name per language + Hebrew book name with Hebrew-letter numbers ----
const HE_BOOK = Object.fromEntries(Object.entries(BOOKS).map(([h, e]) => [e, h]));
const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"], TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"], HUND = ["", "ק", "ר", "ש", "ת"];
/** 32 -> "לב", 15 -> "טו", 16 -> "טז" */
export const toHeNum = n => { n = +n; if (!(n > 0 && n < 500)) return String(n); const h = HUND[Math.floor(n / 100)], r = n % 100;
  if (r === 15) return h + "טו"; if (r === 16) return h + "טז"; return h + TENS[Math.floor(r / 10)] + ONES[r % 10]; };
const NAMES = {
  "Rashi": { es: "Rashí", en: "Rashi", he: "רש״י" }, "Ramban": { es: "Ramban", en: "Ramban", he: "רמב״ן" },
  "Or HaChaim": { es: "Or HaJaim", en: "Or HaChaim", he: "אור החיים" }, "Kli Yakar": { es: "Kli Yakar", en: "Kli Yakar", he: "כלי יקר" },
  "Sforno": { es: "Sforno", en: "Sforno", he: "ספורנו" }, "Ibn Ezra": { es: "Ibn Ezra", en: "Ibn Ezra", he: "אבן עזרא" },
  "Rashbam": { es: "Rashbam", en: "Rashbam", he: "רשב״ם" }, "Baal HaTurim": { es: "Baal HaTurim", en: "Baal HaTurim", he: "בעל הטורים" },
  "Chizkuni": { es: "Jizkuni", en: "Chizkuni", he: "חזקוני" }, "Onkelos": { es: "Onkelos", en: "Onkelos", he: "אונקלוס" },
};
const TRACT_HE = Object.fromEntries(Object.entries(TRACT).map(([h, e]) => [e, h]));
const heVerse = (book, c, v, e) => `${HE_BOOK[book]} ${toHeNum(c)}:${toHeNum(v)}${e ? "–" + toHeNum(e) : ""}`;
/** "Ramban on Genesis 32:4" -> {name:"Ramban", heb:"בראשית לב:ד"}; also "Genesis 32:4", "Chizkuni, Genesis 32:4", "Onkelos Genesis 32:4",
 *  "Bereshit Rabbah 75:4" -> {name:"Bereshit Rabá"/…, heb:"עה:ד"}, "Berakhot 7b" -> {heb:"ברכות ז ע״ב"}. Unknown refs come back as-is. */
export function refParts(ref, lang = "es") {
  const r = String(ref || "").trim();
  let m = r.match(/^(?:(.+?)(?: on |, | ))?(Genesis|Exodus|Leviticus|Numbers|Deuteronomy) (\d+):(\d+)(?:-(\d+))?(?::\d+)*$/);
  if (m) { const c = m[1] && NAMES[m[1]]; return { name: c ? c[lang] || c.en : m[1] || "", heb: heVerse(m[2], m[3], m[4], m[5]) }; }
  m = r.match(/^Bereshit Rabbah (\d+):(\d+)/);
  if (m) return { name: "", heb: `בראשית רבה ${toHeNum(m[1])}:${toHeNum(m[2])}` };
  m = r.match(/^([A-Z][A-Za-z ]+?) (\d+)([ab])$/);
  if (m && TRACT_HE[m[1]]) return { name: "", heb: `${TRACT_HE[m[1]]} ${toHeNum(m[2])} ע״${m[3] === "a" ? "א" : "ב"}` };
  return { name: "", heb: "", raw: r };
}
/** Plain-text label: "Ramban · בראשית לב:ד" (he: "רמב״ן · בראשית לב:ד") */
export const refLabel = (ref, lang) => { const p = refParts(ref, lang); return p.raw != null ? p.raw : [p.name, p.heb].filter(Boolean).join(" · "); };
