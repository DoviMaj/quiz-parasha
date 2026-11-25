/* Journey through the Torah — one game, one map, a new mission each week.
   Missions are data files in missions/<parsha>.json (types: explore, herd, build, run). */
(() => {
const $ = id => document.getElementById(id);
const QS = new URLSearchParams(location.search), HS = new URLSearchParams(location.hash.slice(1));
let ADMIN = false; try { ADMIN = localStorage.getItem("parasha-admin") === "1" } catch (e) {}
const ALL = QS.has("all") || HS.has("all") || ADMIN;                       // preview: open every mission
const APPLS = (QS.has("demo") || HS.has("demo")) ? "parasha-demo-v1" : "parasha-app-v1";
let pid = "p0"; try { const p = JSON.parse(localStorage.getItem(APPLS + ":profiles") || "null"); if (p && p.active) pid = p.active } catch (e) {}
const GK = "parasha-game-v1:" + APPLS + ":" + pid;                 // progress per quiz profile
let prog = { done: {}, scrolls: 0 }; try { Object.assign(prog, JSON.parse(localStorage.getItem(GK) || "{}")) } catch (e) {}
const saveProg = () => { try { localStorage.setItem(GK, JSON.stringify(prog)) } catch (e) {} };
let lang = "en"; try { const a = JSON.parse(localStorage.getItem(APPLS) || "{}"); if (a.lang) lang = a.lang } catch (e) {}
const nm = n => (n.name && (n.name[lang] || n.name.en)) || n.id;
const tx = v => v == null ? "" : typeof v === "object" && !Array.isArray(v) ? (v[lang] != null ? v[lang] : v.en) : v;
const UI = {
 en: { title: "Journey through the Torah", sub: (d, s) => `${d} mission${d === 1 ? "" : "s"} done · 📜 ${s} scrolls`, opens: "Opens", soon: "Mission coming soon", play: "Play this mission", again: "Done ✓ — play again", start: "Start", complete: "Mission complete!", back: "Back to the map", map: "← Map", cont: "Continue",
  fmt: { explore: "Explore", herd: "Herd", build: "Build", run: "Run", story: "Story", tap: "Timing", catch: "Catch", rhythm: "Rhythm", steer: "Steer", sort: "Sort", hidden: "Find", pour: "Pour", stack: "Stack", path: "Path", memory: "Memory", sneak: "Sneak", maze: "Maze", sticker: "Stickers" }, books: { Bereshit: "Bereshit", Shemot: "Shemot", Vayikra: "Vayikra", Bamidbar: "Bamidbar", Devarim: "Devarim" },
  hBuild: "Pick an item below, then tap where it belongs. Drag to look around.", hRun: "Swipe ← → to change lanes, swipe ↑ to jump (or arrow keys).", hWalk: "Drag anywhere (or use the arrow keys) to walk.",
  pick: "Pick an item below, then tap where it belongs.", where: n => `Where does <b>${n}</b> go? Tap a spot.`, notThere: "Not there. ", guide: (n, w) => `Guide all <b>${n}</b> animals ${w}. They move away from you.`, where3: { ark: "into the ark", well: "to the well", fence: "into the pen" },
  ouch: "Ouch — try again!", reached: (z, g) => `You reached ${z} of ${g}. Run again!`, again2: "Run again", mission: "Mission" },
 es: { title: "Viaje por la Torá", sub: (d, s) => `${d} ${d === 1 ? "misión completada" : "misiones completadas"} · 📜 ${s} rollos`, opens: "Se abre el", soon: "Misión próximamente", play: "Jugar esta misión", again: "Lista ✓ — jugar otra vez", start: "Empezar", complete: "¡Misión cumplida!", back: "Volver al mapa", map: "← Mapa", cont: "Seguir",
  fmt: { explore: "Explorar", herd: "Pastorear", build: "Construir", run: "Correr", story: "Historia", tap: "Precisión", catch: "Atrapar", rhythm: "Ritmo", steer: "Timón", sort: "Clasificar", hidden: "Buscar", pour: "Verter", stack: "Apilar", path: "Camino", memory: "Memoria", sneak: "Sigilo", maze: "Laberinto", sticker: "Figuras" }, books: { Bereshit: "Bereshit", Shemot: "Shemot", Vayikra: "Vayikrá", Bamidbar: "Bamidbar", Devarim: "Devarim" },
  hBuild: "Elige un elemento abajo y toca dónde va. Arrastra para mirar alrededor.", hRun: "Desliza ← → para cambiar de carril y ↑ para saltar (o usa las flechas).", hWalk: "Arrastra en cualquier parte (o usa las flechas) para caminar.",
  pick: "Elige un elemento abajo y toca dónde va.", where: n => `¿Dónde va <b>${n}</b>? Toca un lugar.`, notThere: "Ahí no. ", guide: (n, w) => `Lleva a los <b>${n}</b> animales ${w}. Se alejan de ti.`, where3: { ark: "al arca", well: "al pozo", fence: "al corral" },
  ouch: "¡Uy! Inténtalo de nuevo", reached: (z, g) => `Llegaste a ${z} de ${g}. ¡Corre otra vez!`, again2: "Correr otra vez", mission: "Misión" },
 he: { title: "מסע בתורה", sub: (d, s) => `${d} משימות הושלמו · 📜 ${s} מגילות`, opens: "נפתח ב־", soon: "המשימה תגיע בקרוב", play: "לשחק במשימה", again: "הושלם ✓ — לשחק שוב", start: "מתחילים", complete: "המשימה הושלמה!", back: "חזרה למפה", map: "→ מפה", cont: "ממשיכים",
  fmt: { explore: "חקירה", herd: "רעייה", build: "בנייה", run: "ריצה", story: "סיפור", tap: "תזמון", catch: "תפיסה", rhythm: "קצב", steer: "היגוי", sort: "מיון", hidden: "חיפוש", pour: "מזיגה", stack: "ערימה", path: "שביל", memory: "זיכרון", sneak: "התגנבות", maze: "מבוך", sticker: "מדבקות" }, books: { Bereshit: "בראשית", Shemot: "שמות", Vayikra: "ויקרא", Bamidbar: "במדבר", Devarim: "דברים" },
  hBuild: "בחרו פריט למטה והקישו היכן הוא שייך. גררו כדי להסתכל מסביב.", hRun: "החליקו ← → להחלפת מסלול, ↑ לקפיצה (או בחצים).", hWalk: "גררו בכל מקום (או השתמשו בחצים) כדי ללכת.",
  pick: "בחרו פריט למטה והקישו היכן הוא שייך.", where: n => `איפה שייך <b>${n}</b>? הקישו על מקום.`, notThere: "לא שם. ", guide: (n, w) => `הובילו את כל <b>${n}</b> החיות ${w}. הן מתרחקות מכם.`, where3: { ark: "אל התיבה", well: "אל הבאר", fence: "אל הדיר" },
  ouch: "אופס — נסו שוב!", reached: (z, g) => `הגעתם ל־${z} מתוך ${g}. רוצו שוב!`, again2: "לרוץ שוב", mission: "משימה" } };
const u = () => UI[lang] || UI.en;
const FMT = new Proxy({}, { get: (_, k) => u().fmt[k] });
document.documentElement.lang = lang; document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
$("back").innerHTML = `<span aria-hidden="true">${lang === "he" ? "→" : "←"}</span><span class="bl"> ${u().map.replace(/^[←→]\s*/, "")}</span>`; $("back").setAttribute("aria-label", u().map.replace(/^[←→]\s*/, ""));
const today = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") })();
const sunday = s => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10) };
const fmtDate = s => new Date(s + "T12:00:00").toLocaleDateString(lang === "he" ? "he-IL" : lang === "es" ? "es-MX" : "en-US", { day: "numeric", month: "short" });
const MSG = {
 en: { t: "Missions", sub: "Journey through the Torah · 3D missions", s1: "missions", s2: "scrolls", s3: "stars", week: "This week", mis: "mission", quiz: "Go to quiz", play: "Play", fresh: "New mission", need: n => `${n} more question${n === 1 ? "" : "s"} needed` },
 es: { t: "Misiones", sub: "Viaje por la Torá · misiones en 3D", s1: "misiones", s2: "rollos", s3: "estrellas", week: "Esta semana", mis: "misión", quiz: "Ir al quiz", play: "Jugar", fresh: "Misión nueva", need: n => `Faltan ${n} pregunta${n === 1 ? "" : "s"}` },
 he: { t: "משימות", sub: "מסע בתורה · משימות תלת־ממד", s1: "משימות", s2: "מגילות", s3: "כוכבים", week: "השבוע", mis: "משימה", quiz: "לחידון", play: "לשחק", fresh: "משימה חדשה", need: n => `חסרות ${n} שאלות` } };
const setMute = () => { const m = FX.muted(); $("mute").innerHTML = `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4h4l5 4V6L8 10H4z"/>${m ? '<path d="M17 9l5 6M22 9l-5 6"/>' : '<path d="M16.5 8.5a5 5 0 0 1 0 7"/>'}</svg>`; $("mute").setAttribute("aria-label", m ? "Sound off" : "Sound on") };
const card = QuizCard($("card"));
let INDEX = null;

/* ---------------- map ---------------- */
/* the quiz unlocks the game: 10 answered questions of a parashah open its mission; each further 10 open another storyline */
const QNEED = 10; let QW = null;
async function quizWeeks() { if (QW) return QW; try { QW = (await (await fetch("../weeks/index.json")).json()).weeks || [] } catch (e) { QW = [] } return QW }
function quizCount(node) { if (ALL || !QW || !node) return null; const w = QW.find(x => x.shabbat === node.shabbat); if (!w) return null;
  let st = {}; try { st = JSON.parse(localStorage.getItem(APPLS) || "{}") } catch (e) {} const r = (st.weeks || {})[w.id] || {}; return Math.max(Object.keys(r.answers || {}).length, Object.keys(r.kans || {}).length) }
