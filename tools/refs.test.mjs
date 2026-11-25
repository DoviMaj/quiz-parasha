// node tools/refs.test.mjs   (pure-function checks for review-refs.mjs)
import assert from "node:assert/strict";
import fs from "node:fs";
import { heNum, verseRef, deriveRefs, verseRefs, sefUrl, parseText } from "../review-refs.mjs";
assert.equal(heNum("לב"), 32); assert.equal(heNum("טו"), 15); assert.equal(heNum("ט״ז"), 16); assert.equal(heNum("קמ"), 140);
assert.equal(verseRef("בראשית לב:ה"), "Genesis 32:5");
assert.equal(verseRef("שמות ל״ד:ו"), "Exodus 34:6");
assert.equal(verseRef("במדבר ב:ג-ה"), "Numbers 2:3-5");
assert.equal(verseRef("hello"), null);
const refs = (s, v) => deriveRefs(s, v).map(x => x.ref);
assert.deepEqual(refs("Rashí sobre <bdi dir=\"rtl\">בראשית לב:ד</bdi>; Bereshit Rabá"), ["Rashi on Genesis 32:4"]);
assert.deepEqual(refs("Ramban on <bdi dir=\"rtl\">בראשית לב:כו</bdi>"), ["Ramban on Genesis 32:26"]);
assert.deepEqual(refs("רש״י על בראשית לג:ב"), ["Rashi on Genesis 33:2"]);
assert.deepEqual(refs("Or HaJaim sobre X", [{ r: "בראשית לה:א" }]), ["Or HaChaim on Genesis 35:1"]); // falls back to the item's verse
assert.deepEqual(refs("Kli Yakar y Sforno sobre בראשית לב:ח"), ["Kli Yakar on Genesis 32:8", "Sforno on Genesis 32:8"]);
assert.deepEqual(refs("Chizkuni; Onkelos", [{ r: "בראשית לב:ג" }]), ["Chizkuni, Genesis 32:3", "Onkelos Genesis 32:3"]);
assert.deepEqual(refs("Bereshit Rabbah 75:3"), ["Bereshit Rabbah 75:3"]);
assert.deepEqual(refs("בראשית רבה עה:ג"), ["Bereshit Rabbah 75:3"]);
assert.deepEqual(refs("ברכות ז ע״ב"), ["Berakhot 7b"]);
assert.deepEqual(refs("Talmud, Shabbat 55a"), ["Shabbat 55a"]);
assert.deepEqual(refs("Pirkei Avot"), []);
assert.deepEqual(verseRefs([{ r: "בראשית לב:ד" }, { r: "בראשית לב:ד" }]), ["Genesis 32:4"]);
assert.equal(sefUrl("Rashi on Genesis 32:5"), "https://www.sefaria.org/Rashi_on_Genesis_32:5");
assert.deepEqual(parseText({ versions: [{ language: "he", text: ["א<b>ב</b>", ["ג"]] }, { language: "en", text: "Hi" }] }), { he: "אב\n\nג", en: "Hi" });
// real data: every item resolves without throwing; report coverage
const w = JSON.parse(fs.readFileSync(new URL("../weeks/vayishlach-5787.json", import.meta.url), "utf8"));
let n = 0, hit = 0; for (const it of [...w.Q, ...w.K]) { n++; if (deriveRefs(it.t.es.s, it.v).length) hit++; }
console.log(`ok. derived refs for ${hit}/${n} items of ${w.id}`);
