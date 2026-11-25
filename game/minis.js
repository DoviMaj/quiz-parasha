/* Mini-games: reusable 2D game types that run as an overlay above the paused 3D world.
   Each game is MINI[type](cfg, ctx). ctx = { tx, lang, FX, done(perf 0..1), fail(message) }.
   Types: rhythm, steer, sort, hidden, pour, stack, path, memory, sneak, maze, sticker   (catch and tap live in game.js) */
(function () {
  const MINI = window.MINI = {};
  const STR = {
    en: { rhythm: "Tap when the drum reaches the ring!", steer: "Drag left and right to steer.", sort: "Drag each one to the right group.", hidden: "Find them in the picture!", pour: "Hold to pour — stop at the line!", stack: "Tap to drop. Line them up!", path: "Draw the way from start to finish.", memory: "Find the matching pairs.", sneak: "Move without being seen — hide in the reeds!", maze: "Find the way through. Swipe or use the arrows.", sticker: "Drag the right sticker to its place.", hits: "hits", tryAgain: "Try again!", caught: "Seen! Back to the start.", spill: "Too much! Try again.", fell: "It fell!", lost: "Watch out!", perfect: "Perfect!", good: "Good", pairs: "pairs", left: "left" },
    es: { rhythm: "¡Toca cuando el tambor llegue al aro!", steer: "Arrastra a la izquierda y a la derecha para guiar.", sort: "Arrastra cada uno a su grupo.", hidden: "¡Encuéntralos en el dibujo!", pour: "Mantén presionado para verter: ¡detente en la línea!", stack: "Toca para soltar. ¡Alinéalos!", path: "Dibuja el camino del inicio a la meta.", memory: "Encuentra los pares iguales.", sneak: "Avanza sin que te vean: ¡escóndete en los juncos!", maze: "Encuentra el camino. Desliza o usa las flechas.", sticker: "Arrastra la figura correcta a su lugar.", hits: "aciertos", tryAgain: "¡Inténtalo otra vez!", caught: "¡Te vieron! Vuelve al inicio.", spill: "¡Demasiado! Inténtalo otra vez.", fell: "¡Se cayó!", lost: "¡Cuidado!", perfect: "¡Perfecto!", good: "Bien", pairs: "pares", left: "faltan" },
    he: { rhythm: "הקישו כשהתוף מגיע לטבעת!", steer: "גררו ימינה ושמאלה כדי לנווט.", sort: "גררו כל אחד לקבוצה הנכונה.", hidden: "מצאו אותם בתמונה!", pour: "החזיקו כדי למזוג — עצרו בקו!", stack: "הקישו כדי להפיל. סדרו בשורה!", path: "ציירו את הדרך מההתחלה עד הסוף.", memory: "מצאו את הזוגות.", sneak: "התקדמו בלי שיראו אתכם — התחבאו בסוף!", maze: "מצאו את הדרך. החליקו או השתמשו בחצים.", sticker: "גררו את המדבקה הנכונה למקומה.", hits: "פגיעות", tryAgain: "נסו שוב!", caught: "ראו אתכם! חזרה להתחלה.", spill: "יותר מדי! נסו שוב.", fell: "זה נפל!", lost: "זהירות!", perfect: "מושלם!", good: "טוב", pairs: "זוגות", left: "נותרו" } };
  let C = null; const T = () => STR[C.lang] || STR.en;
  const url = k => (k.includes("/") ? k : "chars/" + k) + ".png";
  const IMC = {}; const im = k => { if (!IMC[k]) { const i = new Image(); i.src = url(k); IMC[k] = i } return IMC[k] };
  const rnd = (a, b) => a + Math.random() * (b - a), shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]] } return a };
  const css = document.createElement("style"); css.textContent = `
.mg{position:fixed;inset:0;z-index:22;display:flex;flex-direction:column;background:linear-gradient(rgba(30,20,10,.45),rgba(30,20,10,.25));touch-action:none;user-select:none;-webkit-user-select:none}
.mg-top{margin:max(10px,env(safe-area-inset-top)) 10px 0;background:var(--surface,#fffcf6);border-radius:18px;padding:10px 14px;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.mg-top b{display:block;font-size:15px;line-height:1.3}.mg-top b b{display:inline}
.mg-row{display:flex;align-items:center;gap:10px;margin-top:6px}.mg-prog{font-weight:900;font-size:16px;color:#2c5a8a;min-width:54px;white-space:nowrap}
.mg-time{flex:1;height:10px;border-radius:999px;background:#e7dfcf;overflow:hidden;direction:ltr;visibility:hidden}.mg-time i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#2c5a8a,#e0a000);border-radius:999px}
.mg-stage{position:relative;flex:1;margin:8px 10px max(10px,env(safe-area-inset-bottom));border-radius:18px;overflow:hidden;background:linear-gradient(#cfe6f2,#f3e6c8 60%,#d9c08f)}
.mg-stage canvas{position:absolute;inset:0;width:100%;height:100%}
.mg-hint{position:absolute;z-index:6;left:50%;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 18px);transform:translateX(-50%);background:rgba(46,42,36,.88);color:#fff;border-radius:999px;padding:8px 16px;font-weight:700;font-size:14px;transition:opacity .6s;pointer-events:none;max-width:88vw;text-align:center}
.mg-btn{all:unset;cursor:pointer;position:absolute;left:12px;right:12px;bottom:12px;background:#2c5a8a;color:#fff;font-weight:900;font-size:18px;border-radius:16px;padding:14px;text-align:center;box-shadow:0 3px 0 #1f4269}
.mg-btn:active{transform:translateY(2px);box-shadow:none}
.mg-item{position:absolute;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.3));cursor:pointer;transition:transform .15s}
.mg-bins{position:absolute;left:8px;right:8px;bottom:8px;display:flex;gap:8px}
.mg-bin{flex:1;min-height:96px;border:3px dashed #8a7b62;border-radius:16px;background:rgba(255,255,255,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-weight:800;font-size:14px;text-align:center;padding:6px}
.mg-bin img{height:46px}.mg-bin.hot{background:#eef3e6;border-color:#4f6b3a}
.mg-card{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);width:150px;height:150px;border-radius:22px;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none}
.mg-card img{max-width:120px;max-height:120px;pointer-events:none}
.mark-spots,.mark-speckles,.mark-stripes{position:absolute;inset:18px;border-radius:40%;pointer-events:none;mix-blend-mode:multiply;opacity:.75}
.mark-spots{background:radial-gradient(circle at 30% 40%,#4a3a2a 0 9px,transparent 10px),radial-gradient(circle at 62% 55%,#4a3a2a 0 11px,transparent 12px),radial-gradient(circle at 45% 70%,#4a3a2a 0 8px,transparent 9px)}
.mark-speckles{background-image:radial-gradient(#4a3a2a 0 2.5px,transparent 3px);background-size:13px 13px}
.mark-stripes{background:repeating-linear-gradient(115deg,#4a3a2a 0 4px,transparent 4px 13px)}
.mg-grid{position:absolute;inset:10px;display:grid;gap:8px}
.mg-mem{border-radius:14px;background:linear-gradient(135deg,#2c5a8a,#e0a000);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.2);transition:transform .25s;font-size:26px;color:#fff}
.mg-mem img{max-width:78%;max-height:78%;display:none}.mg-mem.up{background:#fff}.mg-mem.up img{display:block}.mg-mem.ok{background:#eef3e6;outline:3px solid #4f6b3a}
.mg-tray{position:absolute;left:0;right:0;bottom:0;height:88px;background:rgba(255,255,255,.7);display:flex;gap:6px;align-items:center;justify-content:center;padding:6px;overflow-x:auto}
.mg-tray img{height:70px;touch-action:none;cursor:grab;filter:drop-shadow(0 3px 4px rgba(0,0,0,.3))}
.mg-ghost{position:absolute;border:3px dashed #fff;border-radius:16px;background:rgba(255,255,255,.25);transform:translate(-50%,-100%);animation:mgpulse 1s infinite alternate}
@keyframes mgpulse{to{background:rgba(255,215,90,.45)}}
.mg-cap{position:absolute;left:10px;right:10px;top:10px;background:rgba(253,246,234,.95);border-radius:14px;padding:8px 12px;font-weight:800;font-size:14.5px;text-align:center}
.mg-find{display:flex;gap:6px;margin-top:6px}.mg-find img{height:30px;opacity:.55;filter:grayscale(1)}.mg-find img.ok{opacity:1;filter:none}
.mg-dpad{position:absolute;right:10px;bottom:10px;display:grid;grid-template-columns:repeat(3,46px);grid-template-rows:repeat(3,46px);gap:4px}
.mg-dpad button{all:unset;cursor:pointer;background:rgba(253,246,234,.92);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;box-shadow:0 2px 0 rgba(0,0,0,.2)}`;
  document.head.appendChild(css);

  /* ---------- shared frame ---------- */
  function shell(cfg, kind) {
    const r = document.createElement("div"); r.className = "mg"; r.innerHTML = `<div class="mg-top"><b></b><div class="mg-row"><span class="mg-prog"></span><div class="mg-time"><i></i></div></div><div class="mg-extra"></div></div><div class="mg-stage"></div><div class="mg-hint"></div>`;
    r.querySelector(".mg-top > b").innerHTML = C.tx(cfg.text) || ""; r.querySelector(".mg-hint").textContent = C.tx(cfg.hint) || T()[kind];
    document.body.appendChild(r); setTimeout(() => { const h = r.querySelector(".mg-hint"); h && (h.style.opacity = 0) }, 3200);
    const st = r.querySelector(".mg-stage"), P = r.querySelector(".mg-prog"), TB = r.querySelector(".mg-time i");
    const o = { r, st, extra: r.querySelector(".mg-extra"), prog: t => P.textContent = t, time: f => { r.querySelector(".mg-time").style.visibility = "visible"; TB.style.width = Math.max(0, f * 100) + "%" }, stops: [], closed: false,
      close() { o.closed = true; o.stops.forEach(f => f()); r.remove() },
      win(perf) { if (o.closed) return; o.close(); C.done(perf) }, lose(msg) { if (o.closed) return; o.close(); C.fail(msg) },
      on(el, ev, f, opt) { el.addEventListener(ev, f, opt); o.stops.push(() => el.removeEventListener(ev, f, opt)) } };
    MINI._cur = o; return o }
  function canvas(o) { const c = document.createElement("canvas"); o.st.appendChild(c); const g = c.getContext("2d"); const d = Math.min(2, devicePixelRatio || 1);
    const fit = () => { c.width = o.st.clientWidth * d; c.height = o.st.clientHeight * d; g.setTransform(d, 0, 0, d, 0, 0) }; fit(); o.on(window, "resize", fit);
    return { c, g, W: () => o.st.clientWidth, H: () => o.st.clientHeight } }
  function loop(o, f) { let last = performance.now(), id = 0, run = true; const k = now => { if (!run) return; const dt = Math.min(.05, (now - last) / 1000); last = now; f(dt, now); id = requestAnimationFrame(k) }; id = requestAnimationFrame(k); o.stops.push(() => { run = false; cancelAnimationFrame(id) }) }
  function draw(g, k, cx, by, h, alpha = 1, flip = false) { const i = im(k); if (!i.complete || !i.naturalWidth) return 0; const w = h * i.naturalWidth / i.naturalHeight; g.save(); g.globalAlpha = alpha; if (flip) { g.translate(cx, 0); g.scale(-1, 1); g.drawImage(i, -w / 2, by - h, w, h) } else g.drawImage(i, cx - w / 2, by - h, w, h); g.restore(); return w }
  const pt = (o, e) => { const r = o.st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] };
  const keys = (o, f) => o.on(window, "keydown", f);
  const pop = (o, x, y, n) => { const r = o.st.getBoundingClientRect(); C.FX.add("items", n || 20, [r.left + x, r.top + y], { combo: true }) };

  /* 1. RHYTHM — drums travel to a ring; tap on the beat */
  MINI.rhythm = (cfg) => { const o = shell(cfg, "rhythm"), K = canvas(o), need = cfg.n || 8, bpm = cfg.bpm || 84, beat = 60 / bpm, pat = cfg.pattern || [1, 1, 1, .5, .5, 1, 1, 1, 1, .5, .5, 1];
    const total = need + (cfg.extra || 4); let t = -1.6, hits = 0, done = 0, notes = [], acc = 0, flash = 0, fx = "", fxT = 0;
    for (let i = 0, at = 0; i < total; i++) { notes.push({ at, hit: false, miss: false }); at += pat[i % pat.length] * beat * 1.2 }
    const btn = document.createElement("button"); btn.className = "mg-btn"; btn.textContent = "🥁"; o.st.appendChild(btn); o.prog(`0/${need}`);
    const tap = () => { let best = null, bd = 1; for (const n of notes) { if (n.hit || n.miss) continue; const d = Math.abs(n.at - t); if (d < bd) { bd = d; best = n } }
      if (best && bd < .26) { best.hit = true; hits++; o.prog(`${hits}/${need}`); fx = bd < .1 ? T().perfect : T().good; fxT = .6; flash = .25; pop(o, K.W() * .22, K.H() * .45, bd < .1 ? 30 : 20) } else { fx = "✗"; fxT = .4 } };
    o.on(btn, "pointerdown", e => { e.preventDefault(); tap() }); keys(o, e => { if (e.key === " " || e.key === "Enter") tap() });
    loop(o, dt => { t += dt; const g = K.g, W = K.W(), H = K.H(), y = H * .45, tx = W * .22, sp = W * .42;
      for (const n of notes) if (!n.hit && !n.miss && t - n.at > .3) { n.miss = true; acc++ }
      g.clearRect(0, 0, W, H); g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(0, y - 30, W, 60);
      draw(g, cfg.img || "miriam", W * .5, H - 84, Math.min(H * .38, 170), .9);
      g.lineWidth = 6; g.strokeStyle = flash > 0 ? "#e0a000" : "#5a4e3c"; g.beginPath(); g.arc(tx, y, 30 + flash * 30, 0, 7); g.stroke(); flash = Math.max(0, flash - dt);
      for (const n of notes) { if (n.hit || n.miss) continue; const x = tx + (n.at - t) * sp; if (x > W + 40) continue; g.fillStyle = "#2c5a8a"; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); g.fillStyle = "#f3dfb0"; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill() }
      if (fxT > 0) { fxT -= dt; g.fillStyle = "#2e2a24"; g.font = "900 22px system-ui"; g.textAlign = "center"; g.fillText(fx, tx, y - 46) }
      if (hits >= need) return o.win(Math.max(.4, 1 - acc * .06));
      if (notes.every(n => n.hit || n.miss)) o.lose(`${hits}/${need} ${T().hits}. ${T().tryAgain}`) }) };

  /* 2. STEER — guide a boat/rider down a stream of obstacles */
  MINI.steer = (cfg) => { const o = shell(cfg, "steer"), K = canvas(o), dur = cfg.time || 28, obs = cfg.obstacles || ["scenery/boulder", "scenery/rocks", "scenery/reeds"]; let t = 0, x = .5, tx = .5, lives = 3, inv = 0, items = [], sp = 0, wave = 0, got = 0;
    const mv = e => { tx = Math.max(.1, Math.min(.9, pt(o, e)[0] / K.W())) }; o.on(o.st, "pointermove", mv); o.on(o.st, "pointerdown", mv);
    keys(o, e => { if (e.key === "ArrowLeft") tx = Math.max(.1, tx - .15); if (e.key === "ArrowRight") tx = Math.min(.9, tx + .15) });
    loop(o, dt => { t += dt; inv = Math.max(0, inv - dt); wave += dt; const g = K.g, W = K.W(), H = K.H(), speed = 160 + t * 7; x += (tx - x) * Math.min(1, dt * 8); o.time(1 - t / dur); o.prog("❤".repeat(lives) + "♡".repeat(3 - lives));
      sp -= dt; if (sp <= 0) { sp = Math.max(.42, 1.05 - t * .02); items.push({ x: rnd(.1, .9), y: -60, k: cfg.pickup && Math.random() < .25 ? "p" : obs[Math.random() * obs.length | 0], h: rnd(46, 64) }) }
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, cfg.sky || "#3f7fbf"); bg.addColorStop(1, cfg.sea || "#2c5f94"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const yy = ((i * 90 + wave * 120) % (H + 90)) - 45; g.beginPath(); for (let xx = 0; xx <= W; xx += 20) g.lineTo(xx, yy + Math.sin(xx / 30 + i) * 6); g.stroke() }
      const px = x * W, py = H - 40, bh = cfg.size || 92;
      for (const it of items) { it.y += speed * dt; const ix = it.x * W; if (it.k === "p") draw(g, cfg.pickup, ix, it.y, 40); else draw(g, it.k, ix, it.y, it.h);
        if (!it.hit && Math.abs(ix - px) < (it.k === "p" ? 44 : 38) && Math.abs(it.y - 10 - (py - bh * .45)) < bh * .45) { it.hit = true; if (it.k === "p") { got++; pop(o, ix, it.y - 20, 15) } else if (inv <= 0) { lives--; inv = 1.2; C.FX.wrong() } } }
      items = items.filter(i => i.y < H + 80 && !(i.hit && i.k === "p"));
      if (!(inv > 0 && Math.sin(t * 30) > 0)) draw(g, cfg.img || "scenery/ark", px, py, bh, 1, tx < x - .01);
      if (lives <= 0) return o.lose(T().tryAgain); if (t >= dur) o.win(lives / 3) }) };

  /* 3. SORT — drag each item into its group */
  MINI.sort = (cfg) => { const o = shell(cfg, "sort"), items = shuffle(cfg.items), bins = cfg.bins; let i = 0, mist = 0;
    const B = document.createElement("div"); B.className = "mg-bins"; B.innerHTML = bins.map((b, k) => `<div class="mg-bin" data-k="${b.id}">${b.img ? `<img src="${url(b.img)}" alt="">` : ""}<span>${C.tx(b.label)}</span>${b.mark ? `<span class="mark-${b.mark}" style="position:relative;inset:auto;width:46px;height:20px;display:block;border-radius:8px"></span>` : ""}</div>`).join(""); o.st.appendChild(B);
    const card = document.createElement("div"); card.className = "mg-card"; o.st.appendChild(card);
    const show = () => { const it = items[i]; card.innerHTML = `<img src="${url(it.img)}" alt="">${it.mark ? `<span class="mark-${it.mark}"></span>` : ""}`; card.style.left = "50%"; card.style.top = "36%"; card.animate([{ transform: "translate(-50%,-50%) scale(.6)" }, { transform: "translate(-50%,-50%) scale(1)" }], { duration: 200 }); o.prog(`${i}/${items.length}`) };
    const drop = k => { const it = items[i]; if (k === it.bin) { const r = card.getBoundingClientRect(); C.FX.add("items", 20, [r.left + r.width / 2, r.top], { combo: true }); i++; if (i >= items.length) return o.win(Math.max(.3, 1 - mist * .12)); show() }
      else { mist++; C.FX.wrong(); card.animate([{ transform: "translate(-56%,-50%)" }, { transform: "translate(-44%,-50%)" }, { transform: "translate(-50%,-50%)" }], { duration: 260 }); card.style.left = "50%"; card.style.top = "36%" } };
    let drag = null; o.on(card, "pointerdown", e => { drag = pt(o, e); card.setPointerCapture(e.pointerId) });
    o.on(card, "pointermove", e => { if (!drag) return; const [x, y] = pt(o, e); card.style.left = x + "px"; card.style.top = y + "px"; B.querySelectorAll(".mg-bin").forEach(b => { const r = b.getBoundingClientRect(); b.classList.toggle("hot", e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 30) }) });
    o.on(card, "pointerup", e => { if (!drag) return; drag = null; let hit = null; B.querySelectorAll(".mg-bin").forEach(b => { const r = b.getBoundingClientRect(); if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 30) hit = b.dataset.k; b.classList.remove("hot") }); if (hit) drop(hit); else { card.style.left = "50%"; card.style.top = "36%" } });
    B.querySelectorAll(".mg-bin").forEach(b => o.on(b, "click", () => drop(b.dataset.k))); show() };

  /* 4. HIDDEN — find the hidden things among the scenery */
  MINI.hidden = (cfg) => { const o = shell(cfg, "hidden"), W = o.st.clientWidth, H = o.st.clientHeight, targets = cfg.targets, dec = cfg.decoys || ["scenery/bush", "scenery/rocks", "scenery/olive"], n = cfg.count || 16; let found = 0, mist = 0, t = cfg.time || 60;
    o.extra.innerHTML = `<div class="mg-find">${targets.map((k, j) => `<img data-j="${j}" src="${url(k)}" alt="">`).join("")}</div>`; o.prog(`0/${targets.length}`);
    const place = (k, z, h, tgt, j) => { const el = document.createElement("img"); el.className = "mg-item"; el.src = url(k); el.style.height = h + "px"; el.style.left = rnd(4, W - h - 4) + "px"; el.style.top = rnd(20, H - h - 10) + "px"; el.style.zIndex = z; o.st.appendChild(el);
      o.on(el, "pointerdown", e => { e.stopPropagation(); if (tgt) { if (el.dataset.f) return; el.dataset.f = 1; found++; o.prog(`${found}/${targets.length}`); o.extra.querySelector(`[data-j="${j}"]`).classList.add("ok"); const r = el.getBoundingClientRect(); C.FX.add("items", 30, [r.left + r.width / 2, r.top], { combo: true }); el.animate([{ transform: "scale(1)" }, { transform: "scale(1.5)" }, { transform: "scale(1)" }], { duration: 400 }); el.style.outline = "4px solid #e0a000"; el.style.borderRadius = "12px"; if (found >= targets.length) setTimeout(() => o.win(Math.max(.3, 1 - mist * .1)), 500) }
        else { mist++; el.animate([{ transform: "rotate(-6deg)" }, { transform: "rotate(6deg)" }, { transform: "none" }], { duration: 250 }) } }) };
    targets.forEach((k, j) => { place(k, 1, cfg.size || 54, true, j); const t0 = o.st.lastChild, tx = parseFloat(t0.style.left), ty = parseFloat(t0.style.top);
      [[-34, -10], [26, 8]].forEach(([dx, dy]) => { place(dec[(j + dx) & 3 % dec.length] || dec[0], 2, rnd(70, 95), false); const d = o.st.lastChild; d.style.left = Math.max(0, tx + dx) + "px"; d.style.top = Math.max(10, ty + dy) + "px" }) });
    for (let k = 0; k < n; k++) place(dec[k % dec.length], 2, rnd(70, 120), false);
    o.st.querySelectorAll(".mg-item").forEach(el => { if (el.style.zIndex === "2") el.style.opacity = .96 });
    loop(o, dt => { t -= dt; o.time(t / (cfg.time || 60)); if (t <= 0) o.lose(T().tryAgain) }) };

  /* 5. POUR — hold to pour into each vessel, stop between the lines */
  MINI.pour = (cfg) => { const o = shell(cfg, "pour"), K = canvas(o), n = cfg.n || 3, lo = cfg.lo || .7, hi = cfg.hi || .9; let cur = 0, fill = 0, pouring = false, mist = 0, settle = 0, flow = 0;
    const btn = document.createElement("button"); btn.className = "mg-btn"; btn.textContent = "💧"; o.st.appendChild(btn); o.prog(`0/${n}`);
    const dn = e => { e.preventDefault(); pouring = true }, up = () => { if (!pouring) return; pouring = false; settle = .35 };
    o.on(btn, "pointerdown", dn); o.on(window, "pointerup", up); keys(o, e => { if (e.key === " ") pouring = true }); o.on(window, "keyup", e => { if (e.key === " ") up() });
    loop(o, dt => { const g = K.g, W = K.W(), H = K.H(), vw = Math.min(90, (W - 40) / n - 14), base = H - 100, vh = Math.min(150, H * .32);
      if (pouring) { fill += dt * (cfg.rate || .38) * (1 + fill * .4); flow = Math.min(1, flow + dt * 5) } else flow = Math.max(0, flow - dt * 6);
      if (settle > 0) { settle -= dt; if (settle <= 0) { if (fill > 1) { mist++; C.FX.wrong(); fill = 0 } else if (fill >= lo && fill <= hi) { const x0 = 20 + cur * (vw + 14) + vw / 2; pop(o, x0, base - vh, fill > lo + (hi - lo) * .3 ? 30 : 20); cur++; fill = 0; o.prog(`${cur}/${n}`); if (cur >= n) return o.win(Math.max(.3, 1 - mist * .2)) } } }
      if (fill > 1.05 && pouring) { pouring = false; settle = .01 }
      g.clearRect(0, 0, W, H); const ox = (W - (n * (vw + 14) - 14)) / 2;
      for (let k = 0; k < n; k++) { const x0 = ox + k * (vw + 14), f = k < cur ? (lo + hi) / 2 : k === cur ? fill : 0;
        g.fillStyle = "rgba(255,255,255,.6)"; g.strokeStyle = "#6b4a2a"; g.lineWidth = 4; g.beginPath(); g.roundRect(x0, base - vh, vw, vh, [4, 4, 14, 14]); g.fill(); g.stroke();
        g.fillStyle = cfg.liquid || "rgba(63,127,191,.85)"; const fh = Math.min(1.08, f) * vh; g.fillRect(x0 + 4, base - fh, vw - 8, fh - 4);
        g.fillStyle = "rgba(79,107,58,.25)"; g.fillRect(x0, base - vh * hi, vw, vh * (hi - lo)); g.strokeStyle = "#4f6b3a"; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(x0 - 4, base - vh * lo); g.lineTo(x0 + vw + 4, base - vh * lo); g.moveTo(x0 - 4, base - vh * hi); g.lineTo(x0 + vw + 4, base - vh * hi); g.stroke(); g.setLineDash([]);
        if (k === cur) { const jx = x0 + vw / 2 + 20, jy = base - vh - 40; draw(g, cfg.img || "scenery/jars", jx + 10, jy, 70, 1); if (flow > 0) { g.strokeStyle = cfg.liquid || "rgba(63,127,191,.85)"; g.lineWidth = 6 * flow; g.beginPath(); g.moveTo(jx - 16, jy - 40); g.quadraticCurveTo(jx - 22, jy, x0 + vw / 2, base - Math.min(1, fill) * vh); g.stroke() } } } }) };

  /* 6. STACK — drop swinging blocks to build straight up */
  MINI.stack = (cfg) => { const o = shell(cfg, "stack"), K = canvas(o), need = cfg.n || 8; let blocks = [], cur = null, dir = 1, cam = 0, fallB = null, mist = 0;
    const bh = 30, colors = cfg.colors || ["#b98a5a", "#a8794b", "#c79b68"]; o.prog(`0/${need}`);
    const start = () => { const W = K.W(); blocks = [{ x: W / 2 - W * .22, w: W * .44 }]; spawn() };
    const spawn = () => { const W = K.W(), top = blocks[blocks.length - 1]; cur = { x: dir > 0 ? -top.w : W, w: top.w } };
    const drop = () => { if (!cur) return; const top = blocks[blocks.length - 1], l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
      if (r - l <= 6) { C.FX.wrong(); fallB = { ...cur, y: 0, vy: 0 }; cur = null; mist++; return setTimeout(() => o.lose(T().fell + " " + T().tryAgain), 700) }
      let nb = { x: l, w: r - l }; if (Math.abs(cur.x - top.x) < 6) { nb = { x: top.x, w: top.w }; C.FX.banner(T().perfect, "") } blocks.push(nb); dir = -dir; cur = null; o.prog(`${blocks.length - 1}/${need}`);
      const r2 = o.st.getBoundingClientRect(); C.FX.add("items", 20, [r2.left + nb.x + nb.w / 2, r2.top + K.H() * .5], { combo: true });
      if (blocks.length - 1 >= need) return setTimeout(() => o.win(Math.max(.4, blocks[blocks.length - 1].w / blocks[0].w)), 400); spawn() };
    o.on(o.st, "pointerdown", e => { e.preventDefault(); drop() }); keys(o, e => { if (e.key === " ") drop() });
    setTimeout(start, 50);
    loop(o, (dt, now) => { if (!blocks.length) return; const g = K.g, W = K.W(), H = K.H(), base = H - 40, spd = 150 + blocks.length * 12;
      if (cur) { cur.x += dir * spd * dt; if (cur.x > W - cur.w + 30) dir = -1; if (cur.x < -30) dir = 1 }
      const want = Math.max(0, blocks.length * bh - H * .55); cam += (want - cam) * Math.min(1, dt * 4);
      g.clearRect(0, 0, W, H); g.fillStyle = cfg.ground || "#d9c08f"; g.fillRect(0, base + cam, W, 60);
      const brick = (b, y, k) => { g.fillStyle = colors[k % colors.length]; g.strokeStyle = "#6b4a2a"; g.lineWidth = 2; g.beginPath(); g.roundRect(b.x, y, b.w, bh - 2, 5); g.fill(); g.stroke(); g.strokeStyle = "rgba(107,74,42,.35)"; for (let xx = b.x + 24; xx < b.x + b.w - 8; xx += 30) { g.beginPath(); g.moveTo(xx, y + 4); g.lineTo(xx, y + bh - 6); g.stroke() } };
      blocks.forEach((b, k) => brick(b, base - (k + 1) * bh + cam, k));
      if (cur) brick(cur, base - (blocks.length + 1) * bh + cam - 10, blocks.length);
      if (fallB) { fallB.vy += 900 * dt; fallB.y += fallB.vy * dt; brick(fallB, base - (blocks.length + 1) * bh + cam + fallB.y, 1) } }) };

  /* 7. PATH — draw a route from start to goal around obstacles */
  MINI.path = (cfg) => { const o = shell(cfg, "path"), K = canvas(o); let pts = [], drawing = false, walk = -1, tries = 0, obs = [];
    const S = () => [K.W() * .15, K.H() * .88], G = () => [K.W() * .85, K.H() * .14];
    const build = () => { const W = K.W(), H = K.H(); obs = []; const n = cfg.count || 7; let k = 0; while (obs.length < n && k++ < 400) { const p = { x: rnd(.08, .92) * W, y: rnd(.22, .78) * H, r: rnd(22, 34), k: (cfg.obstacles || ["scenery/boulder"])[obs.length % (cfg.obstacles || [1]).length] };
      const [sx, sy] = S(), [gx, gy] = G(); if (Math.hypot(p.x - sx, p.y - sy) < 80 || Math.hypot(p.x - gx, p.y - gy) < 80 || obs.some(q => Math.hypot(q.x - p.x, q.y - p.y) < q.r + p.r + 30)) continue; obs.push(p) } };
    setTimeout(build, 30);
    const hitObs = (x, y) => obs.some(p => Math.hypot(p.x - x, p.y - y) < p.r) || (cfg.walls && (x < K.W() * cfg.walls || x > K.W() * (1 - cfg.walls)));
    o.on(o.st, "pointerdown", e => { if (walk >= 0) return; const [x, y] = pt(o, e), [sx, sy] = S(); if (Math.hypot(x - sx, y - sy) < 60) { drawing = true; pts = [[sx, sy]] } });
    o.on(o.st, "pointermove", e => { if (!drawing) return; const [x, y] = pt(o, e), l = pts[pts.length - 1]; if (Math.hypot(x - l[0], y - l[1]) < 6) return; pts.push([x, y]);
      if (hitObs(x, y)) { drawing = false; tries++; C.FX.wrong(); o.st.animate([{ transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "none" }], { duration: 200 }); setTimeout(() => pts = [], 350); return }
      const [gx, gy] = G(); if (Math.hypot(x - gx, y - gy) < 40) { drawing = false; walk = 0 } });
    o.on(window, "pointerup", () => { if (drawing) { drawing = false; pts = [] } });
    loop(o, dt => { const g = K.g, W = K.W(), H = K.H(); g.clearRect(0, 0, W, H);
      if (cfg.walls) { g.fillStyle = "rgba(44,95,148,.85)"; g.fillRect(0, 0, W * cfg.walls, H); g.fillRect(W * (1 - cfg.walls), 0, W * cfg.walls, H); g.fillStyle = "rgba(255,255,255,.25)"; for (let y = 0; y < H; y += 26) { g.fillRect(W * cfg.walls - 6, y, 6, 14); g.fillRect(W * (1 - cfg.walls), y + 13, 6, 14) } }
      for (const p of obs) draw(g, p.k, p.x, p.y + p.r, p.r * 2.2);
      const [sx, sy] = S(), [gx, gy] = G(); g.fillStyle = "#4f6b3a"; g.beginPath(); g.arc(sx, sy, 14, 0, 7); g.fill(); draw(g, cfg.goal || "scenery/oasis", gx, gy + 34, 70);
      if (pts.length > 1) { g.strokeStyle = "#2c5a8a"; g.lineWidth = 7; g.lineCap = g.lineJoin = "round"; g.setLineDash([2, 12]); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.setLineDash([]) }
      let wx = sx, wy = sy; if (walk >= 0) { walk += dt * 90; let d = walk, i = 1; for (; i < pts.length; i++) { const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= s) { const f = d / s; wx = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f; wy = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f; break } d -= s }
        if (i >= pts.length) return o.win(Math.max(.4, 1 - tries * .15)) }
      draw(g, cfg.walker || "bnei_yisrael", wx, wy + 8, 56) }) };

  /* 8. MEMORY — match pairs */
  MINI.memory = (cfg) => { const o = shell(cfg, "memory"), cards = shuffle([...cfg.cards, ...cfg.cards]), n = cfg.cards.length; let open = [], pairs = 0, moves = 0, lock = false;
    const cols = cards.length > 12 ? 4 : cards.length > 8 ? 4 : 3, G = document.createElement("div"); G.className = "mg-grid"; G.style.gridTemplateColumns = `repeat(${cols},1fr)`; G.style.gridTemplateRows = `repeat(${Math.ceil(cards.length / cols)},1fr)`;
    G.innerHTML = cards.map((k, i) => `<div class="mg-mem" data-i="${i}"><span>?</span><img src="${url(k)}" alt=""></div>`).join(""); o.st.appendChild(G); o.prog(`0/${n} ${T().pairs}`);
    G.querySelectorAll(".mg-mem").forEach(el => o.on(el, "click", () => { if (lock || el.classList.contains("up")) return; el.classList.add("up"); el.querySelector("span").style.display = "none"; open.push(el);
      if (open.length === 2) { moves++; const [a, b] = open; if (cards[+a.dataset.i] === cards[+b.dataset.i]) { a.classList.add("ok"); b.classList.add("ok"); pairs++; open = []; o.prog(`${pairs}/${n} ${T().pairs}`); const r = b.getBoundingClientRect(); C.FX.add("items", 25, [r.left + r.width / 2, r.top], { combo: true }); if (pairs >= n) setTimeout(() => o.win(Math.min(1, n / moves + .25)), 500) }
        else { lock = true; setTimeout(() => { [a, b].forEach(x => { x.classList.remove("up"); x.querySelector("span").style.display = "" }); open = []; lock = false }, 750) } } })) };

  /* 9. SNEAK — cross the field past patrolling guards, hide in the reeds */
  MINI.sneak = (cfg) => { const o = shell(cfg, "sneak"), K = canvas(o); let P = null, tgt = null, guards = [], hides = [], t = 0, caught = 0, flash = 0;
    const init = () => { const W = K.W(), H = K.H(); P = { x: W * .5, y: H - 40 }; tgt = null; const gn = cfg.guards || 3; guards = []; for (let i = 0; i < gn; i++) guards.push({ y: H * (.25 + i * .5 / Math.max(1, gn - 1)), x: rnd(.2, .8) * W, d: Math.random() < .5 ? -1 : 1, sp: rnd(45, 75) });
      hides = []; for (let i = 0; i < (cfg.hides || 5); i++) hides.push({ x: rnd(.12, .88) * W, y: H * (.18 + i * .62 / Math.max(1, (cfg.hides || 5) - 1)) + rnd(-12, 12), r: 32 }) };
    setTimeout(init, 30);
    const mv = e => { const [x, y] = pt(o, e); tgt = { x, y } }; o.on(o.st, "pointerdown", mv); o.on(o.st, "pointermove", e => { if (e.buttons || e.pointerType === "touch") mv(e) }); o.on(window, "pointerup", () => tgt = null);
    const kd = {}; keys(o, e => kd[e.key] = 1); o.on(window, "keyup", e => kd[e.key] = 0);
    loop(o, dt => { if (!P) return; t += dt; const g = K.g, W = K.W(), H = K.H(), sp = 95; let vx = 0, vy = 0;
      if (tgt) { const dx = tgt.x - P.x, dy = tgt.y - P.y, d = Math.hypot(dx, dy); if (d > 6) { vx = dx / d; vy = dy / d } } if (kd.ArrowLeft) vx = -1; if (kd.ArrowRight) vx = 1; if (kd.ArrowUp) vy = -1; if (kd.ArrowDown) vy = 1;
      P.x = Math.max(16, Math.min(W - 16, P.x + vx * sp * dt)); P.y = Math.max(20, Math.min(H - 20, P.y + vy * sp * dt));
      const hidden = hides.some(h => Math.hypot(h.x - P.x, h.y - P.y) < h.r);
      g.clearRect(0, 0, W, H); g.fillStyle = "rgba(63,127,191,.55)"; g.fillRect(0, 0, W, 46); draw(g, cfg.goal || "scenery/reeds", W * .5, 48, 46);
      for (const gd of guards) { gd.x += gd.d * gd.sp * dt; if (gd.x < 30 || gd.x > W - 30) gd.d = -gd.d; const a0 = gd.d > 0 ? 0 : Math.PI, L = cfg.view || 120;
        g.fillStyle = "rgba(255,220,90,.28)"; g.beginPath(); g.moveTo(gd.x, gd.y); g.arc(gd.x, gd.y, L, a0 - .45, a0 + .45); g.closePath(); g.fill();
        const dx = P.x - gd.x, dy = P.y - gd.y, d = Math.hypot(dx, dy), ang = Math.abs(((Math.atan2(dy, dx) - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (!hidden && flash <= 0 && d < L && ang < .45) { caught++; flash = 1; C.FX.wrong(); C.FX.banner("👀", T().caught); P.x = W * .5; P.y = H - 40; tgt = null }
        draw(g, cfg.guard || "egypt_soldier", gd.x, gd.y + 22, 52, 1, gd.d < 0) }
      for (const h of hides) draw(g, cfg.hide || "scenery/reeds", h.x, h.y + 26, 56, .95);
      flash = Math.max(0, flash - dt); draw(g, cfg.player || "miriam", P.x, P.y + 20, 48, hidden ? .55 : 1);
      o.prog(hidden ? "🌿" : "👣"); if (P.y < 60) o.win(Math.max(.35, 1 - caught * .2)) }) };

  /* 10. MAZE — find the way; optional stations to pass on the way */
  MINI.maze = (cfg) => { const o = shell(cfg, "maze"), K = canvas(o), N = cfg.size || 7; let cell = [], P = { x: 0, y: N - 1 }, st = [], got = 0, moves = 0, anim = { x: 0, y: N - 1 };
    for (let y = 0; y < N; y++) { cell.push([]); for (let x = 0; x < N; x++) cell[y].push({ n: 1, e: 1, s: 1, w: 1, v: 0 }) }
    const D = { n: [0, -1, "s"], s: [0, 1, "n"], e: [1, 0, "w"], w: [-1, 0, "e"] }; (function carve(x, y) { cell[y][x].v = 1; for (const k of shuffle(["n", "s", "e", "w"])) { const [dx, dy, o2] = D[k], nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && !cell[ny][nx].v) { cell[y][x][k] = 0; cell[ny][nx][o2] = 0; carve(nx, ny) } } })(0, N - 1);
    const ns = cfg.stations || 0; while (st.length < ns) { const s = { x: Math.random() * N | 0, y: Math.random() * N | 0 }; if ((s.x || s.y !== N - 1) && !(s.x === N - 1 && s.y === 0) && !st.some(q => q.x === s.x && q.y === s.y)) st.push(s) }
    o.prog(ns ? `0/${ns}` : "");
    const go = k => { const [dx, dy] = D[k]; if (cell[P.y][P.x][k]) return; P.x += dx; P.y += dy; moves++; const s = st.find(q => !q.got && q.x === P.x && q.y === P.y); if (s) { s.got = 1; got++; o.prog(`${got}/${ns}`); const r = o.st.getBoundingClientRect(); C.FX.add("items", 15, [r.left + K.W() / 2, r.top + 40], { combo: true }) }
      if (P.x === N - 1 && P.y === 0 && got >= ns) setTimeout(() => o.win(Math.min(1, (N * 2.2) / moves + .3)), 300) };
    keys(o, e => { const m = { ArrowUp: "n", ArrowDown: "s", ArrowLeft: "w", ArrowRight: "e" }[e.key]; if (m) { e.preventDefault(); go(m) } });
    const pad = document.createElement("div"); pad.className = "mg-dpad"; pad.innerHTML = `<span></span><button data-k="n">↑</button><span></span><button data-k="w">←</button><span></span><button data-k="e">→</button><span></span><button data-k="s">↓</button><span></span>`; pad.style.direction = "ltr"; o.st.appendChild(pad);
    pad.querySelectorAll("button").forEach(b => o.on(b, "pointerdown", e => { e.preventDefault(); e.stopPropagation(); go(b.dataset.k) }));
    let s0 = null; o.on(o.st, "pointerdown", e => { s0 = [e.clientX, e.clientY] }); o.on(o.st, "pointerup", e => { if (!s0) return; const dx = e.clientX - s0[0], dy = e.clientY - s0[1]; s0 = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "e" : "w") : (dy > 0 ? "s" : "n")) });
    loop(o, dt => { const g = K.g, W = K.W(), H = K.H() - 150, sz = Math.min((W - 20) / N, (H - 10) / N), ox = (W - sz * N) / 2, oy = 10; g.clearRect(0, 0, W, K.H());
      g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(ox, oy, sz * N, sz * N); g.strokeStyle = "#6b4a2a"; g.lineWidth = 4; g.lineCap = "round";
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = cell[y][x], X = ox + x * sz, Y = oy + y * sz; g.beginPath(); if (c.n) { g.moveTo(X, Y); g.lineTo(X + sz, Y) } if (c.w) { g.moveTo(X, Y); g.lineTo(X, Y + sz) } if (c.s) { g.moveTo(X, Y + sz); g.lineTo(X + sz, Y + sz) } if (c.e) { g.moveTo(X + sz, Y); g.lineTo(X + sz, Y + sz) } g.stroke() }
      for (const s of st) if (!s.got) draw(g, cfg.station || "scenery/tent_small", ox + (s.x + .5) * sz, oy + (s.y + .85) * sz, sz * .7);
      draw(g, cfg.goal || "scenery/city_gate", ox + (N - .5) * sz, oy + sz * .95, sz * .9);
      anim.x += (P.x - anim.x) * Math.min(1, dt * 14); anim.y += (P.y - anim.y) * Math.min(1, dt * 14); draw(g, cfg.player || "moshe", ox + (anim.x + .5) * sz, oy + (anim.y + .92) * sz, sz * .85) }) };

  /* 11. STICKER — retell the story: drag each sticker to its place, step by step */
  MINI.sticker = (cfg) => { const o = shell(cfg, "sticker"), steps = cfg.steps; let i = 0, mist = 0;
    if (cfg.bg) { const b = document.createElement("img"); b.src = url(cfg.bg); b.style.cssText = "position:absolute;left:50%;bottom:90px;transform:translateX(-50%);height:45%;opacity:.95;pointer-events:none"; o.st.appendChild(b) }
    const cap = document.createElement("div"); cap.className = "mg-cap"; o.st.appendChild(cap); const gh = document.createElement("div"); gh.className = "mg-ghost"; o.st.appendChild(gh);
    const tray = document.createElement("div"); tray.className = "mg-tray"; o.st.appendChild(tray);
    shuffle(steps.map((s, k) => k)).forEach(k => { const el = document.createElement("img"); el.src = url(steps[k].sticker); el.dataset.k = k; tray.appendChild(el); let drag = null, ghost = null;
      o.on(el, "pointerdown", e => { if (el.dataset.used) return; e.preventDefault(); drag = 1; ghost = el.cloneNode(); ghost.style.cssText = `position:fixed;height:90px;pointer-events:none;z-index:30;left:${e.clientX - 40}px;top:${e.clientY - 80}px`; document.body.appendChild(ghost); el.setPointerCapture(e.pointerId) });
      o.on(el, "pointermove", e => { if (ghost) { ghost.style.left = e.clientX - 40 + "px"; ghost.style.top = e.clientY - 80 + "px" } });
      o.on(el, "pointerup", e => { if (!drag) return; drag = null; ghost && ghost.remove(); ghost = null; const r = gh.getBoundingClientRect(), inside = e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
        if (inside && +el.dataset.k === i) { place(el) } else if (inside) { mist++; C.FX.wrong(); gh.animate([{ transform: "translate(-55%,-100%)" }, { transform: "translate(-45%,-100%)" }, { transform: "translate(-50%,-100%)" }], { duration: 250 }) } }) });
    const W = () => o.st.clientWidth, H = () => o.st.clientHeight - 88;
    const show = () => { const s = steps[i]; cap.innerHTML = C.tx(s.caption); const h = s.h || 90; gh.style.left = s.x * W() + "px"; gh.style.top = s.y * H() + "px"; gh.style.width = h * .8 + "px"; gh.style.height = h + "px"; o.prog(`${i}/${steps.length}`) };
    const place = el => { const s = steps[i]; el.dataset.used = 1; el.style.opacity = .25; const p = document.createElement("img"); p.src = el.src; p.style.cssText = `position:absolute;height:${s.h || 90}px;left:${s.x * W()}px;top:${s.y * H()}px;transform:translate(-50%,-100%);filter:drop-shadow(0 4px 6px rgba(0,0,0,.3))`; o.st.insertBefore(p, gh);
      const r = p.getBoundingClientRect(); C.FX.add("items", 25, [r.left + r.width / 2, r.top], { combo: true }); i++; if (i >= steps.length) { gh.remove(); cap.innerHTML = C.tx(cfg.end) || "✨"; return setTimeout(() => o.win(Math.max(.4, 1 - mist * .12)), 1200) } show() };
    setTimeout(show, 30) };

  MINI.TYPES = ["rhythm", "steer", "sort", "hidden", "pour", "stack", "path", "memory", "sneak", "maze", "sticker"];
  MINI.run = (type, cfg, ctx) => { C = ctx; MINI[type](cfg) };
})();