const toQuiz = () => { if (window.parent !== window) window.parent.postMessage({ type: "closeGame" }, "*"); else history.back() };
async function showMap() {
  $("play").classList.remove("on"); $("map").style.display = "block"; mode = null; $("card").classList.remove("on");
  if (!INDEX) { try { INDEX = await (await fetch("missions/index.json", { cache: "no-cache" })).json() } catch (e) { INDEX = { nodes: [] } } } await quizWeeks();
  const nodes = INDEX.nodes; let cur = nodes.findIndex(n => n.shabbat >= today); if (cur < 0) cur = nodes.length - 1;
  const done = Object.keys(prog.done).length, M = MSG[lang] || MSG.en;
  $("mTitle").firstChild.textContent = M.t; $("mSub").textContent = (ADMIN ? "Admin · " : "") + M.sub; setMute();
  const ico = { check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>' }, svg = k => `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ico[k]}</svg>`;
  let h = `<div class="stt">${[[done + " / " + nodes.length, M.s1], [prog.scrolls || 0, M.s2], [prog.pts || 0, M.s3]].map(t => `<div><b>${t[0]}</b><span>${t[1]}</span></div>`).join("")}</div><!--WK-->`, book = "", rows = "";
  const flush = () => { if (rows) h += `<div class="line">${rows}</div>`; rows = "" };
  nodes.forEach((n, i) => {
    if (n.book !== book) { flush(); book = n.book; h += `<h2 class="book">${u().books[book] || book}</h2>` }
    const open = ALL || n.preview || today >= sunday(n.shabbat), has = !!n.type, d = prog.done[n.id];
    const qc = quizCount(n), needQ = open && has && d == null && qc != null && qc < QNEED;
    const st = d != null ? "done" : !open ? "lock" : needQ ? "quiz" : has ? "open" : "soon";
    const sub = st === "lock" ? u().opens + " " + fmtDate(sunday(n.shabbat)) : st === "quiz" ? M.need(QNEED - qc) : st === "soon" ? u().soon : st === "done" ? u().again : M.fresh;
    n._st = st; n._sub = sub;
    const cls = st + (i === cur ? " now" : "");
    rows += `<div class="rw ${cls}"><span class="dot">${st === "done" ? svg("check") : i + 1}</span><button class="node ${cls}" data-id="${n.id}" ${st === "lock" || st === "soon" ? 'aria-disabled="true"' : ""}><span class="tx"><b>${nm(n)}</b><span>${sub}</span>${has && n.type !== "story" ? `<span class="fmt">${FMT[n.type]}</span>` : ""}${prog.best && prog.best[n.id] ? `<span class="bst3">${"★".repeat(prog.best[n.id].stars)}<i>${"★".repeat(3 - prog.best[n.id].stars)}</i> · ${prog.best[n.id].pts}</span>` : ""}</span>${st === "open" || st === "done" ? `<span class="go">${M.play}</span>` : ""}</button></div>`
  });
  flush();
  const cn = nodes[cur];
  if (cn) h = h.replace("<!--WK-->", `<div class="wk"><span class="k">${M.week} · ${M.mis} ${cur + 1}</span><b>${nm(cn)}</b><p>${cn._sub}</p><div class="acts"><button class="gq" id="toQ">${M.quiz}${svg("arrow")}</button>${cn._st === "open" || cn._st === "done" ? `<button class="gq pl" data-id="${cn.id}">${M.play}</button>` : ""}</div></div>`);
  if (ALL || APPLS === "parasha-demo-v1") h = `<div class="line"><div class="rw open"><span class="dot">D</span><button class="node open" data-id="demo"><span class="tx"><b>${lang === "he" ? "הדגמת סוגי משחק" : lang === "es" ? "Demo de modos de juego" : "Game modes demo"}</b><span>${lang === "he" ? "כל סוגי המשחקים במקום אחד" : lang === "es" ? "Todos los tipos de juego" : "Every kind of game in one place"}</span></span><span class="go">${M.play}</span></button></div></div>` + h;
  $("path").innerHTML = h;
  if ($("toQ")) $("toQ").onclick = toQuiz; $("path").querySelectorAll(".gq.pl").forEach(b => b.onclick = () => start(b.dataset.id));
  $("path").querySelectorAll(".node").forEach(b => b.onclick = () => { if (b.getAttribute("aria-disabled")) return; if (b.classList.contains("quiz")) return card.show(SL().quizT, SL().needQ(QNEED - (quizCount(INDEX.nodes.find(n => n.id === b.dataset.id)) || 0)), SL().toQuiz, toQuiz); start(b.dataset.id) });
  const now = $("path").querySelector(".node.now"); if (now) now.scrollIntoView({ block: "center" });
}
{ let n = 0, tm = 0; $("mTitle").addEventListener("click", () => { clearTimeout(tm); tm = setTimeout(() => n = 0, 1500); if (++n >= 7) { n = 0; const on = localStorage.getItem("parasha-admin") !== "1"; try { localStorage.setItem("parasha-admin", on ? "1" : "0") } catch (e) {} card.show(on ? "🔑 Admin" : "Admin off", on ? (lang === "he" ? "כל המשימות והסיפורים פתוחים, בלי תלות בתאריך או בחידון." : lang === "es" ? "Todas las misiones e historias están abiertas, sin depender de la fecha ni del quiz." : "Every mission and storyline is open — no dates, no quiz needed.") : "", "OK", () => location.reload()) } }) }
$("close").onclick = () => { if (window.parent !== window) window.parent.postMessage({ type: "closeGame" }, "*"); else history.back() };
$("back").onclick = () => showMap();
$("mute").onclick = () => { FX.setMuted(!FX.muted()); setMute() };

/* ---------------- 3D ---------------- */
const cv = $("c"); let E = null; let M = null;
let mode = null, MS = null, paused = true, last = performance.now(), T = 0;
let score = { c: 0, t: 0 }, asked = new Set();
function hgtFn(m) {
  const amp = (m.scene && m.scene.hills) || 1;
  const H = (x, z) => 1.6 * Math.sin(x * .07 + 1.3) * Math.sin(z * .06 + .4) + .8 * Math.sin(x * .13 - z * .11) + .3 * Math.sin(x * .4 + z * .33);
  if (m.type === "explore") return (x, z) => H(x, z) * amp * (.35 + .65 * Math.min(1, Math.abs(x - Math.sin(z * .04) * 12) / 6));
  if (m.type === "herd") return (x, z) => { const d = Math.hypot(x, z + 8); return H(x, z) * amp * 1.4 * (d < 34 ? 0 : Math.min(1, (d - 34) / 14)) };
  return () => 0;
}
let hgt = () => 0, GND = null;
function ask(i, cb) { cb && cb() }
function askList(list, cb) { const l = list.filter(i => !asked.has(i)); if (!l.length) return cb && cb(); ask(l[0], () => askList(l.slice(1), cb)) }
function finish(extraScrolls) {
  if (STY) { paused = true; prog.scrolls = (prog.scrolls || 0) + (extraScrolls || 0); saveProg(); return setTimeout(storyNext, mode === "explore" ? 1300 : 700) }
  paused = true; prog.done[MS.id] = { at: Date.now() }; prog.scrolls = (prog.scrolls || 0) + (extraScrolls || 0); saveProg();
  FX.end(tx(MS.outro), showMap)
}
async function start(id) {
  let m; try { m = await (await fetch("missions/" + id + ".json", { cache: "no-cache" })).json() } catch (e) { return }
  if (!E) { E = Engine(cv); if (!E) { $("err").style.display = "flex"; return } M = E.M }
  m.id = m.id || id; STY = null; if (m.story) return storyPick(m);
  launch(m, id) }
function launch(m, id, opt = {}) {
  MS = m; mode = m.type; score = { c: 0, t: 0 }; asked = new Set(); paused = true;
  $("map").style.display = "none"; $("play").classList.add("on"); E.resize();
  hgt = hgtFn(m); const sc = m.scene || {};
  GND = E.plane(mode === "build" ? 40 : 110, mode === "build" ? 160 : 240, hgt);
  $("hTitle").textContent = INDEX.nodes.find(n => n.id === id) ? nm(INDEX.nodes.find(n => n.id === id)) : (tx(m.title) || id); $("hTitle").title = FMT[mode];
  $("tray").style.display = mode === "build" ? "flex" : "none"; document.body.classList.toggle("building", mode === "build"); $("slots").innerHTML = ""; $("arrow").style.display = "none";
  document.querySelectorAll(".tapz").forEach(t => t.style.display = mode === "run" ? "block" : "none"); if ($("rbar")) $("rbar").style.display = "none";
  $("mission").style.display = mode === "run" ? "none" : "block";
  $("cTag").textContent = u().mission + " · " + nm(INDEX.nodes.find(n => n.id === id) || { id, name: {} });
  FX.setCollect(null);
  ({ explore: initExplore, herd: initHerd, build: initBuild, run: initRun })[mode](); if (mode === "explore" || mode === "herd") initDecor(); else MS._d = null; FX.reset(opt.keep);
  $("hint").style.opacity = 1; $("hint").textContent = mode === "build" ? u().hBuild : mode === "run" ? u().hRun : u().hWalk;
  setTimeout(() => $("hint").style.opacity = 0, 5000);
  if (opt.ready) return opt.ready();
  card.show(tx(m.title), tx(m.intro), u().start, () => { paused = false; last = performance.now() });
}
const resume = () => { paused = false; last = performance.now() };

/* ---------- shared scenery ---------- */
function drawObj(o) {
  const y = hgt(o.x, o.z), s = o.s || 1;
  const green = MS && MS.scene && MS.scene.ground ? MS.scene.ground[1] > MS.scene.ground[0] * .95 : true, pick = (a) => a[Math.abs(Math.round(o.x * 7 + o.z * 3)) % a.length];
  if (o.t === "tent") E.sprite(pick(["scenery/tent_dark", "scenery/tent_light", "scenery/tent_dark"]), o.x, y, o.z, 4.4 * s);
  else if (o.t === "tree") E.sprite(pick(green ? ["scenery/olive", "scenery/fig", "scenery/olive", "scenery/acacia"] : ["scenery/acacia", "scenery/palm", "scenery/olive"]), o.x, y, o.z, 6.2 * s);
  else if (o.t === "palm") E.sprite("scenery/palm", o.x, y, o.z, 8 * (o.s || 1));
  else if (o.t === "sheaf") E.sprite("scenery/sheaf", o.x, y, o.z, 1.9 * s);
  else if (o.t === "rock") E.sprite(pick(["scenery/boulder", "scenery/rocks"]), o.x, y, o.z, 1.6 * s);
  else if (o.t === "well") E.sprite("scenery/well", o.x, y, o.z, 3.4 * s);
  else if (o.t === "pit") { const h = (o.t === "well" ? .8 : .45) * s; E.draw(E.CYL, M.trs(o.x, y, o.z, 0, 1.6, Math.max(.01, h), 1.6), [.6, .55, .48]); E.draw(E.DISC, M.trs(o.x, y + h + .02, o.z, 0, 1.25, 1, 1.25), o.t === "well" ? [.3, .5, .7] : [.1, .08, .06], 1, 0); if (o.t === "well" && s > .9) { for (const sx of [-1.3, 1.3]) E.draw(E.CYL, M.trs(o.x + sx, y, o.z, 0, .08, 2.2, .08), [.45, .3, .18]); E.draw(E.BOX, M.trs(o.x, y + 2.25, o.z, 0, 2.9, .12, .12), [.45, .3, .18]) } }
  else if (o.t === "altar") E.sprite("scenery/altar", o.x, y, o.z, 2.6 * s);
  else if (o.t === "person") { if (o.sprite) E.sprite(o.sprite, o.x, y, o.z, o.h || 3.2, o.flip) }
}
function scenery() { (MS.objects || []).forEach(drawObj) }
function initDecor() { const sc = MS.scene || {}, g = sc.ground || [.8, .7, .5], green = g[1] > g[0] * .95, D = { mts: [], clouds: [], tufts: [], drops: [] };
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + .2, r = 150 + (i * 37 % 40); D.mts.push([Math.cos(a) * r, Math.sin(a) * r, 22 + (i * 13 % 18), 30 + (i * 7 % 20)]) }
  for (let i = 0; i < 9; i++) { const a = i * 2.1, r = 40 + (i * 29 % 70); D.clouds.push([Math.cos(a) * r, 34 + (i % 3) * 6, Math.sin(a) * r - 30, 3 + (i % 3)]) }
  for (let i = 0; i < 160; i++) { const x = ((i * 73) % 180) - 90, z = ((i * 131) % 220) - 110; D.tufts.push([x + Math.sin(i) * 3, z + Math.cos(i * 1.7) * 3, i % 7]) }
  D.green = green; D.mtc = green ? [.45, .55, .42] : [.72, .56, .4]; MS._d = D }
function drawDecor(cx, cz) { const D = MS._d; if (!D) return; const sc = MS.scene || {};
  for (const [x, z, h, w] of D.mts) E.draw(E.CONE, M.trs(cx + x, -2, cz + z, x, w, h, w * .8), D.mtc);
  if (!sc.rain) E.draw(E.SPH, M.trs(cx + 60, 70, cz - 160, 0, 9, 9, 9), [1, .93, .7], 1, 0);
  for (const [x, y, z, s] of D.clouds) { const c = sc.rain ? [.55, .58, .62] : [1, 1, 1]; for (let k = 0; k < 3; k++) E.draw(E.SPH, M.trs(cx * .5 + x + k * s * .9, y + (k === 1 ? s * .35 : 0), z + cz * .5, 0, s * 1.3, s * .7, s), c, .92, 0) }
  for (const [x, z, k] of D.tufts) { if (Math.abs(x - cx) > 45 || Math.abs(z - cz) > 55) continue; const y = hgt(x, z);
    if (k === 0) { E.sprite(D.green ? "scenery/bush" : "scenery/dry_bush", x, y, z, 1.3, x > z, false); continue }
    if (D.green) { if (k < 5) E.draw(E.CONE, M.trs(x, y, z, k, .35, .55 + k * .06, .35), [.36 + k * .02, .55, .26]); else E.draw(E.SPH, M.trs(x, y + .25, z, 0, .16, .16, .16), k === 5 ? [.95, .85, .3] : [.9, .45, .55], 1, 0) }
    else { if (k < 4) E.draw(E.SPH, M.trs(x, y + .1, z, k, .3 + k * .05, .18, .25), [.7, .6, .48]); else E.draw(E.CONE, M.trs(x, y, z, k, .3, .45, .3), [.55, .6, .35]) } }
  if (sc.rain) { const t = performance.now() / 1000; for (let i = 0; i < 70; i++) { const x = cx + ((i * 37) % 40) - 20, z = cz + ((i * 53) % 40) - 25, y = 22 - ((t * 25 + i * 3.1) % 22); E.draw(E.BOX, M.trs(x, y, z, 0, .04, .7, .04), [.75, .82, .95], .6, 0) } } }
function trees(seed) { const out = []; for (let i = 0; i < 60; i++) { const a = i * 2.39996 + seed, r = 14 + (i * 53 % 100); out.push({ t: (i % 3 ? "tree" : "rock"), x: Math.cos(a) * r * .9, z: Math.sin(a) * r * 1.1, s: .7 + (i % 5) * .12 }) } return out }

/* ---------- input ---------- */
const key = {}; addEventListener("keydown", e => { key[e.key] = 1; if (e.key.startsWith("Arrow")) e.preventDefault(); if (mode === "run" && !paused) { if (e.key === "ArrowLeft" || e.key === "a") R.lane = Math.max(0, R.lane - 1); if (e.key === "ArrowRight" || e.key === "d") R.lane = Math.min(2, R.lane + 1) } }); addEventListener("keyup", e => { key[e.key] = 0 });
let joy = null; const J = $("joy"), K = $("knob");
cv.addEventListener("pointerdown", e => { if (paused) return; if (mode === "build") { drag = { x: e.clientX, y: e.clientY, yaw: B.yaw, pitch: B.pitch }; cv.setPointerCapture(e.pointerId); return } joy = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, id: e.pointerId }; J.style.left = e.clientX + "px"; J.style.top = e.clientY + "px"; J.style.display = "block"; cv.setPointerCapture(e.pointerId) });
cv.addEventListener("pointermove", e => { if (drag) { B.yaw = drag.yaw - (e.clientX - drag.x) * .008; B.pitch = Math.max(.25, Math.min(1.25, drag.pitch + (e.clientY - drag.y) * .005)); return } if (!joy || e.pointerId !== joy.id) return; let dx = e.clientX - joy.x, dy = e.clientY - joy.y; const l = Math.hypot(dx, dy); if (l > 50) { dx = dx / l * 50; dy = dy / l * 50 } joy.dx = dx / 50; joy.dy = dy / 50; K.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))` });
const endP = () => { joy = null; drag = null; J.style.display = "none"; K.style.transform = "translate(-50%,-50%)" }; cv.addEventListener("pointerup", endP); cv.addEventListener("pointercancel", endP);
let drag = null;
function stick() { let ix = (key.ArrowRight || key.d ? 1 : 0) - (key.ArrowLeft || key.a ? 1 : 0), iz = (key.ArrowDown || key.s ? 1 : 0) - (key.ArrowUp || key.w ? 1 : 0); if (joy) { ix = joy.dx; iz = joy.dy } const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l } return [ix, iz] }
function walker(P, dt, sp, obstacles) { const [ix, iz] = stick(); P.vx += (ix * sp - P.vx) * Math.min(1, dt * 8); P.vz += (iz * sp - P.vz) * Math.min(1, dt * 8); P.x = Math.max(-105, Math.min(105, P.x + P.vx * dt)); P.z = Math.max(-110, Math.min(110, P.z + P.vz * dt)); for (const o of obstacles) { const ex = P.x - o.x, ez = P.z - o.z, e = Math.hypot(ex, ez), mn = 1.2 * (o.s || 1); if (e < mn && e > 0) { P.x = o.x + ex / e * mn; P.z = o.z + ez / e * mn } } const pv = Math.hypot(P.vx, P.vz); if (pv > .3) { P.ry = Math.atan2(P.vx, P.vz); P.walk += dt * pv } }
function drawPlayer(P, robe) { const y = hgt(P.x, P.z), bob = Math.abs(Math.sin(P.walk * 2.2)) * .08; const ps = (MS.player || {}).sprite; if (ps) { P.face = Math.sin(P.ry) < -.05 ? 1 : Math.sin(P.ry) > .05 ? 0 : P.face || 0; return E.sprite(ps, P.x, y + bob, P.z, (MS.player || {}).h || 3.2, P.face) } if (robe === "coat") { E.shadow(P.x, y, P.z, .9); const cols = [[.75, .2, .2], [.95, .7, .2], [.2, .55, .35], [.2, .4, .75], [.55, .25, .6]]; for (let i = 0; i < 5; i++) { const s = .7 - i * .12; E.draw(E.CYL, M.trs(P.x, y + i * .46, P.z, P.ry, s, .46, s), cols[i]) } E.draw(E.SPH, M.trs(P.x, y + 2.35 + bob, P.z, P.ry, .38, .4, .38), [.55, .38, .26]); E.draw(E.SPH, M.trs(P.x, y + 2.5 + bob, P.z, P.ry, .42, .28, .42), [.25, .18, .12]) } else E.person(P.x, y, P.z, P.ry, robe || [.06, .46, .43], { staff: true, bob }) }
function follow(P, fog) { const asp = cv.width / cv.height, dist = asp < 1 ? 22 : 17, py = hgt(P.x, P.z), sc = MS.scene || {}; E.begin([P.x, py + dist * .75, P.z + dist], [P.x, py, P.z - 7], asp < 1 ? .95 : .8, { sky: sc.sky, fog: sc.fog, fogNear: 60, fogFar: 220 }); E.draw(GND, M.id(), sc.ground || [.8, .7, .5]); drawDecor(P.x, P.z) }
function setMission(html) { $("mission").innerHTML = html }

/* ---------- explore ---------- */
const X = {};
function initExplore() { const m = MS; X.P = { x: m.start[0], z: m.start[1], vx: 0, vz: 0, ry: Math.PI, walk: 0 }; X.step = 0; X.colFor = -1; X.pickDone = -1; X.picking = false; X.fol = []; X.rev = {}; X.scen = trees(1).filter(o => Math.abs(o.x - Math.sin(o.z * .04) * 12) > 8); X.t = 0; showStep() }
function showStep() { const s = MS.steps[X.step]; if (X.colFor !== X.step) { X.colFor = X.step; FX.setCollect(null); FX.stepStart({ x: X.P.x, z: X.P.z }); X.from = [X.P.x, X.P.z]; X.rem = null; if (s && s.npc) s.npc.forEach((n, k) => { if (n.follow === "start") X.fol.push({ x: n.x, z: n.z, c: n.c, k, sprite: n.sprite, h: n.h }) }) } setMission(s ? `<b>${X.step + 1}/${MS.steps.length}:</b> ${tx(s.text)}` : ""); $("hCnt").textContent = Math.min(X.step + 1, MS.steps.length) + " / " + MS.steps.length }
function stepTarget(s) { if (s.collect || s.tapg || s.mini) return [X.P.x, X.P.z]; if (s.npc && s.npc[0] && s.npc[0].wander) { return [s.npc[0].x + Math.sin(X.t * .4) * 3, s.npc[0].z + Math.cos(X.t * .3) * 2] } return s.at }
function exploreStep(dt) {
  X.t += dt; walker(X.P, dt, 11, X.scen); X.fol.forEach((f, i) => { const bx = X.P.x - Math.sin(X.P.ry) * (2.2 + i * 1.6) + (i - 1) * .9, bz = X.P.z - Math.cos(X.P.ry) * (2.2 + i * 1.6); f.x += (bx - f.x) * Math.min(1, dt * 3); f.z += (bz - f.z) * Math.min(1, dt * 3) }); const s = MS.steps[X.step]; if (!s) return;
  if (s.limit) { const used = FX.used(), rem = Math.ceil(s.limit - used); if (rem !== X.rem) { X.rem = rem; $("hCnt").textContent = "⏱ " + Math.max(0, rem) }
    if (rem <= 0) { paused = true; FX.wrong(); card.show(SL().tooSlow, tx(s.text).replace(/<[^>]+>/g, ""), SL().again, () => { X.P.x = X.from[0]; X.P.z = X.from[1]; X.colFor = -1; showStep(); resume() }); return } }
  if ((s.collect || s.tapg || s.mini) && X.pickDone !== X.step) { if (!X.picking) { X.picking = true; paused = true; const done = () => { X.picking = false; X.pickDone = X.step; resume() };
      setTimeout(() => s.mini ? runMini(s.mini, done, s.text) : s.tapg ? tapGame(Object.assign({ text: s.text }, s.tapg), done) : pickGame(s.collect, s.text, done), 500) } return }
  const [gx, gz] = stepTarget(s); if ((s.collect || s.tapg || s.mini) ? true : Math.hypot(X.P.x - gx, X.P.z - gz) < s.r) {
    paused = true; X.rev[X.step] = performance.now(); FX.reach(s, X.P); if (s.npc) s.npc.forEach((n, k) => { if (n.follow && n.follow !== "start") X.fol.push({ x: n.x, z: n.z, c: n.c, k, sprite: n.sprite, h: n.h }) }); const go = () => askList(s.q || [], () => { X.step++; showStep(); if (X.step >= MS.steps.length) finish(0); else resume() });
    if (s.talk) setTimeout(() => talk(s.talk, go), 700); else if (s.arrive) { const a = tx(s.arrive); card.show(a[0], a[1], u().cont, go) } else go()
  }
}
function exploreDraw() {
  follow(X.P); for (const o of X.scen) drawObj(o); scenery();
  MS.steps.forEach((s, i) => { if (i <= X.step) (s.objects || []).forEach(o => { if (!o.reveal) return drawObj(o); if (X.rev[i] == null) return; const k = Math.min(1, (performance.now() - X.rev[i]) / 700); drawObj({ ...o, s: k }) }); if (X.rev[i] != null && i === X.step - 1 && (performance.now() - X.rev[i]) < 900) E.draw(E.SPH, M.trs(s.at[0], hgt(s.at[0], s.at[1]) + 1, s.at[1], 0, 2, 1.2, 2), [.8, .65, .45], .5); if (i === X.step && s.npc) s.npc.forEach((n, k) => { if (n.follow === "start") return; const p = k === 0 && n.wander ? stepTarget(s) : [n.x, n.z]; if (n.sprite) E.sprite(n.sprite, p[0], hgt(p[0], p[1]), p[1], n.h || 3.2, n.flip); else E.person(p[0], hgt(p[0], p[1]), p[1], X.t * (n.wander ? 1 : 0) + k, n.c || [.9, .9, .92], { hat: [.95, .95, .97] }) }) });
  X.fol.forEach(f => f.sprite ? E.sprite(f.sprite, f.x, hgt(f.x, f.z), f.z, f.h || 3.2, f.flip) : E.person(f.x, hgt(f.x, f.z), f.z, X.P.ry, f.c || [.9, .9, .92], { hat: [.95, .95, .97] })); drawPlayer(X.P, (MS.player || {}).robe);
  const s = MS.steps[X.step], arrow = $("arrow");
  if (s && !paused) { const [tx, tz] = stepTarget(s), p = E.project(tx, hgt(tx, tz) + 2, tz), me = E.project(X.P.x, hgt(X.P.x, X.P.z) + 1, X.P.z); const off = !p || p[0] < 30 || p[0] > E.W - 30 || p[1] < 110 || p[1] > E.H - 40; if (off && me) { const ang = Math.atan2(tx - X.P.x, -(tz - X.P.z)); arrow.style.display = "flex"; arrow.style.left = (me[0] + Math.sin(ang) * 70) + "px"; arrow.style.top = (me[1] - Math.cos(ang) * 70) + "px"; arrow.firstElementChild.style.transform = `rotate(${ang}rad)` } else arrow.style.display = "none" } else arrow.style.display = "none";
}

/* ---------- herd ---------- */
const Hd = {};
function initHerd() { const m = MS, pen = m.pen; Hd.P = { x: 0, z: 26, vx: 0, vz: 0, ry: Math.PI, walk: 0 }; Hd.penned = 0; Hd.asked = 0;
  Hd.posts = []; if (pen.style === "fence") for (let i = 0; i < 28; i++) { const a = i / 28 * 2 * Math.PI, dx = Math.cos(a), dz = Math.sin(a); if (Math.abs(Math.atan2(dx, dz)) < pen.gap) continue; Hd.posts.push([pen.x + dx * pen.r, pen.z + dz * pen.r]) }
  Hd.rocks = trees(2).filter(o => Math.hypot(o.x - pen.x, o.z - pen.z) > 11 && Math.hypot(o.x, o.z - 20) > 10 && Math.hypot(o.x, o.z + 8) > 20);
  const kinds = m.animal === "mixed" ? ["sheep", "cow", "goat", "camel"] : [m.animal];
  Hd.a = Array.from({ length: m.n }, (_, i) => ({ k: kinds[i % kinds.length], x: (Math.random() - .5) * 16, z: 12 + Math.random() * 8, vx: 0, vz: 0, ry: Math.random() * 6, pen: false, bob: Math.random() * 6, wa: Math.random() * 6 }));
  $("hCnt").textContent = "0 / " + m.n; setMission(u().guide(m.n, u().where3[pen.style] || u().where3.fence)) }
function penCollide(o, rad) { const pen = MS.pen, dx = o.x - pen.x, dz = o.z - pen.z, d = Math.hypot(dx, dz) || .001; const inGap = Math.abs(Math.atan2(dx, dz)) < pen.gap;
  if (!inGap && d > pen.r - rad - .25 && d < pen.r + rad + .25) { const t = d < pen.r ? pen.r - rad - .25 : pen.r + rad + .25; o.x = pen.x + dx / d * t; o.z = pen.z + dz / d * t }
  if (pen.style === "well") { const mn = 1.8 + rad; if (d < mn) { o.x = pen.x + dx / d * mn; o.z = pen.z + dz / d * mn } }
  for (const r of Hd.rocks) { const ex = o.x - r.x, ez = o.z - r.z, e = Math.hypot(ex, ez), mn = (r.s || 1) * 1.1 + rad; if (e < mn && e > 0) { o.x = r.x + ex / e * mn; o.z = r.z + ez / e * mn } }
  o.x = Math.max(-70, Math.min(70, o.x)); o.z = Math.max(-70, Math.min(70, o.z)) }
function herdStep(dt) { const P = Hd.P, pen = MS.pen; walker(P, dt, 9, []); penCollide(P, .5);
  for (const s of Hd.a) { let ax = 0, az = 0;
    if (!s.pen) { const dx = s.x - P.x, dz = s.z - P.z, d = Math.hypot(dx, dz) || .01; if (d < 8) { const f = (8 - d) / 8 * 26; ax += dx / d * f; az += dz / d * f }
      let cx = 0, cz = 0, c = 0; for (const o of Hd.a) { if (o === s || o.pen) continue; const ex = s.x - o.x, ez = s.z - o.z, e = Math.hypot(ex, ez); if (e < 1.4 && e > 0) { ax += ex / e * (1.4 - e) * 14; az += ez / e * (1.4 - e) * 14 } if (e < 7) { cx += o.x; cz += o.z; c++ } } if (c) { ax += (cx / c - s.x) * .6; az += (cz / c - s.z) * .6 } }
    else { const dx = s.x - pen.x, dz = s.z - pen.z, d = Math.hypot(dx, dz) || .01; if (d > pen.r - 1.3) { ax -= dx / d * 6; az -= dz / d * 6 } for (const o of Hd.a) { if (o === s || !o.pen) continue; const ex = s.x - o.x, ez = s.z - o.z, e = Math.hypot(ex, ez); if (e < 1.3 && e > 0) { ax += ex / e * 8; az += ez / e * 8 } } }
    s.wa += (Math.random() - .5) * dt * 3; ax += Math.cos(s.wa) * 1.2; az += Math.sin(s.wa) * 1.2;
    s.vx = (s.vx + ax * dt) * Math.pow(.15, dt); s.vz = (s.vz + az * dt) * Math.pow(.15, dt); const v = Math.hypot(s.vx, s.vz), mx = s.pen ? 1.2 : 7; if (v > mx) { s.vx *= mx / v; s.vz *= mx / v }
    s.x += s.vx * dt; s.z += s.vz * dt; penCollide(s, .6); if (v > .25) s.ry = Math.atan2(s.vx, s.vz); s.bob += dt * v * 2.4;
    if (!s.pen && Math.hypot(s.x - pen.x, s.z - pen.z) < pen.r - 1.6) { s.pen = true; Hd.penned++; $("hCnt").textContent = Hd.penned + " / " + MS.n; FX.penned(s);
      if (Hd.penned === MS.n) finish(0); else if (Hd.penned >= (Hd.asked + 1) * MS.every && Hd.asked < MS.q.length) { paused = true; ask(Hd.asked++, resume) } } } }
function animal(s) { const y = hgt(s.x, s.z), b = Math.abs(Math.sin(s.bob)) * .12, R = s.ry, fw = [Math.sin(R), Math.cos(R)]; const leg = (ox, oz, h, c) => { const lx = s.x + Math.cos(R) * ox + fw[0] * oz, lz = s.z - Math.sin(R) * ox + fw[1] * oz; E.draw(E.CYL, M.trs(lx, y, lz, 0, .08, h, .08), c) };
  if (s.k === "camel") { E.shadow(s.x, y, s.z, 1.1); E.draw(E.SPH, M.trs(s.x, y + 1.5 + b, s.z, R, .6, .55, 1.05), [.78, .6, .38]); E.draw(E.SPH, M.trs(s.x, y + 2.05 + b, s.z, R, .4, .45, .45), [.78, .6, .38]); E.draw(E.CYL, M.trs(s.x + fw[0] * .9, y + 1.6 + b, s.z + fw[1] * .9, 0, .14, .9, .14), [.75, .58, .36]); E.draw(E.SPH, M.trs(s.x + fw[0] * 1.15, y + 2.5 + b, s.z + fw[1] * 1.15, R, .2, .2, .35), [.72, .55, .34]); for (const [ox, oz] of [[-.3, .6], [.3, .6], [-.3, -.6], [.3, -.6]]) leg(ox, oz, 1.2 + b, [.65, .5, .3]); return }
  const col = s.k === "cow" ? [.55, .38, .25] : s.k === "goat" ? [.35, .3, .28] : [.97, .95, .9], sz = s.k === "cow" ? 1.35 : 1;
  E.shadow(s.x, y, s.z, .75 * sz); E.draw(E.SPH, M.trs(s.x, y + .75 * sz + b, s.z, R, .62 * sz, .5 * sz, .8 * sz), col); E.draw(E.SPH, M.trs(s.x + fw[0] * .72 * sz, y + .95 * sz + b, s.z + fw[1] * .72 * sz, R, .26 * sz, .26 * sz, .3 * sz), s.k === "sheep" ? [.28, .22, .2] : col.map(c => c * .8));
  for (const [ox, oz] of [[-.3, .4], [.3, .4], [-.3, -.4], [.3, -.4]]) leg(ox * sz, oz * sz, (.4 + b) * sz, [.28, .22, .2]) }
function herdDraw() { const pen = MS.pen; follow(Hd.P); for (const o of Hd.rocks) drawObj(o); scenery();
  if (pen.style === "fence") { for (const [x, z] of Hd.posts) E.draw(E.CYL, M.trs(x, 0, z, 0, .16, 1.5, .16), [.5, .33, .18]); for (let i = 0; i < Hd.posts.length - 1; i++) { const [x1, z1] = Hd.posts[i], [x2, z2] = Hd.posts[i + 1]; if (Math.hypot(x2 - x1, z2 - z1) > 2) continue; for (const h of [.6, 1.15]) E.draw(E.SPH, M.trs((x1 + x2) / 2, h, (z1 + z2) / 2, Math.atan2(x2 - x1, z2 - z1), .06, .06, Math.hypot(x2 - x1, z2 - z1) / 2), [.55, .37, .2]) } }
  if (pen.style === "ark") { const W = [.48, .32, .18]; for (let i = 0; i < 36; i++) { const a = i / 36 * 2 * Math.PI, dx = Math.cos(a), dz = Math.sin(a); if (Math.abs(Math.atan2(dx, dz)) < pen.gap) continue; E.draw(E.BOX, M.trs(pen.x + dx * pen.r * 1.25, 1.3, pen.z + dz * pen.r, -a, 1.6, 2.6, .45), W) } E.draw(E.BOX, M.trs(pen.x, 3.6, pen.z - 2, 0, 6, 2, 3.5), [.55, .38, .22]); E.draw(E.BOX, M.trs(pen.x, 4.75, pen.z - 2, 0, 6.6, .3, 4.2), [.4, .26, .14]); E.draw(E.BOX, M.trs(pen.x, .15, pen.z + pen.r + 1.5, 0, 2.4, .3, 3.5), W) }
  if (pen.style === "well") { drawObj({ t: "well", x: pen.x, z: pen.z }); E.draw(E.BOX, M.trs(pen.x + 2.6, .35, pen.z, 0, 2.6, .5, .8), [.55, .5, .45]); for (let i = 0; i < 30; i++) { const a = i / 30 * 2 * Math.PI, dx = Math.cos(a), dz = Math.sin(a); if (Math.abs(Math.atan2(dx, dz)) < pen.gap) continue; E.draw(E.SPH, M.trs(pen.x + dx * pen.r, .3, pen.z + dz * pen.r, a, .55, .45, .5), [.62, .55, .46]) } if (pen.sprite) E.sprite(pen.sprite, pen.x - 2.5, 0, pen.z + 1.5, 3.2) }
  for (const s of Hd.a) animal(s); drawPlayer(Hd.P) }

/* ---------- build ---------- */
const B = {};
const GOLD = [.86, .68, .24], COPPER = [.66, .4, .22];
function initBuild() { B.placed = {}; B.sel = null; B.yaw = .5; B.pitch = MS.layout === "creation" ? .42 : .78; B.dist = MS.layout === "creation" ? 34 : 40; B.tgt = MS.layout === "creation" ? [0, 1, 0] : [4, 0, 0];
  const order = MS.items.slice().sort(() => Math.random() - .5); $("tray").innerHTML = order.map(it => `<button data-id="${it.id}">${it.e ? `<span style="font-size:22px;display:block">${it.e}</span>` : ""}${tx(it.n)}<small>${tx(it.s)}</small></button>`).join("");
  $("slots").innerHTML = MS.slots.map(s => `<button class="slot" data-at="${s.id}" aria-label="${tx(s.label) || "+"}">${tx(s.label) || "+"}</button>`).join("");
  $("hCnt").textContent = "0 / " + MS.items.length; setMission(u().pick);
  $("tray").querySelectorAll("button").forEach(b => b.onclick = () => { B.sel = B.sel === b.dataset.id ? null : b.dataset.id; $("tray").querySelectorAll("button").forEach(x => x.classList.toggle("sel", x.dataset.id === B.sel)); setMission(B.sel ? u().where(tx(MS.items.find(i => i.id === B.sel).n)) : u().pick) });
  $("slots").querySelectorAll(".slot").forEach(b => b.onclick = () => { if (!B.sel || paused) return; const it = MS.items.find(i => i.id === B.sel);
    if (b.dataset.at === B.sel) { B.placed[B.sel] = performance.now(); FX.placed(b); $("tray").querySelector(`[data-id="${B.sel}"]`).classList.add("done"); const n = Object.keys(B.placed).length; $("hCnt").textContent = n + " / " + MS.items.length; B.sel = null; $("tray").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      setMission(`<b>${tx(it.n)} ✓</b> ${tx(it.ok)}`); if (n === MS.items.length) { FX.built(); setTimeout(() => finish(n), 1600) } }
    else { FX.wrong(); setMission(u().notThere + tx(it.no)); b.animate([{ transform: "translate(-50%,-50%) translateX(-6px)" }, { transform: "translate(-50%,-50%) translateX(6px)" }, { transform: "translate(-50%,-50%)" }], { duration: 300 }) } }) }
cv.addEventListener("wheel", e => { if (mode === "build") B.dist = Math.max(16, Math.min(48, B.dist + e.deltaY * .03)) }, { passive: true });
function model(k, x, z, t) { const y = (1 - Math.min(1, t)) * 6;
  if (k === "aron") { E.draw(E.BOX, M.trs(x, y + .55, z, 0, 1.25, .75, .75), GOLD, 1, 1, .8); E.draw(E.BOX, M.trs(x, y + .98, z, 0, 1.3, .1, .8), GOLD, 1, 1, .8) }
  if (k === "shulchan") { E.draw(E.BOX, M.trs(x, y + .75, z, 0, 1, .08, .5), GOLD, 1, 1, .8); for (const [a, b] of [[-.45, -.2], [.45, -.2], [-.45, .2], [.45, .2]]) E.draw(E.CYL, M.trs(x + a, y, z + b, 0, .04, .75, .04), GOLD); for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) E.draw(E.BOX, M.trs(x - .25 + i * .5, y + .85 + j * .08, z, 0, .4, .06, .3), [.93, .85, .62]) }
  if (k === "menorah") { E.draw(E.CYL, M.trs(x, y, z, 0, .25, .12, .25), GOLD, 1, 1, .8); E.draw(E.CYL, M.trs(x, y, z, 0, .05, 1.7, .05), GOLD, 1, 1, .8); for (let i = 1; i <= 3; i++) for (const sg of [-1, 1]) { const o = sg * i * .22; E.draw(E.CYL, M.trs(x, y + 1.7 - .18 * i, z + o, 0, .035, .18 * i, .035), GOLD); E.draw(E.BOX, M.trs(x, y + 1.7 - .18 * i, z + o / 2, 0, .04, .04, Math.abs(o)), GOLD) } for (let i = -3; i <= 3; i++) E.draw(E.SPH, M.trs(x, y + 1.85, z + i * .22, 0, .05, .09, .05), [1, .85, .4], 1, 0) }
  if (k === "ketoret") { E.draw(E.BOX, M.trs(x, y + .5, z, 0, .5, 1, .5), GOLD, 1, 1, .8) }
  if (k === "kiyor") { E.draw(E.CYL, M.trs(x, y, z, 0, .35, .6, .35), COPPER, 1, 1, .6); E.draw(E.CYL, M.trs(x, y + .6, z, 0, .7, .35, .7), COPPER, 1, 1, .6); E.draw(E.DISC, M.trs(x, y + .96, z, 0, .62, 1, .62), [.45, .7, .9], .85, 0) }
  if (k === "mizbeach") { E.draw(E.BOX, M.trs(x, y + .75, z, 0, 2.5, 1.5, 2.5), COPPER, 1, 1, .4); E.draw(E.BOX, M.trs(x + 2.6, y + .38, z, 0, 3, .1, 1), COPPER); E.draw(E.SPH, M.trs(x, y + 1.6, z, 0, .5, .3, .5), [1, .55, .2], .9, 0) }
  const py = 1.1 + y;
  if (k === "light") { E.draw(E.SPH, M.trs(x, py + .9, z, 0, .7, .7, .7), [1, .97, .75], 1, 0); E.draw(E.SPH, M.trs(x, py + .9, z, 0, 1.1, 1.1, 1.1), [1, .95, .6], .3, 0) }
  if (k === "sky") { E.draw(E.SPH, M.trs(x, py + .2, z, 0, 1.2, .9, 1.2), [.45, .65, .95], .85); E.draw(E.SPH, M.trs(x + .4, py + 1.1, z, 0, .45, .25, .35), [1, 1, 1], .95) }
  if (k === "land") { E.draw(E.SPH, M.trs(x, py, z, 0, 1.2, .55, 1.2), [.45, .62, .3]); E.draw(E.CYL, M.trs(x + .2, py + .3, z, 0, .08, .6, .08), [.42, .3, .18]); E.draw(E.SPH, M.trs(x + .2, py + 1.1, z, 0, .45, .42, .45), [.3, .55, .25]); E.draw(E.DISC, M.trs(x - .5, py + .05, z + .5, 0, .5, 1, .4), [.3, .55, .85], 1, 0) }
  if (k === "lights") { E.draw(E.SPH, M.trs(x - .45, py + .9, z, 0, .55, .55, .55), [1, .78, .25], 1, 0); E.draw(E.SPH, M.trs(x + .6, py + .7, z, 0, .32, .32, .32), [.92, .93, .97], 1, 0); for (let i = 0; i < 5; i++) E.draw(E.SPH, M.trs(x - .8 + i * .4, py + 1.7 + (i % 2) * .2, z, 0, .07, .07, .07), [1, 1, .8], 1, 0) }
  if (k === "fishbirds") { E.draw(E.SPH, M.trs(x - .4, py + .3, z, 0, .55, .25, .2), [.3, .55, .8]); E.draw(E.CONE, M.trs(x - 1, py + .15, z, Math.PI / 2, .2, .35, .2), [.3, .55, .8]); E.draw(E.SPH, M.trs(x + .5, py + 1.2, z, 0, .3, .25, .25), [.95, .95, .95]); E.draw(E.BOX, M.trs(x + .5, py + 1.3, z, 0, .9, .05, .3), [.95, .95, .95]) }
  if (k === "animals") { const s = { k: "sheep", x: x - .5, z, ry: 0, bob: 0 }; const hs = hgt; animalAt(s, py - 1.1); E.sprite("adam", x + .7, py - .2, z, 1.9, false, false) } }
function animalAt(s, y) { const col = [.97, .95, .9]; E.draw(E.SPH, M.trs(s.x, y + .75, s.z, 0, .62, .5, .8), col); E.draw(E.SPH, M.trs(s.x, y + .95, s.z + .72, 0, .26, .26, .3), [.28, .22, .2]) }
function buildDraw(now) { const t = B.tgt, eye = [t[0] + Math.cos(B.yaw) * Math.cos(B.pitch) * B.dist, Math.sin(B.pitch) * B.dist, t[2] + Math.sin(B.yaw) * Math.cos(B.pitch) * B.dist];
  if (MS.layout === "creation") { E.begin(eye, t, .8, { sky: [.12, .16, .3], fog: [.14, .18, .32], fogNear: 40, fogFar: 120, sun: [1, .95, .85] }); E.draw(GND, M.id(), [.24, .26, .36]); for (let i = 0; i < 90; i++) { const a = i * 2.39996, r = 40 + (i * 17 % 50); E.draw(E.SPH, M.trs(Math.cos(a) * r, 12 + (i * 29 % 40), Math.sin(a) * r - 20, 0, .25, .25, .25), [1, 1, .92], 1, 0) }
    for (const s of MS.slots) { E.draw(E.CYL, M.trs(s.at[0], 0, s.at[1], 0, 1.4, 1.1, 1.4), [.85, .8, .7]) } E.draw(E.CYL, M.trs(0, 0, -6, 0, 1.6, 1.4, 1.6), [.95, .85, .5]); }
  else { E.begin(eye, t, .8, { sky: [.66, .78, .93], fog: [.9, .85, .74], fogNear: 50, fogFar: 140 }); E.draw(GND, M.id(), [.88, .75, .52]); mishkanScene() }
  for (const it of MS.items) { const sl = MS.slots.find(s => s.id === it.id); if (B.placed[it.id]) model(it.model, sl.at[0], sl.at[1], (now - B.placed[it.id]) / 450) }
  if (MS.layout === "mishkan") { E.draw(E.BOX, M.trs(-7.5, 2.5, 0, 0, .25, 5, 5.25), GOLD, .55, 1, .5); for (const z of [-2.5, 2.5]) E.draw(E.BOX, M.trs(0, 2.5, z, 0, 15, 5, .25), GOLD, .45, 1, .5) }
  $("slots").querySelectorAll(".slot").forEach(b => { const s = MS.slots.find(x => x.id === b.dataset.at); const show = !paused && !B.placed[s.id] && (B.sel || s.label); if (!show) { b.style.display = "none"; return } const p = E.project(s.at[0], MS.layout === "creation" ? 1.6 : 1, s.at[1]); if (!p) { b.style.display = "none"; return } b.style.display = "flex"; b.style.left = p[0] + "px"; b.style.top = p[1] + "px" }) }
function mishkanScene() { const cx0 = -11, cx1 = 24, cz = 8.5, post = [.7, .6, .45], lin = [.97, .96, .92];
  for (let x = cx0; x <= cx1; x += 2.5) for (const z of [-cz, cz]) E.draw(E.CYL, M.trs(x, 0, z, 0, .1, 2.4, .1), post);
  E.draw(E.BOX, M.trs((cx0 + cx1) / 2, 1.1, -cz, 0, cx1 - cx0, 2.2, .05), lin, .88); E.draw(E.BOX, M.trs((cx0 + cx1) / 2, 1.1, cz, 0, cx1 - cx0, 2.2, .05), lin, .88); E.draw(E.BOX, M.trs(cx0, 1.1, 0, 0, .05, 2.2, cz * 2), lin, .88);
  for (const s of [-1, 1]) E.draw(E.BOX, M.trs(cx1, 1.1, s * (cz + 3.2) / 2, 0, .05, 2.2, cz - 3.2), lin, .88); E.draw(E.BOX, M.trs(cx1, 1.1, 0, 0, .06, 2.2, 6), [.35, .3, .6], .8);
  for (let i = 0; i < 5; i++) E.draw(E.CYL, M.trs(7.5, 0, -2 + i, 0, .1, 5, .1), GOLD); E.draw(E.BOX, M.trs(-2.5, 2.5, 0, 0, .08, 5, 5), [.33, .3, .62], .55); E.draw(E.BOX, M.trs(0, 5.05, 0, 0, 15.3, .1, 5.5), [.55, .25, .3], .22) }

/* ---------- run ---------- */
const R = {}; const LANES = [-2, 0, 2];
/* runner: 3 lanes. Low obstacles you jump (swipe up / ↑ / space), tall ones you must dodge. Story items come in trails and arcs. */
const LOW = { rock: ["scenery/rocks", 1.0], jars: ["scenery/jars", 1.3], bush: ["scenery/dry_bush", 1.1], stone: ["scenery/rocks", 1.0], wheel: ["scenery/cart", 1.4], reeds: ["scenery/reeds", 1.3] };
const TALL = { boulder: ["scenery/boulder", 2.4], camel: ["camel", 3.3], cart: ["scenery/cart", 2.2], tent: ["scenery/tent_dark", 3.2], palm: ["scenery/palm", 5], pile: ["scenery/stone_pile", 2.4] };
function initRun() { Object.assign(R, { lane: 1, px: 0, y: 0, vy: 0, z: 0, speed: 13, sc: 0, lives: 3, objs: [], next: 24, inv: 0, side: [], sideNext: 0, tilt: 0 }); runHud(); $("rbar") && ($("rbar").style.display = "block") }
function runHud() { $("hCnt").textContent = `${"❤".repeat(R.lives)}${"♡".repeat(Math.max(0, 3 - R.lives))}`; const b = $("rbar"); if (b) b.firstChild.style.width = Math.min(100, R.z / MS.goal * 100) + "%" }
(() => { const b = document.createElement("div"); b.id = "rbar"; b.innerHTML = "<i></i>"; b.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);top:calc(max(10px,env(safe-area-inset-top)) + 48px);width:min(70vw,420px);height:10px;border-radius:999px;background:rgba(253,246,234,.75);z-index:5;display:none;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.2);direction:ltr"; b.firstChild.style.cssText = "display:block;height:100%;width:0;background:linear-gradient(90deg,#e0a000,#2c5a8a);border-radius:999px"; $("play").appendChild(b) })();
const jump = () => { if (mode === "run" && !paused && R.y <= .01) { R.vy = 9.5 } };
let sx = null, sy = null; ["tl", "tr"].forEach((id, k) => { const el = $(id); el.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY }); el.addEventListener("pointerup", e => { if (sx == null || paused) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
  if (dy < -30 && Math.abs(dy) > Math.abs(dx)) return jump(); const d = Math.abs(dx) > 30 ? (dx > 0 ? 1 : -1) : (k ? 1 : -1); R.lane = Math.max(0, Math.min(2, R.lane + d)) }) });
addEventListener("keydown", e => { if (e.key === "ArrowUp" || e.key === " " || e.key === "w") jump() });
function runRow(z) { const low = MS.low || ["rock", "jars", "bush"], tall = MS.tall || ["boulder", "cart"], pick = a => a[Math.random() * a.length | 0], pu = MS.pickup !== false, r = Math.random(), O = R.objs;
  if (r < .3) { const l = Math.random() * 3 | 0; O.push({ z, l, t: pick(low), low: 1 }); if (pu) for (let k = -2; k <= 2; k++) O.push({ z: z + k * 1.3, l, t: "item", y: 1.9 - Math.abs(k) * .45 }); return 10 }
  if (r < .6) { const free = Math.random() * 3 | 0; for (let l = 0; l < 3; l++) if (l !== free) O.push({ z, l, t: pick(tall) }); if (pu) for (let k = 0; k < 4; k++) O.push({ z: z - 4 + k * 2, l: free, t: "item", y: .5 }); return 13 }
  if (r < .8) { let l = Math.random() * 3 | 0; if (pu) for (let k = 0; k < 6; k++) { O.push({ z: z + k * 2.2, l, t: "item", y: .5 }); if (k === 2) l = Math.max(0, Math.min(2, l + (Math.random() < .5 ? -1 : 1))) } O.push({ z: z + 6, l: (l + 1) % 3, t: pick(low), low: 1 }); return 16 }
  const a = Math.random() * 3 | 0, b2 = (a + 1 + (Math.random() * 2 | 0)) % 3; O.push({ z, l: a, t: pick(low), low: 1 }); O.push({ z, l: b2, t: pick(tall) }); if (pu) O.push({ z, l: 3 - a - b2, t: "item", y: .5 }); return 11 }
function runStep(dt) { R.z += R.speed * dt; R.speed = Math.min(24, 13 + R.z / 45); R.px += (LANES[R.lane] - R.px) * Math.min(1, dt * 14); R.tilt += ((LANES[R.lane] - R.px) * .08 - R.tilt) * Math.min(1, dt * 10); R.inv = Math.max(0, R.inv - dt);
  R.vy -= 26 * dt; R.y = Math.max(0, R.y + R.vy * dt); if (R.y === 0 && R.vy < 0) R.vy = 0;
  while (R.next < Math.min(R.z + 90, MS.goal - 15)) R.next += runRow(R.next);
  while (R.sideNext < R.z + 90) { const sd = MS.side || (MS.walls === "water" ? [] : ["scenery/palm", "scenery/dry_bush", "scenery/acacia", "scenery/rocks"]); if (sd.length) for (const sg of [-1, 1]) if (Math.random() < .7) R.side.push({ z: R.sideNext + Math.random() * 6, x: sg * (4.2 + Math.random() * 1.2), s: sd[Math.random() * sd.length | 0] }); R.sideNext += 7 }
  for (const o of R.objs) { if (o.hit) continue; if (Math.abs(o.z - R.z) < .8 && o.l === R.lane) {
    if (o.t === "item") { if (Math.abs((o.y || .5) - (R.y + .6)) < 1.1) { o.hit = true; R.sc++; FX.scroll() } continue }
    if (o.low && R.y > .75) { if (!o.jumped) { o.jumped = 1; FX.add("dist", 5, [innerWidth / 2, innerHeight * .55], {}) } continue }
    o.hit = true; if (R.inv <= 0) { R.lives--; R.inv = 1.3; FX.wrong(); cv.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "none" }], { duration: 250 });
      if (R.lives <= 0) { paused = true; card.show(u().ouch, u().reached(Math.floor(R.z), MS.goal), u().again2, () => { initRun(); FX.reset(true); resume() }) } } } }
  R.objs = R.objs.filter(o => o.z > R.z - 6); R.side = R.side.filter(o => o.z > R.z - 8); runHud(); FX.runMile(); if (R.z >= MS.goal && !paused) { R.inv = 0; FX.runDone(); finish(R.sc) } }
function runDraw(t) { const wz = -R.z, sc = MS.scene || {}, water = MS.walls === "water"; E.begin([R.px * .55 + R.tilt * 2, 3.6 + R.y * .3, wz + 7], [R.px * .55, .8 + R.y * .3, wz - 9], 1, { sky: water ? [.55, .7, .9] : sc.sky, fog: water ? [.6, .74, .88] : sc.fog, fogNear: 22, fogFar: 90, light: [.3, .9, .4] });
  const s0 = Math.floor(R.z / 20) * 20 - 20; for (let k = 0; k < 7; k++) { const zz = -(s0 + k * 20) - 10; E.draw(E.BOX, M.trs(0, -.25, zz, 0, 60, .5, 20.2), water ? [.82, .72, .52] : (sc.ground || [.8, .66, .46]));
    E.draw(E.BOX, M.trs(0, -.24, zz, 0, 7.2, .5, 20.2), water ? [.76, .66, .47] : (sc.path || [.74, .6, .42]));
    for (const l of [-1, 1]) E.draw(E.BOX, M.trs(l, .005, zz, 0, .06, .02, 20.2), [1, 1, 1], .25, 0);
    for (const sg of [-1, 1]) { if (water) { E.draw(E.BOX, M.trs(sg * 6.2, 4, zz, 0, 4, 8.6, 20.2), [.2, .46, .72], .82, 1, .6) } else if (MS.walls === "canyon") { E.draw(E.BOX, M.trs(sg * 8.5, 2.5 + Math.sin(zz) * .6, zz, .1 * sg, 5, 5 + Math.sin(zz * .7) * 1.5, 20.2), [.66, .5, .36]) } } }
  if (water) for (let i = 0; i < 6; i++) E.draw(E.SPH, M.trs(Math.sin(t + i) * .4, 1.5 + i * 2.2, wz + 18, 0, 2.4, 1.8, 2.4), [.97, .97, .98], .8);
  for (const o of R.side) E.sprite(o.s, o.x, 0, -o.z, o.s.includes("palm") ? 5 : o.s.includes("acacia") ? 4 : 1.4, o.x > 0, false);
  if (MS.goalSprite !== false) E.sprite(MS.goalSprite || "scenery/city_gate", 0, 0, -MS.goal - 4, 7);
  for (const o of R.objs) { const x = LANES[o.l], oz = -o.z;
    if (o.t === "item") { if (!o.hit) E.sprite(MS.pickup || "scenery/scroll", x, (o.y || .5) - .3 + Math.sin(t * 4 + o.z) * .1, oz, 1.1, false, false); continue }
    const d = o.low ? LOW[o.t] || LOW.rock : TALL[o.t] || TALL.boulder; E.sprite(d[0], x, 0, oz, d[1], o.z % 2 > 1) }
  E.shadow(R.px, 0, wz, .55, .3 - R.y * .05);
  const bob = R.y > 0 ? 0 : Math.abs(Math.sin(t * 11)) * .12; if (paused || !(R.inv > 0 && Math.sin(t * 30) > 0)) { if (MS.runner) E.sprite(MS.runner, R.px, R.y + bob, wz, 1.9, false, false); else E.person(R.px, R.y + bob, wz, Math.PI, [.2, .45, .6], { s: .8 }) } }

/* ---------- loop ---------- */
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  if (mode && E) { if (!paused) { ({ explore: exploreStep, herd: herdStep, build: () => {}, run: runStep })[mode](dt); if (mode) { FX.tick(dt); FX.step() } }
    ({ explore: exploreDraw, herd: herdDraw, build: () => buildDraw(now), run: () => runDraw(T) })[mode](); if (mode === "explore" || mode === "herd") FX.draw(); E.flushSprites() }
  requestAnimationFrame(frame) }
requestAnimationFrame(frame);
/* ---------- rewards ---------- */
/* Rewards: points, golden stars to collect, combos, big pop-ups, confetti, sounds and an end-of-mission result screen.
   Loaded after game.js and uses its globals (MS, mode, X, Hd, R, B, E, M, hgt, prog, saveProg, tx, lang, start, showMap). */
(function () {
  const L = {
    en: { pts: "points", combo: "Combo", items: "Story items", mid: "Middot", speed: "Speed bonus", fast: "Fast!", steps: "Places reached", animals: "Animals guided", pieces: "Pieces placed", streak: "Perfect streak", scrolls: "Scrolls", dist: "Distance", comboB: "Combo bonus", total: "Total", best: "New best!", bestWas: n => `Best: ${n}`, again: "Play again", map: "Back to the map", great: ["Nice!", "Great!", "Amazing!"], half: "Halfway!", collect: "Collect the golden stars on the way ✨", perfect: "Perfect!", lives: "Hearts left" },
    es: { pts: "puntos", combo: "Combo", items: "Objetos de la historia", mid: "Midot", speed: "Bono de rapidez", fast: "¡Rápido!", steps: "Lugares alcanzados", animals: "Animales guiados", pieces: "Piezas colocadas", streak: "Racha perfecta", scrolls: "Rollos", dist: "Distancia", comboB: "Bono de combo", total: "Total", best: "¡Nuevo récord!", bestWas: n => `Récord: ${n}`, again: "Jugar otra vez", map: "Volver al mapa", great: ["¡Bien!", "¡Genial!", "¡Increíble!"], half: "¡A la mitad!", collect: "Junta las estrellas doradas en el camino ✨", perfect: "¡Perfecto!", lives: "Corazones" },
    he: { pts: "נקודות", combo: "קומבו", items: "פריטים מהסיפור", mid: "מידות", speed: "בונוס מהירות", fast: "מהיר!", steps: "מקומות שהגעתם", animals: "חיות שהובלו", pieces: "חלקים שהונחו", streak: "רצף מושלם", scrolls: "מגילות", dist: "מרחק", comboB: "בונוס קומבו", total: "סה״כ", best: "שיא חדש!", bestWas: n => `השיא: ${n}`, again: "לשחק שוב", map: "חזרה למפה", great: ["יפה!", "מצוין!", "מדהים!"], half: "חצי דרך!", collect: "אספו את כוכבי הזהב בדרך ✨", perfect: "מושלם!", lives: "לבבות" }
  };
  const t = () => L[lang] || L.en;
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- DOM ---------- */
  const css = document.createElement("style");
  css.textContent = `
#fxc{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:30}
#hPts{flex:none;color:#7a4a00;background:linear-gradient(#fff6d6,#ffe39a)!important;unicode-bidi:isolate;direction:ltr}
.fxpop{position:fixed;z-index:31;pointer-events:none;font-weight:900;font-size:26px;color:#ffd23f;-webkit-text-stroke:2px #7a3d12;paint-order:stroke fill;text-shadow:0 3px 0 #7a3d12,0 6px 14px rgba(0,0,0,.35);transform:translate(-50%,-50%);white-space:nowrap;direction:ltr}
.fxpop small{display:block;font-size:15px;text-align:center;color:#fff;-webkit-text-stroke:1.5px #7a3d12}
.fxban{position:fixed;left:50%;top:38%;z-index:31;pointer-events:none;transform:translate(-50%,-50%);text-align:center;font-weight:900;font-size:clamp(30px,9vw,52px);line-height:1.05;color:#ffd23f;-webkit-text-stroke:3px #7a3d12;paint-order:stroke fill;text-shadow:0 5px 0 #7a3d12,0 10px 26px rgba(0,0,0,.4);white-space:nowrap}
.fxban small{display:block;font-size:.5em;color:#fff;margin-top:4px}
#win{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%,rgba(255,214,110,.55),rgba(30,20,10,.75) 70%);z-index:25;padding:16px}
#win.on{display:flex}
#win .in{position:relative;background:var(--surface);border-radius:26px;padding:22px 20px 18px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);max-height:92vh;overflow:auto}
#win .rays{position:absolute;left:50%;top:-40px;width:260px;height:260px;margin-left:-130px;background:repeating-conic-gradient(rgba(255,205,80,.35) 0 10deg,transparent 10deg 20deg);border-radius:50%;animation:fxspin 12s linear infinite;z-index:-1;pointer-events:none}
@keyframes fxspin{to{transform:rotate(360deg)}}
#win .st{display:flex;justify-content:center;gap:6px;margin:-6px 0 4px;font-size:54px;line-height:1}
#win .st i{font-style:normal;color:#e3c985;transform:scale(.6);transition:transform .35s cubic-bezier(.3,1.8,.5,1),color .2s}
#win .st i.on{color:#ffc21a;transform:scale(1);text-shadow:0 3px 0 #b77a00,0 0 18px rgba(255,200,40,.8)}
#win .st i:nth-child(2){font-size:66px;margin-top:-10px}
#win h2{margin:4px 0 2px;font-size:23px}
#win .big{font-size:46px;font-weight:900;color:var(--terra);line-height:1.1;direction:ltr}
#win .big small{font-size:16px;color:#5a4e3c;font-weight:700}
#win ul{list-style:none;padding:0;margin:10px 0;text-align:start;font-size:14.5px}
#win li{display:flex;justify-content:space-between;gap:10px;padding:6px 10px;border-radius:10px;opacity:0;transform:translateY(8px);transition:.3s}
#win li.on{opacity:1;transform:none}#win li:nth-child(odd){background:#f3e8d3}
#win li b{direction:ltr;unicode-bidi:isolate}
#win .bst{display:inline-block;background:#ffcf3f;color:#5a3500;font-weight:900;border-radius:999px;padding:4px 12px;margin:2px 0 6px;animation:fxpulse 1s ease-in-out infinite alternate}
@keyframes fxpulse{to{transform:scale(1.08)}}
#win .old{color:#5a4e3c;font-size:13px;font-weight:700;margin:2px 0 6px}
#win .mids{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:4px 0 8px}#win .mids span{background:#eef3e6;border:2px solid #b9cfa1;color:#33502a;border-radius:999px;padding:4px 10px;font-weight:800;font-size:13.5px}
#win p.o{color:#5a4e3c;margin:6px 0 10px;font-size:14.5px}
#win .go2{all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;text-align:center;border-radius:14px;padding:12px 14px;font-weight:800;font-size:16px;margin-top:8px;background:var(--olive);color:#fff}
#win .go2.g{background:#fff;color:var(--ink);border:2px solid var(--line);padding:10px 14px}
.hud .pill.bump{animation:fxbump .35s}
@keyframes fxbump{40%{transform:scale(1.25)}}
`;
  document.head.appendChild(css);
  const cnt = document.getElementById("hCnt");
  const pill = document.createElement("span"); pill.className = "pill"; pill.id = "hPts"; pill.textContent = "⭐ 0"; cnt.after(pill);
  const cv2 = document.createElement("canvas"); cv2.id = "fxc"; document.body.appendChild(cv2); const g = cv2.getContext("2d");
  const win = document.createElement("div"); win.id = "win"; win.setAttribute("role", "dialog"); win.setAttribute("aria-modal", "true"); document.body.appendChild(win);

  /* ---------- sound (tiny synth, no files) ---------- */
  let AC = null, muted = false; try { muted = localStorage.getItem("parasha-game-mute") === "1" } catch (e) {}
  const ac = () => { if (muted) return null; if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)() } catch (e) { return null } } if (AC.state === "suspended") AC.resume(); return AC };
  addEventListener("pointerdown", ac, { once: true }); addEventListener("keydown", ac, { once: true });
  function tone(f, at, dur, type = "sine", vol = .09) { const a = ac(); if (!a) return; const o = a.createOscillator(), v = a.createGain(), s = a.currentTime + at; o.type = type; o.frequency.setValueAtTime(f, s); v.gain.setValueAtTime(0, s); v.gain.linearRampToValueAtTime(vol, s + .01); v.gain.exponentialRampToValueAtTime(.0005, s + dur); o.connect(v); v.connect(a.destination); o.start(s); o.stop(s + dur + .02) }
  const SND = {
    coin: k => { const b = 880 * Math.pow(2, Math.min(k, 6) / 12); tone(b, 0, .12, "square", .04); tone(b * 1.5, .07, .22, "square", .04) },
    good: () => { [523, 659, 784].forEach((f, i) => tone(f, i * .07, .25, "triangle", .1)) },
    fan: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * .11, i === 5 ? .7 : .2, "triangle", .11)) },
    star: i => tone(660 * Math.pow(1.26, i), 0, .35, "triangle", .12),
    bad: () => { tone(220, 0, .18, "sawtooth", .04); tone(175, .1, .25, "sawtooth", .04) }
  };

  /* ---------- particles ---------- */
  let parts = [], raf = 0;
  const COLS = ["#ffd23f", "#ff9f1c", "#2c5a8a", "#4f6b3a", "#3f7fbf", "#e84a7f", "#fff"];
  function fit() { const d = Math.min(2, devicePixelRatio || 1); cv2.width = innerWidth * d; cv2.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0) }
  addEventListener("resize", fit); fit();
  function loop() { g.clearRect(0, 0, innerWidth, innerHeight); const now = performance.now();
    parts = parts.filter(p => now - p.b < p.life);
    for (const p of parts) { const k = (now - p.b) / 1000; p.vy += p.gr * .016; p.vx *= .985; p.x += p.vx * .016; p.y += p.vy * .016; p.r += p.vr * .016; const a = 1 - (now - p.b) / p.life;
      g.save(); g.globalAlpha = Math.min(1, a * 2); g.translate(p.x, p.y); g.rotate(p.r);
      if (p.k === "spark") { g.fillStyle = p.c; g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? p.s * .4 : p.s; const an = i * Math.PI / 4; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) } g.closePath(); g.fill() }
      else { g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * (.5 + .5 * Math.abs(Math.sin(k * 8 + p.r)))) }
      g.restore() }
    raf = parts.length ? requestAnimationFrame(loop) : (g.clearRect(0, 0, innerWidth, innerHeight), 0) }
  function burst(x, y, n, kind = "spark", spd = 260) { if (RM) n = Math.ceil(n / 4); const b = performance.now();
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = spd * (.35 + Math.random() * .8);
      parts.push({ k: kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === "spark" ? 60 : 180), gr: kind === "spark" ? 380 : 520, r: Math.random() * 6, vr: (Math.random() - .5) * 12, s: kind === "spark" ? 5 + Math.random() * 6 : 7 + Math.random() * 7, c: kind === "spark" ? (Math.random() < .7 ? "#ffd23f" : "#fff") : COLS[i % COLS.length], b, life: kind === "spark" ? 700 + Math.random() * 400 : 1700 + Math.random() * 900 }) }
    if (!raf) raf = requestAnimationFrame(loop) }
  function confetti(big) { const W = innerWidth; for (let i = 0; i < (big ? 3 : 1); i++) setTimeout(() => { burst(W * .2, innerHeight * .35, big ? 60 : 40, "conf", 520); burst(W * .8, innerHeight * .35, big ? 60 : 40, "conf", 520) }, i * 280) }

  /* ---------- pop-ups ---------- */
  function pop(x, y, txt, sub, big) { const el = document.createElement("div"); el.className = "fxpop"; el.innerHTML = txt + (sub ? `<small>${sub}</small>` : ""); el.style.left = x + "px"; el.style.top = y + "px"; if (big) el.style.fontSize = "34px"; document.body.appendChild(el);
    const pr = pill.getBoundingClientRect(), dx = pr.left + pr.width / 2 - x, dy = pr.top + pr.height / 2 - y;
    el.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: 0 }, { transform: "translate(-50%,-90%) scale(1.35)", opacity: 1, offset: .2 }, { transform: "translate(-50%,-110%) scale(1)", opacity: 1, offset: .55 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.4)`, opacity: .2 }], { duration: 1100, easing: "ease-in-out" }).onfinish = () => { el.remove(); bumpPill() } }
  function banner(txt, sub) { const el = document.createElement("div"); el.className = "fxban"; el.innerHTML = txt + (sub ? `<small>${sub}</small>` : ""); document.body.appendChild(el);
    el.animate([{ transform: "translate(-50%,-50%) scale(.2) rotate(-8deg)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.15) rotate(2deg)", opacity: 1, offset: .18 }, { transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1, offset: .3 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: .8 }, { transform: "translate(-50%,-70%) scale(.9)", opacity: 0 }], { duration: 1700, easing: "ease-out" }).onfinish = () => el.remove() }
  let shown = 0; function bumpPill() { pill.classList.remove("bump"); void pill.offsetWidth; pill.classList.add("bump"); const to = S.pts; const from = shown; const b = performance.now(); (function k() { const f = Math.min(1, (performance.now() - b) / 350); shown = Math.round(from + (to - from) * f); pill.textContent = "⭐ " + shown; if (f < 1) requestAnimationFrame(k) })() }

  /* ---------- state ---------- */
  const S = { pts: 0, cat: {}, combo: 0, last: 0, bestCombo: 1, items: [], mist: 0, streak: 0, ms: 0, perf: [], mid: {}, act: 0, st0: 0, gotN: 0, need: 0, col: null };
  function scr(w) { if (!E || !w) return [innerWidth / 2, innerHeight / 2]; const p = E.project(w[0], w[1], w[2]); return p || [innerWidth / 2, innerHeight / 2] }
  function add(cat, base, at, opt = {}) {
    let mult = 1;
    if (opt.combo) { const now = performance.now(); S.combo = now - S.last < 1800 ? Math.min(S.combo + 1, 5) : 1; S.last = now; mult = S.combo; S.bestCombo = Math.max(S.bestCombo, mult) }
    const p = base * mult; S.pts += p; S.cat[cat] = (S.cat[cat] || 0) + base; if (mult > 1) S.cat.comboB = (S.cat.comboB || 0) + p - base;
    const [x, y] = Array.isArray(at) && at.length === 3 ? scr(at) : at || [innerWidth / 2, innerHeight / 2];
    pop(x, y, "<bdi dir=ltr>+" + p + "</bdi>", mult > 1 ? t().combo + " ×" + mult : opt.sub, opt.big);
    burst(x, y, opt.big ? 28 : 12 + mult * 3);
    if (opt.combo) SND.coin(mult); else SND.good();
    if (opt.combo && mult >= 3 && mult !== S.lastCall) { S.lastCall = mult; banner(t().great[Math.min(2, mult - 3)], t().combo + " ×" + mult) } if (mult < 3) S.lastCall = 0;
  }

  /* golden stars placed along the route (explore) or around the field (herd) */
  /* story items: only the things a step actually asks for ("gather 12 stones"), placed around the step's spot */
  /* gathering: the step asks for n story items around its spot. Optional: wave (how many show at once), fade (seconds before an item melts away) */
  function place(c, cx, cz) { for (let tries = 0; tries < 60; tries++) { const a = Math.random() * Math.PI * 2, d = 2.5 + Math.sqrt(Math.random()) * (c.r || 12), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if ((X.scen || []).some(o => Math.hypot(o.x - x, o.z - z) < 2.4) || S.items.some(o => !o.got && Math.hypot(o.x - x, o.z - z) < 2.2)) continue; return [x, z] } return [cx, cz] }
  function addItem() { const c = S.col; const [x, z] = place(c, S.cx, S.cz); S.items.push({ x, z, i: S.spawned++, born: performance.now() }) }
  function setCollect(st) { S.items = []; S.col = null; const c = st && st.collect; if (!c) return; S.col = c; S.need = c.n || 8; S.gotN = 0; S.spawned = 0; [S.cx, S.cz] = st.at;
    const w = c.wave || S.need; for (let k = 0; k < Math.min(w, S.need); k++) addItem() }
  const left = () => S.col ? S.need - S.gotN : 0;
  function nearest(P) { let b = null, bd = 1e9; for (const o of S.items) { if (o.got || o.gone) continue; const d = Math.hypot(o.x - P.x, o.z - P.z); if (d < bd) { bd = d; b = o } } return b ? [b.x, b.z] : null }
  function collectText(st) { return st && st.collect ? ` <b>${S.gotN}/${S.need}</b>` : "" }
  function reset(keep) { if (!keep) { Object.assign(S, { pts: 0, cat: {}, combo: 0, last: 0, bestCombo: 1, mist: 0, streak: 0, lastCall: 0, perf: [], mid: {} }); shown = 0; pill.textContent = "⭐ 0" } S.ms = 0; S.act = 0; S.st0 = 0; win.classList.remove("on") }
  function tick(dt) { S.act += dt }
  const used = () => S.act - S.st0;
  function stepStart(from) { S.st0 = S.act; S.from = from }
  function step() { const P = mode === "explore" ? X.P : null; if (!P || !S.col) return; const c = S.col, now = performance.now();
    for (const o of S.items) { if (o.got || o.gone) continue; const d = Math.hypot(o.x - P.x, o.z - P.z);
      if (d < 3.2) { o.x += (P.x - o.x) * .18; o.z += (P.z - o.z) * .18 }                       /* gentle pull when close */
      if (d < 1.4) { o.got = now; S.gotN++; add("items", 20, [o.x, hgt(o.x, o.z) + 1.4, o.z], { combo: true }); showStep() }
      else if (c.fade && now - o.born > c.fade * 1000) o.gone = now }
    const act = S.items.filter(q => !q.got && !q.gone).length; for (let k = act; k < Math.min(c.wave || S.need, S.need - S.gotN); k++) addItem() }
  function draw() { if (!S.col || mode !== "explore") return; const now = performance.now(), c = S.col, h = c.h || 1.4; const spr = (o) => c.sprites ? c.sprites[o.i % c.sprites.length] : c.sprite || "scenery/star";
    for (const o of S.items) { const y = hgt(o.x, o.z);
      if (o.got) { const k = (now - o.got) / 450; if (k < 1) E.sprite(spr(o), o.x, y + k * 2.5, o.z, h * (1 - k * .6), false, false); continue }
      if (o.gone) { const k = (now - o.gone) / 600; if (k < 1) E.sprite(spr(o), o.x, y, o.z, h * (1 - k), false, false); continue }
      const age = (now - o.born) / 1000, grow = Math.min(1, age * 3), warn = c.fade && age > c.fade - 2.5 ? (Math.sin(age * 18) > 0 ? 1 : .75) : 1;
      E.sprite(spr(o), o.x, y + (c.float ? .4 + Math.sin(age * 3 + o.x) * .15 : 0), o.z, h * grow * warn + Math.sin(age * 4 + o.z) * .05) } }
  /* how well a goal went: 1 = at or under par time */
  function perf(par, used) { const f = Math.max(.2, Math.min(1, par / Math.max(used, .1))); S.perf.push(f); return f }
  function speedBonus(par, used, at) { const f = perf(par, used); if (f >= .99) { const b = Math.round(30 + (par - used) * 4); S.pts += b; S.cat.speed = (S.cat.speed || 0) + b; setTimeout(() => pop(at[0], at[1] - 40, "⚡ +" + b, t().fast), 350) } }
  /* ---------- game-specific hooks ---------- */
  function reach(s, P) { const m = /<b>(.*?)<\/b>/.exec(tx(s.text) || ""); const place = m ? m[1].replace(/<[^>]+>/g, "") : ""; const at3 = [P.x, hgt(P.x, P.z) + 3, P.z], sc = scr(at3);
    add("steps", 100, at3, { big: true }); banner(s.collect ? "✨ " + t().great[1] : "📍 " + (place || t().great[1]), "+100"); confetti(); SND.fan();
    const from = S.from || P, d = Math.hypot((s.at || [P.x, P.z])[0] - from.x, (s.at || [P.x, P.z])[1] - from.z), par = s.par || (d / 7 + 5 + (s.collect ? (s.collect.n || 8) * 2.2 : 0) + (s.npc && s.npc[0] && s.npc[0].wander ? 6 : 0));
    speedBonus(par, S.act - S.st0, sc); S.from = { x: P.x, z: P.z } }
  function penned(a) { add("animals", 25, [a.x, hgt(a.x, a.z) + 1.5, a.z], { combo: true }); if (Hd.penned === Math.ceil(MS.n / 2)) setTimeout(() => banner(t().half, Hd.penned + " / " + MS.n), 400); if (Hd.penned === MS.n) speedBonus(MS.par || MS.n * 6 + 10, S.act, [innerWidth / 2, innerHeight * .45]) }
  function placed(btn) { S.streak++; const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; const bonus = (S.streak - 1) * 10; add("pieces", 50, [x, y], { sub: bonus ? "🎯 ×" + S.streak : "" }); if (bonus) { S.pts += bonus; S.cat.streak = (S.cat.streak || 0) + bonus } if (S.streak >= 3 && S.streak % 3 === 0) { banner(t().great[Math.min(2, S.streak / 3 - 1)], "🎯 " + S.streak); confetti() } }
  function wrong() { S.mist++; S.streak = 0; SND.bad() }
  const MID = { chesed: ["🤲", "Chesed", "Jésed", "חסד"], emunah: ["🙏", "Emunah", "Emuná", "אמונה"], achdut: ["🤝", "Achdut", "Ajdut", "אחדות"], gevurah: ["💪", "Gevurah", "Guevurá", "גבורה"], emet: ["✔️", "Emet", "Emet", "אמת"], anavah: ["🌱", "Anavah", "Anavá", "ענוה"], zerizut: ["⚡", "Zerizut", "Zerizut", "זריזות"], kibud: ["👪", "Kibud av va’em", "Kibud av vaem", "כיבוד אב ואם"], hakarat: ["💛", "Hakarat hatov", "Hakarat hatov", "הכרת הטוב"], shalom: ["🕊️", "Shalom", "Shalom", "שלום"], savlanut: ["⏳", "Savlanut", "Savlanut", "סבלנות"] };
  function middah(k) { S.mid = S.mid || {}; S.mid[k] = (S.mid[k] || 0) + 1; const m = MID[k]; if (!m) return; const b = 40; S.pts += b; S.cat.mid = (S.cat.mid || 0) + b; setTimeout(() => { banner(m[0] + " " + m[lang === "he" ? 3 : lang === "es" ? 2 : 1], "<bdi dir=ltr>+" + b + "</bdi>"); SND.good() }, 200) }
  const midRow = () => S.mid ? `<div class="mids">${Object.keys(S.mid).filter(k => MID[k]).map(k => `<span>${MID[k][0]} ${MID[k][lang === "he" ? 3 : lang === "es" ? 2 : 1]}${S.mid[k] > 1 ? " ×" + S.mid[k] : ""}</span>`).join("")}</div>` : "";
  function built() { perf(1, 1 + S.mist * .35) }
  function scroll() { const p = E.project(R.px, 1.6, -R.z) || [innerWidth / 2, innerHeight * .6]; add("items", 15, p, { combo: true }) }
  function runDone() { perf(R.lives, 3); const b = R.lives * 40; S.pts += b; S.cat.lives = (S.cat.lives || 0) + b }
  function runMile() { const f = Math.floor(Math.min(MS.goal, R.z) / MS.goal * 4); if (f > S.ms && f < 4) { S.ms = f; add("dist", 50, [innerWidth / 2, innerHeight * .45], { big: true }); banner("🏁 " + f * 25 + "%"); confetti() } }

  /* ---------- result screen ---------- */
  function rating() { const p = S.perf.length ? S.perf.reduce((a, b) => a + b, 0) / S.perf.length : 1; return p >= .8 ? 3 : p >= .5 ? 2 : 1 }
  function end(outro, toMap) {
    const stars = rating(), id = STY ? STY.m.id : MS.id; if (STY) { prog.paths = prog.paths || {}; const pp = prog.paths[id] = prog.paths[id] || {}; pp[STY.p.id] = Math.max(pp[STY.p.id] || 0, stars) } prog.best = prog.best || {}; const mOld = prog.best[id]; prog.bestP = prog.bestP || {}; const pk = STY ? id + "/" + STY.p.id : id; const old = STY ? prog.bestP[pk] : mOld; const isBest = !old || S.pts > old.pts; if (STY) prog.bestP[pk] = { pts: Math.max(S.pts, old ? old.pts : 0) };
    prog.best[id] = { pts: Math.max(S.pts, mOld ? mOld.pts : 0), stars: Math.max(stars, mOld ? mOld.stars : 0) }; prog.pts = Object.values(prog.best).reduce((a, b) => a + b.pts, 0); saveProg();
    const rows = ["items", "steps", "animals", "pieces", "streak", "dist", "speed", "lives", "mid", "comboB"].filter(k => S.cat[k]).map(k => {
      const lab = k === "lives" ? t().lives : t()[k];
      return `<li><span>${lab}</span><b><bdi dir="ltr">+${S.cat[k]}</bdi></b></li>` }).join("");
    win.innerHTML = `<div class="in"><div class="rays"></div><div class="st"><i>★</i><i>★</i><i>★</i></div><h2>${u().complete}</h2><div class="big"><span id="wP">0</span> <small>${t().pts}</small></div>${isBest && old ? `<div class="bst">🏆 ${t().best}</div>` : old ? `<div class="old">${t().bestWas(old.pts)}</div>` : ""}<ul>${rows}</ul>${midRow()}<p class="o"></p><button class="go2" id="wMap">${t().map}</button><button class="go2 g" id="wAgain">${t().again}</button></div>`;
    win.querySelector("p.o").textContent = outro || "";
    setTimeout(() => {
      win.classList.add("on"); confetti(true); SND.fan();
      const st = win.querySelectorAll(".st i"); for (let i = 0; i < stars; i++) setTimeout(() => { st[i].classList.add("on"); SND.star(i); const r = st[i].getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 22) }, 500 + i * 380);
      const el = win.querySelector("#wP"), b = performance.now(), D = 1200; (function k() { const f = Math.min(1, (performance.now() - b) / D); el.textContent = Math.round(S.pts * (1 - Math.pow(1 - f, 3))); if (f < 1) requestAnimationFrame(k) })();
      win.querySelectorAll("li").forEach((li, i) => setTimeout(() => li.classList.add("on"), 300 + i * 160));
      win.querySelector("#wMap").onclick = () => { win.classList.remove("on"); toMap() };
      win.querySelector("#wAgain").onclick = () => { win.classList.remove("on"); start(id) }; if (STY) win.querySelector("#wAgain").textContent = SL().other;
      setTimeout(() => win.querySelector("#wMap").focus(), 60)
    }, 900) }

  window.FX = { used, middah, perf, wrong, pop, reset, step, draw, tick, stepStart, setCollect, left, nearest, collectText, built, runDone, add, banner, confetti, reach, penned, placed, wrong, scroll, runMile, end, burst,
    setMuted: m => { muted = m; try { localStorage.setItem("parasha-game-mute", m ? "1" : "0") } catch (e) {} }, muted: () => muted };
})();


/* ---------- story mode: pick whose story to follow, chapters of dialogue + play ---------- */
let STY = null;
const SLD = {
  en: { tapIt: "Tap them before they disappear!", dragB: "Drag the basket to catch them!", gotOf: (g, n) => `You got ${g} of ${n}. Try again!`, prevFirst: "Finish the part before", prevFirstL: "Each part continues the story — finish the part before this one first.", needQ: n => `Answer ${n} more quiz question${n === 1 ? "" : "s"} of this parashah to unlock it.`, needQs: n => `${n} quiz questions`, quizT: "Unlock with the quiz", toQuiz: "Go to the quiz", you: "Your choice", what: "What do you do?", tapGo: "TAP!", tooSlow: "Too slow!", again: "Try again", left: s => `${s}s left`, pick: "Whose story will you follow?", ch: "Chapter", chs: n => `${n} chapters`, skip: "Skip", other: "Choose another story", done: "Done", play: "Play", narr: "The Torah tells", tap: "Tap to continue" },
  es: { tapIt: "¡Tócalos antes de que desaparezcan!", dragB: "¡Arrastra la canasta para atraparlos!", gotOf: (g, n) => `Conseguiste ${g} de ${n}. ¡Inténtalo otra vez!`, prevFirst: "Termina la parte anterior", prevFirstL: "Cada parte continúa la historia: termina primero la parte anterior.", needQ: n => `Responde ${n} pregunta${n === 1 ? "" : "s"} más del quiz de esta parashá para desbloquearla.`, needQs: n => `${n} preguntas del quiz`, quizT: "Se desbloquea con el quiz", toQuiz: "Ir al quiz", you: "Tu decisión", what: "¿Qué haces?", tapGo: "¡TOCA!", tooSlow: "¡Muy lento!", again: "Intentar de nuevo", left: s => `quedan ${s}s`, pick: "¿La historia de quién vas a seguir?", ch: "Capítulo", chs: n => `${n} capítulos`, skip: "Omitir", other: "Elegir otra historia", done: "Hecha", play: "Jugar", narr: "La Torá cuenta", tap: "Toca para seguir" },
  he: { tapIt: "הקישו עליהם לפני שייעלמו!", dragB: "גררו את הסל כדי לתפוס!", gotOf: (g, n) => `אספתם ${g} מתוך ${n}. נסו שוב!`, prevFirst: "סיימו את החלק הקודם", prevFirstL: "כל חלק ממשיך את הסיפור — סיימו קודם את החלק הקודם.", needQ: n => `ענו על עוד ${n} שאלות בחידון של הפרשה כדי לפתוח.`, needQs: n => `${n} שאלות בחידון`, quizT: "נפתח עם החידון", toQuiz: "לחידון", you: "ההחלטה שלכם", what: "מה תעשו?", tapGo: "הקישו!", tooSlow: "לאט מדי!", again: "לנסות שוב", left: s => `נותרו ${s} שניות`, pick: "את הסיפור של מי תלכו בעקבותיו?", ch: "פרק", chs: n => `${n} פרקים`, skip: "דילוג", other: "לבחור סיפור אחר", done: "הושלם", play: "לשחק", narr: "התורה מספרת", tap: "הקישו להמשך" } };
const SL = () => SLD[lang] || SLD.en;
const CHN = { yosef: { en: "Yosef", he: "יוסף" }, yaakov: { en: "Yaakov", he: "יעקב" }, reuven: { en: "Reuven", es: "Reuvén", he: "ראובן" }, yehudah: { en: "Yehudah", es: "Yehudá", he: "יהודה" },
  brothers: { en: "The brothers", es: "Los hermanos", he: "האחים" }, angel: { en: "A man", es: "Un hombre", he: "איש" }, butler_baker: { en: "Butler and baker", es: "Copero y panadero", he: "שר המשקים ושר האופים" } };
const st = document.createElement("style"); st.textContent = `
#talk{position:fixed;inset:0;z-index:22;display:none;background:linear-gradient(transparent 35%,rgba(30,20,10,.55));cursor:pointer;-webkit-tap-highlight-color:transparent}
#talk.on{display:block}
body.talking .hud,body.talking .mission,body.talking .arrow,body.talking .hint{opacity:0!important;transition:opacity .2s}
#talk .por{position:absolute;bottom:calc(150px + env(safe-area-inset-bottom));height:min(46vh,360px);max-width:58vw;object-fit:contain;object-position:bottom;filter:drop-shadow(0 8px 16px rgba(0,0,0,.35));transition:transform .3s cubic-bezier(.3,1.5,.5,1),opacity .25s}
#talk .por.l{left:4vw}#talk .por.r{right:4vw}#talk .por.off{opacity:0;transform:translateY(30px) scale(.9)}#talk .por.dim{filter:brightness(.55) drop-shadow(0 8px 16px rgba(0,0,0,.35));transform:scale(.92)}
#talk .box{position:absolute;left:10px;right:10px;bottom:max(12px,env(safe-area-inset-bottom));margin:0 auto;max-width:560px;background:var(--surface);border-radius:20px;padding:14px 16px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);min-height:128px}
#talk .nm{position:absolute;top:-14px;inset-inline-start:16px;background:var(--terra);color:#fff;font-weight:900;font-size:14px;border-radius:999px;padding:5px 14px;box-shadow:0 2px 6px rgba(0,0,0,.25)}
#talk .box.narr{background:#f3e3c0;font-style:italic}#talk .box.narr .nm{background:#5a4e3c}
#talk .tx{font-size:17px;line-height:1.42;font-weight:600;margin-top:6px;min-height:48px}
#talk .ft{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px;font-size:12.5px;color:#7a6a50;font-weight:700}
#talk .src{unicode-bidi:isolate;direction:rtl;font-style:normal}
#talk .nx{animation:tkb 1s infinite}@keyframes tkb{50%{transform:translateX(4px)}}
#talk .sk{all:unset;cursor:pointer;position:absolute;top:max(12px,env(safe-area-inset-top));inset-inline-end:12px;background:rgba(253,246,234,.93);border-radius:999px;padding:8px 14px;font-weight:800;font-size:14px}
#pick{position:fixed;inset:0;z-index:21;display:none;overflow-y:auto;background:linear-gradient(#f3e6c8,#e4d2ad);padding:max(16px,env(safe-area-inset-top)) 14px 24px}
#pick.on{display:block}
#pick .top{display:flex;align-items:center;gap:10px;max-width:520px;margin:0 auto}
#pick .top button{all:unset;cursor:pointer;width:40px;height:40px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex:none}
#pick h1{font-size:20px;margin:0;line-height:1.2;flex:1}#pick h1 small{display:block;font-size:13px;color:#2c5a8a;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
#pick .sub{max-width:520px;margin:10px auto 6px;color:#5a4e3c;font-size:14.5px}
#pick .pc{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:flex-end;gap:12px;max-width:520px;width:100%;margin:14px auto 0;background:#fff;border-radius:22px;padding:12px 14px 12px 6px;box-shadow:0 4px 14px rgba(60,40,10,.14);position:relative;overflow:hidden;transition:transform .15s}
#pick .pc:active{transform:scale(.98)}
#pick .pc img{height:120px;width:96px;object-fit:contain;object-position:bottom;flex:none;margin-bottom:-12px}
#pick .pc b{display:block;font-size:19px}#pick .pc span{display:block;font-size:14px;color:#5a4e3c;margin-top:2px}
#pick .pc .meta{display:flex;gap:8px;align-items:center;margin-top:8px;font-size:12.5px;font-weight:800;color:#2c5a8a}
#pick .pc .meta i{font-style:normal;color:#e0a000;font-size:15px}#pick .pc .meta i em{font-style:normal;color:#e3c985}
#pick .pc .go3{margin-inline-start:auto;background:var(--olive);color:#fff;border-radius:999px;padding:5px 12px;font-size:13px}
#pick .pc .txt{flex:1;min-width:0;padding-bottom:4px}
#pick .pc.lk img{filter:grayscale(1) opacity(.55)}#pick .pc.lk .go3{background:#8a7b62}
.chb{position:fixed;left:50%;top:30%;transform:translate(-50%,-50%);z-index:23;pointer-events:none;text-align:center;color:#fff;text-shadow:0 3px 12px rgba(0,0,0,.6);font-weight:900;font-size:clamp(24px,7vw,38px);line-height:1.15;width:90vw}
.chb small{display:block;font-size:.45em;letter-spacing:.12em;text-transform:uppercase;color:#ffd98a}
#talk .ch3{display:grid;gap:8px;margin-top:10px;font-style:normal}
#talk .ch3 button{all:unset;cursor:pointer;background:#fff;border:2px solid var(--line);border-radius:14px;padding:11px 14px;font-weight:800;font-size:15.5px;line-height:1.3;box-shadow:0 2px 0 var(--line)}
#talk .ch3 button:active{transform:translateY(2px);box-shadow:none}
#chooseM{position:fixed;inset:0;z-index:22;display:none;align-items:flex-end;justify-content:center;background:linear-gradient(transparent 20%,rgba(30,20,10,.6));padding:14px 12px max(14px,env(safe-area-inset-bottom))}
#chooseM.on{display:flex}#chooseM .in{background:var(--surface);border-radius:22px;padding:16px;max-width:520px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,.35)}
#chooseM h3{margin:0 0 4px;font-size:19px}#chooseM p{margin:0 0 10px;color:#5a4e3c;font-size:14.5px}
#chooseM .op{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:12px;align-items:center;width:100%;background:#fff;border:2px solid var(--line);border-radius:16px;padding:10px 12px;margin-top:8px}
#chooseM .op .em{font-size:28px;flex:none;width:40px;text-align:center}#chooseM .op b{display:block;font-size:16px}#chooseM .op span{display:block;font-size:13px;color:#5a4e3c}
#chooseM .op .fm{margin-inline-start:auto;font-size:11px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#fff;background:#2e2a24;border-radius:999px;padding:3px 8px;flex:none}
#chooseM .op.dn{opacity:.45;pointer-events:none}#chooseM .op.dn .em::after{content:" ✓"}
#pickG{position:fixed;inset:0;z-index:22;display:none;flex-direction:column;background:linear-gradient(rgba(30,20,10,.35),rgba(30,20,10,.15) 40%,rgba(30,20,10,.35));touch-action:none;user-select:none;-webkit-user-select:none}
#pickG.on{display:flex}
#pickG .pg-top{margin:max(10px,env(safe-area-inset-top)) 10px 0;background:var(--surface);border-radius:18px;padding:10px 14px;box-shadow:0 6px 20px rgba(0,0,0,.25)}
#pickG .pg-top b{display:block;font-size:15px;line-height:1.3}#pickG .pg-row{display:flex;align-items:center;gap:10px;margin-top:6px}
#pickG .pg-cnt{font-weight:900;font-size:18px;color:var(--terra);min-width:54px;direction:ltr;display:inline-block}
#pickG .pg-time{flex:1;height:10px;border-radius:999px;background:#e7dfcf;overflow:hidden;direction:ltr}#pickG .pg-time i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#2c5a8a,#e0a000);border-radius:999px}
#pickG .pg-field{position:relative;flex:1;overflow:hidden}
#pickG .pg-it{position:absolute;cursor:pointer;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35));transform-origin:50% 80%}
#pickG .pg-basket{position:absolute;bottom:max(18px,env(safe-area-inset-bottom));width:110px;transform:translateX(-50%);filter:drop-shadow(0 6px 10px rgba(0,0,0,.4));pointer-events:none}
#pickG .pg-hint{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);background:rgba(46,42,36,.85);color:#fff;border-radius:999px;padding:8px 16px;font-weight:700;font-size:14px;transition:opacity .5s;pointer-events:none;white-space:nowrap}
#tapG.night{background:radial-gradient(circle at 78% 14%,rgba(255,248,220,.5) 0 3%,transparent 4%),linear-gradient(rgba(8,12,38,.86),rgba(14,18,44,.93))}#tapG.night img{filter:brightness(.7) saturate(.8)}#tapG{position:fixed;inset:0;z-index:22;display:none;flex-direction:column;align-items:center;justify-content:flex-end;padding:16px 14px max(18px,env(safe-area-inset-bottom));background:linear-gradient(transparent 30%,rgba(30,20,10,.55));touch-action:manipulation;user-select:none;-webkit-user-select:none}
#tapG.on{display:flex}#tapG img{max-height:34vh;max-width:70vw;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35));transition:transform .15s}
#tapG .card2{background:var(--surface);border-radius:20px;padding:14px 16px;max-width:520px;width:100%;margin-top:10px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.35)}
#tapG .card2 > b{font-size:17px;display:block}#tapG .card2 small{color:#5a4e3c;font-size:13.5px;display:block;margin-top:2px}
#tapG .bar{position:relative;height:34px;border-radius:999px;background:#e7dfcf;margin:12px 0 8px;overflow:hidden;direction:ltr}
#tapG .zone{position:absolute;top:0;bottom:0;background:linear-gradient(#8fbf6a,#5f8f3e);border-radius:999px}
#tapG .mk{position:absolute;top:-3px;bottom:-3px;width:8px;margin-left:-4px;border-radius:4px;background:#2e2a24;box-shadow:0 0 0 3px #fff}
#tapG .dots{display:flex;gap:6px;justify-content:center;margin:4px 0 8px}#tapG .dots i{width:16px;height:16px;border-radius:50%;background:#e2d8c5}#tapG .dots i.ok{background:#4f6b3a}
#tapG .tb{all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;background:var(--terra);color:#fff;font-weight:900;font-size:18px;border-radius:16px;padding:14px;text-align:center}
#tapG .tb:active{transform:scale(.97)}
.lim{color:#ffd98a;font-weight:900}`;
document.head.appendChild(st);
const TK = document.createElement("div"); TK.id = "talk"; TK.innerHTML = `<img class="por l off" alt=""><img class="por r off" alt=""><button class="sk"></button><div class="box"><span class="nm"></span><div class="tx"></div><div class="ft"><span class="src"></span><span class="nx">▶</span></div></div>`; document.body.appendChild(TK);
const PK = document.createElement("div"); PK.id = "pick"; document.body.appendChild(PK);
const nameOf = l => l.n ? tx(l.n) : l.w && CHN[l.w] ? (CHN[l.w][lang] || CHN[l.w].en) : SL().narr;
function talk(lines, cb) {
  if (!lines || !lines.length) return cb && cb();
  paused = true; document.body.classList.add("talking"); let i = -1, typing = null, full = ""; const hero = STY ? STY.p.who : null; const imgs = TK.querySelectorAll(".por"); const box = TK.querySelector(".box"), T = TK.querySelector(".tx");
  TK.querySelector(".sk").textContent = SL().skip + " ⏭"; TK.classList.add("on");
  imgs.forEach(im => { im.classList.add("off"); im.removeAttribute("src"); im.dataset.w = "" });
  const done = () => { clearInterval(typing); TK.classList.remove("on"); document.body.classList.remove("talking"); TK.onclick = null; cb && cb() };
  function next() {
    if (typing) { clearInterval(typing); typing = null; T.innerHTML = full; return }
    if (++i >= lines.length) return done();
    const l = lines[i];
    if (l.ask) { return askChoice(l, opt => { if (opt.middah) FX.middah(opt.middah); lines.splice(i + 1, 0, ...(opt.reply || [])); TK.onclick = handler; next() }) }
    full = tx(l.t); const narr = !l.w; box.classList.toggle("narr", narr); TK.querySelector(".nm").textContent = nameOf(l);
    TK.querySelector(".src").textContent = l.src ? "⁧" + l.src + "⁩" : "";
    const rtl = lang === "he"; let side = l.w === hero || (!hero && i % 2 === 0) ? 0 : 1; if (rtl) side = 1 - side;
    if (!narr) { const im = imgs[side], other = imgs[1 - side]; if (im.dataset.w !== l.w) { im.classList.add("off"); setTimeout(() => { im.src = "chars/" + l.w + ".png"; im.dataset.w = l.w; im.classList.remove("off") }, im.dataset.w ? 180 : 0) } else im.classList.remove("off"); im.classList.remove("dim"); if (other.dataset.w) other.classList.add("dim") }
    else imgs.forEach(im => im.dataset.w && im.classList.add("dim"));
    /* typewriter on the plain text, then swap in the formatted text */
    const plain = full.replace(/<[^>]+>/g, ""); let k = 0; T.textContent = ""; clearInterval(typing);
    if (RMo) { T.innerHTML = full; typing = null } else typing = setInterval(() => { k += 2; T.textContent = plain.slice(0, k); if (k >= plain.length) { clearInterval(typing); typing = null; T.innerHTML = full } }, 22)
  }
  const handler = e => { if (e.target.closest(".sk")) { const rest = lines.slice(i + 1).find(x => x.ask); if (rest) { i = lines.indexOf(rest) - 1; typing && clearInterval(typing); typing = null; return next() } i = lines.length; typing && clearInterval(typing); typing = null; return done() } next() };
  TK.onclick = handler;
  function askChoice(l, cb) { TK.onclick = null; box.classList.remove("narr"); TK.querySelector(".nm").textContent = "🤔 " + SL().you; T.innerHTML = tx(l.ask) + `<div class="ch3">${l.options.map((o, k) => `<button data-k="${k}">${o.e ? o.e + " " : ""}${tx(o.label)}</button>`).join("")}</div>`; TK.querySelector(".src").textContent = ""; TK.querySelector(".nx").style.visibility = "hidden";
    T.querySelectorAll(".ch3 button").forEach(b => b.onclick = ev => { ev.stopPropagation(); TK.querySelector(".nx").style.visibility = ""; cb(l.options[+b.dataset.k]) }) }
  next() }
const RMo = matchMedia("(prefers-reduced-motion: reduce)").matches;
function storyPick(m) {
  STY = null; paused = true; mode = null; $("map").style.display = "none"; $("play").classList.add("on"); Object.assign(CHN, m.story.cast || {});
  const node = INDEX.nodes.find(n => n.id === m.id) || { id: m.id, name: m.title }, pp = (prog.paths || {})[m.id] || {};
  PK.innerHTML = `<div class="top"><button id="pkBack" aria-label="${u().map.replace(/^[←→]\s*/, "")}">${lang === "he" ? "→" : "←"}</button><h1><small>${nm(node)}</small>${SL().pick}</h1></div><p class="sub"></p>` +
    m.story.paths.map((p, pi) => { const s3 = pp[p.id], qc = quizCount(node), need = QNEED * (pi + 1), seq = m.story.sequential && pi > 0 && !pp[m.story.paths[pi - 1].id] && !s3 && !ALL, lk = (qc != null && qc < need && !s3) || seq; return `<button class="pc${lk ? " lk" : ""}" data-p="${p.id}" data-need="${lk && !seq ? need - qc : 0}" data-seq="${seq ? 1 : 0}"><img src="${p.who.includes("/") ? p.who : "chars/" + p.who}.png" alt=""><span class="txt"><b>${tx(p.name)}</b><span>${tx(p.tag)}</span><span class="meta">${SL().chs(p.chapters.length)}${s3 ? ` · <i>${"★".repeat(s3)}<em>${"★".repeat(3 - s3)}</em></i>` : ""}<span class="go3">${s3 ? SL().done + " ✓" : seq ? "🔒 " + SL().prevFirst : lk ? "🔒 " + SL().needQs(need - qc) : SL().play + " ▶"}</span></span></span></button>` }).join("");
  PK.querySelector(".sub").textContent = tx(m.story.intro || "");
  PK.classList.add("on");
  PK.querySelector("#pkBack").onclick = () => { PK.classList.remove("on"); showMap() };
  PK.querySelectorAll(".pc").forEach(b => b.onclick = () => { if (+b.dataset.seq) return card.show("🔒", SL().prevFirstL, "OK", () => {}); if (+b.dataset.need) return card.show("📝 " + SL().quizT, SL().needQ(+b.dataset.need), SL().toQuiz, toQuiz); PK.classList.remove("on"); const p = m.story.paths.find(p => p.id === b.dataset.p); STY = { m, p, ch: -1, q: JSON.parse(JSON.stringify(p.chapters)), started: false }; storyNext() }) }
function chapterBanner(c, k) { if (!c.title) return; const el = document.createElement("div"); el.className = "chb"; el.innerHTML = `<small>${SL().ch} ${k + 1}</small>`; el.append(tx(c.title)); document.body.appendChild(el);
  el.animate([{ opacity: 0, transform: "translate(-50%,-30%)" }, { opacity: 1, transform: "translate(-50%,-50%)", offset: .2 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 2200 }).onfinish = () => el.remove() }
function storyNext() {
  const S2 = STY; if (!S2) return; const prev = S2.cur;
  if (prev && prev.after && !S2.afterDone) { S2.afterDone = true; return talk(prev.after, storyNext) }
  S2.afterDone = false;
  if (!S2.q.length) { prog.done[S2.m.id] = prog.done[S2.m.id] || { at: Date.now() }; saveProg(); return FX.end(tx(S2.p.outro), () => storyPick(S2.m)) }
  const c = S2.cur = S2.q.shift(); if (!c.sub) S2.ch++;
  if (c.choose) return talk(c.talk, () => chooseMenu(c, S2));
  if (c.game && MINI_TYPES.includes(c.game.type)) { chapterBanner(c, S2.ch); return setTimeout(() => talk(c.talk, () => runMini(c.game, storyNext)), c.title ? 1500 : 0) }
  if (c.game) {
    const g = Object.assign({ q: [], every: 99, scene: S2.m.scene }, c.game, { id: S2.m.id, title: c.title });
    if ((g.type === "explore" || g.type === "herd") && !g.player && !S2.p.who.includes("/")) g.player = { sprite: S2.p.who, h: 3.2 };
    launch(g, S2.m.id, { keep: S2.started, ready: () => { S2.started = true; chapterBanner(c, S2.ch); setTimeout(() => talk(c.talk, () => { if (g.type === "run") $("hint").style.opacity = 1, setTimeout(() => $("hint").style.opacity = 0, 3500); paused = false; last = performance.now() }), 1500) } })
  } else { if (c.title) chapterBanner(c, S2.ch); setTimeout(() => talk(c.talk, storyNext), c.title ? 1500 : 0) } }
/* a menu of options: "one" = pick one branch; "all" = do every branch, in the order you choose */
const CM = document.createElement("div"); CM.id = "chooseM"; document.body.appendChild(CM);
function chooseMenu(c, S2) { const ch = c.choose, done = c._done || (c._done = []);
  CM.innerHTML = `<div class="in"><h3>${tx(ch.title) || SL().what}</h3>${ch.text ? `<p>${tx(ch.text)}</p>` : ""}${ch.options.map((o, k) => `<button class="op${done.includes(k) ? " dn" : ""}" data-k="${k}"><span class="em">${o.e || "▶"}</span><span><b>${tx(o.label)}</b>${o.sub ? `<span>${tx(o.sub)}</span>` : ""}</span>${o.fmt ? `<span class="fm">${FMT[o.fmt] || o.fmt}</span>` : ""}</button>`).join("")}</div>`;
  CM.classList.add("on"); document.body.classList.add("talking");
  CM.querySelectorAll(".op").forEach(b => b.onclick = () => { const k = +b.dataset.k, o = ch.options[k]; CM.classList.remove("on"); document.body.classList.remove("talking"); if (o.middah) FX.middah(o.middah);
    const subs = (o.chapters || []).map(x => Object.assign({}, x, { sub: true }));
    if (ch.mode === "all") { done.push(k); if (done.length < ch.options.length) subs.push(Object.assign({}, c, { sub: true, talk: null })) }
    S2.q.unshift(...subs); storyNext() }) }
/* pick game: story items pop up around the scene — tap them before they fade (style "pop"),
   or drag a basket to catch them as they fall (style "catch"). Goal: n items before the time runs out. */
const PG = document.createElement("div"); PG.id = "pickG"; document.body.appendChild(PG);
function pickGame(c, text, cb) { paused = true; document.body.classList.add("talking"); const n = c.n || 8, catchS = true, T0 = c.time || Math.round(n * (catchS ? 2.6 : 2.2) + 8), spr = k => { const a = c.sprites || [c.sprite || "scenery/star"]; const x = a[k % a.length]; return x.includes("/") ? x : "chars/" + x };
  let got = 0, k = 0, t = T0, live = [], raf3 = 0, last3 = performance.now(), spawnT = 0, bx = .5, over = false, miss = 0;
  PG.innerHTML = `<div class="pg-top"><b>${tx(text) || ""}</b><div class="pg-row"><span class="pg-cnt">0/${n}</span><div class="pg-time"><i></i></div></div></div><div class="pg-field"></div>${catchS ? `<img class="pg-basket" src="scenery/baskets.png" alt="">` : ""}<div class="pg-hint">${catchS ? SL().dragB : SL().tapIt}</div>`;
  PG.classList.add("on"); const F = PG.querySelector(".pg-field"), C = PG.querySelector(".pg-cnt"), TB = PG.querySelector(".pg-time i"), BK = PG.querySelector(".pg-basket");
  setTimeout(() => { const h = PG.querySelector(".pg-hint"); h && (h.style.opacity = 0) }, 2600);
  const W = () => F.clientWidth, H = () => F.clientHeight;
  function spawn() { const el = document.createElement("img"); el.src = spr(k++) + ".png"; el.className = "pg-it"; const sz = c.size || 64; el.style.width = sz + "px";
    const o = { el, born: performance.now(), x: 30 + Math.random() * (W() - 60 - sz), y: catchS ? -sz : 40 + Math.random() * (H() - 140 - sz), vy: catchS ? 120 + Math.random() * 80 + got * 6 : 0, life: (c.life || 2.6) * 1000 };
    el.style.left = o.x + "px"; el.style.top = o.y + "px"; F.appendChild(el); live.push(o);
    if (!catchS) el.addEventListener("pointerdown", e => { e.preventDefault(); take(o) }) }
  function take(o) { if (o.done || over) return; o.done = true; got++; C.textContent = got + "/" + n; const r = o.el.getBoundingClientRect(); FX.add("items", 20, [r.left + r.width / 2, r.top], { combo: true });
    const cr = C.getBoundingClientRect(); o.el.animate([{ transform: "scale(1.2)" }, { transform: `translate(${cr.left - r.left}px,${cr.top - r.top}px) scale(.3)`, opacity: .3 }], { duration: 420, easing: "ease-in" }).onfinish = () => o.el.remove();
    C.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 300 });
    if (got >= n) end(true) }
  function end(win) { over = true; cancelAnimationFrame(raf3); live.forEach(o => !o.done && o.el.remove());
    if (win) { FX.perf(T0 * .6, T0 - t + miss * .5); setTimeout(() => { PG.classList.remove("on"); document.body.classList.remove("talking"); FX.banner("✨ " + got + "/" + n, ""); FX.confetti(); setTimeout(cb, 700) }, 450) }
    else { FX.wrong(); PG.classList.remove("on"); card.show(SL().tooSlow, SL().gotOf(got, n), SL().again, () => pickGame(c, text, cb)) } }
  if (catchS) { const mv = e => { const r = F.getBoundingClientRect(); bx = Math.max(.08, Math.min(.92, (e.clientX - r.left) / r.width)) }; PG.onpointermove = mv; PG.onpointerdown = mv;
    PG._key = e => { if (e.key === "ArrowLeft") bx = Math.max(.08, bx - .08); if (e.key === "ArrowRight") bx = Math.min(.92, bx + .08) }; addEventListener("keydown", PG._key) }
  (function loop(now) { const dt = Math.min(.05, (now - last3) / 1000); last3 = now; if (over) return; t -= dt; TB.style.width = Math.max(0, t / T0 * 100) + "%"; if (t <= 0) return end(false);
    spawnT -= dt; const active = live.filter(o => !o.done && !o.gone).length; if (spawnT <= 0 && active < (c.wave || (catchS ? 3 : 4))) { spawn(); spawnT = catchS ? .55 : .35 }
    if (BK) BK.style.left = bx * 100 + "%";
    for (const o of live) { if (o.done || o.gone) continue; const age = now - o.born;
      if (catchS) { o.y += o.vy * dt; o.el.style.top = o.y + "px"; const br = BK.getBoundingClientRect(), r = o.el.getBoundingClientRect();
        if (r.bottom > br.top + 10 && r.top < br.bottom && r.right > br.left + 8 && r.left < br.right - 8) take(o); else if (o.y > H()) { o.gone = true; miss++; o.el.remove() } }
      else { const f = age / o.life; o.el.style.transform = `scale(${Math.min(1, age / 180)})`; o.el.style.opacity = f > .75 ? (Math.sin(age / 40) > 0 ? 1 : .35) : 1; if (age > o.life) { o.gone = true; o.el.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.4)" }], { duration: 250 }).onfinish = () => o.el.remove() } } }
    live = live.filter(o => !(o.gone && !o.el.isConnected) && !(o.done && !o.el.isConnected)); raf3 = requestAnimationFrame(loop) })(last3);
  const cleanup = () => { if (PG._key) removeEventListener("keydown", PG._key); PG._key = null }; const _cb = cb; cb = () => { cleanup(); _cb() } }
/* run any mini-game type (tap, catch, or one of minis.js) as an overlay; cb when won */
const MINI_TYPES = ["tap", "catch"].concat(window.MINI ? window.MINI.TYPES : []);
function runMini(g, cb, text) { paused = true; document.body.classList.add("talking"); const fin = () => { document.body.classList.remove("talking"); cb() };
  if (g.type === "tap") return tapGame(Object.assign({ text }, g), fin);
  if (g.type === "catch") return pickGame(Object.assign({ style: "catch" }, g), g.text || text, fin);
  window.MINI.run(g.type, Object.assign({ text }, g), { tx, lang, FX,
    done(perf) { FX.perf(perf, 1); FX.banner("✨ " + (tx(g.done) || u().complete), ""); FX.confetti(); setTimeout(fin, 900) },
    fail(msg) { card.show("🔁", msg || "", SL().again, () => runMini(g, cb, text)) } }) }
/* timing mini-game: stop the marker inside the green zone n times */
const TG = document.createElement("div"); TG.id = "tapG"; document.body.appendChild(TG);
function tapGame(g, cb) { paused = true; document.body.classList.add("talking"); let hits = 0, miss = 0, pos = 0, dir = 1, raf2 = 0, zw = Math.max(.3, g.zone || .3), z0 = .1 + Math.random() * (.8 - zw), sp = Math.min(.65, (g.speed || .6) * .65), t0 = performance.now();
  TG.innerHTML = `${g.img ? `<img src="${g.img.includes("/") ? g.img : "chars/" + g.img}.png" alt="">` : ""}<div class="card2"><b>${tx(g.text)}</b><small>${tx(g.hint) || ""}</small><div class="bar"><div class="zone"></div><div class="mk"></div></div><div class="dots">${"<i></i>".repeat(g.n || 3)}</div><button class="tb">${SL().tapGo}</button></div>`;
  TG.classList.add("on"); TG.classList.toggle("night", !!g.night); const Z = TG.querySelector(".zone"), K2 = TG.querySelector(".mk"), IM = TG.querySelector("img"); const place = () => { Z.style.left = z0 * 100 + "%"; Z.style.width = zw * 100 + "%" }; place();
  let lt = performance.now(); (function anim(now) { const dt = Math.min(.05, (now - lt) / 1000); lt = now; pos += dir * dt * sp; if (pos > 1) { pos = 1; dir = -1 } if (pos < 0) { pos = 0; dir = 1 } K2.style.left = pos * 100 + "%"; raf2 = requestAnimationFrame(anim) })(lt);
  let fin = false; TG.querySelector(".tb").onclick = () => { if (fin) return; const r = TG.querySelector(".bar").getBoundingClientRect();
    if (pos >= z0 && pos <= z0 + zw) { TG.querySelectorAll(".dots i")[hits].classList.add("ok"); hits++; FX.add("items", 30, [r.left + pos * r.width, TG.querySelector(".card2").getBoundingClientRect().top - 28], { combo: true }); if (IM) IM.animate([{ transform: "scale(1)" }, { transform: "scale(1.12) rotate(-3deg)" }, { transform: "scale(1)" }], { duration: 300 });
      zw = Math.max(.24, zw * .95); sp *= 1.05; z0 = .05 + Math.random() * (.9 - zw); place();
      if (hits >= (g.n || 3)) { fin = true; cancelAnimationFrame(raf2); FX.perf(1, 1 + miss * .3); setTimeout(() => { TG.classList.remove("on"); document.body.classList.remove("talking"); FX.banner("✨ " + (tx(g.done) || "✓"), ""); FX.confetti(); setTimeout(cb, 900) }, 400) } }
    else { miss++; FX.wrong(); if (miss % 2 === 0) { zw = Math.min(.5, zw * 1.25); sp *= .85; z0 = Math.max(.02, Math.min(.98 - zw, z0 - .03)); place() } TG.querySelector(".bar").animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], { duration: 250 }) } } }
window.__G = { get MS() { return MS }, get STY() { return STY }, X, Hd, R, B, stepTarget, get prog() { return prog } };   /* for automated tests */
const startId = QS.get("m") || HS.get("m");
showMap().then(() => { if (startId) start(startId) });
})();
