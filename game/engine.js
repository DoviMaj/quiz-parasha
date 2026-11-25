/* Tiny WebGL helper shared by the 3D prototypes: primitives, hemisphere light, fog, blob shadows. */
window.Engine = function (canvas, opts) {
  opts = opts || {};
  const gl = canvas.getContext("webgl", { antialias: true });
  if (!gl) return null;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] };
  const M = {
    id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s } return o },
    persp(f, asp, n, fa) { const t = 1 / Math.tan(f / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0] },
    look(e, c, u) { const z = norm(sub(e, c)), x = norm(cross(u, z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1] },
    /* translate, rotate around Y, scale */
    trs(tx, ty, tz, ry, sx, sy, sz) { const c = Math.cos(ry), s = Math.sin(ry); return [c * sx, 0, -s * sx, 0, 0, sy, 0, 0, s * sz, 0, c * sz, 0, tx, ty, tz, 1] }
  };
  const VS = `attribute vec3 p;attribute vec3 n;uniform mat4 VP,Mo;varying vec3 vn;varying vec3 wp;void main(){vec4 w=Mo*vec4(p,1.);wp=w.xyz;vn=mat3(Mo)*n;gl_Position=VP*w;}`;
  const FS = `precision mediump float;varying vec3 vn;varying vec3 wp;uniform vec3 col,L,cam,fogc,sun;uniform float a,shade,spec,fogn,fogf;
  void main(){vec3 N=normalize(vn);float d=max(dot(N,L),0.);vec3 sky=vec3(.62,.72,.88),gr=vec3(.75,.6,.42);vec3 amb=mix(gr,sky,N.y*.5+.5)*.55;
  vec3 V=normalize(cam-wp);float sp=pow(max(dot(reflect(-L,N),V),0.),24.)*spec;
  vec3 c=col*(shade>.5?(amb+sun*d*.75):vec3(1.))+sun*sp;float f=clamp((length(wp-cam)-fogn)/(fogf-fogn),0.,1.);c=mix(c,fogc,f);gl_FragColor=vec4(c,a);}`;
  function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o }
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  const U = {}; ["VP", "Mo", "col", "L", "cam", "a", "shade", "spec", "fogc", "fogn", "fogf", "sun"].forEach(k => U[k] = gl.getUniformLocation(pr, k));
  const AP = gl.getAttribLocation(pr, "p"), AN = gl.getAttribLocation(pr, "n");
  function mesh(pos, nrm, idx) { const b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW); const b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nrm), gl.STATIC_DRAW); const b3 = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b3); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW); return { b1, b2, b3, n: idx.length } }
  function sphere(seg = 16, rin = 12) { const p = [], n = [], ix = []; for (let i = 0; i <= rin; i++) { const v = i / rin * Math.PI; for (let j = 0; j <= seg; j++) { const u = j / seg * 2 * Math.PI; const x = Math.sin(v) * Math.cos(u), y = Math.cos(v), z = Math.sin(v) * Math.sin(u); p.push(x, y, z); n.push(x, y, z) } } for (let i = 0; i < rin; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; ix.push(a, b, a + 1, b, b + 1, a + 1) } return mesh(p, n, ix) }
  function cyl(seg = 16, top = 1) { const p = [], n = [], ix = []; for (let j = 0; j <= seg; j++) { const u = j / seg * 2 * Math.PI, c = Math.cos(u), s = Math.sin(u); p.push(c, 0, s, c * top, 1, s * top); const ny = (1 - top), l = Math.hypot(1, ny); n.push(c / l, ny / l, s / l, c / l, ny / l, s / l) } for (let j = 0; j < seg; j++) { const a = j * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) } const cb = p.length / 3; p.push(0, 1, 0); n.push(0, 1, 0); for (let j = 0; j <= seg; j++) { const u = j / seg * 2 * Math.PI; p.push(Math.cos(u) * top, 1, Math.sin(u) * top); n.push(0, 1, 0) } for (let j = 0; j < seg; j++) ix.push(cb, cb + 2 + j, cb + 1 + j); return mesh(p, n, ix) }
  function box() { const p = [], n = [], ix = []; const F = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; F.forEach(f => { const [nx, ny, nz] = f; const u = ny ? [1, 0, 0] : [0, 1, 0], v = cross(f, u); const b = p.length / 3; for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { p.push((nx + u[0] * s + v[0] * t) * .5, (ny + u[1] * s + v[1] * t) * .5, (nz + u[2] * s + v[2] * t) * .5); n.push(nx, ny, nz) } ix.push(b, b + 1, b + 2, b, b + 2, b + 3) }); return mesh(p, n, ix) }
  function disc(seg = 24) { const p = [0, 0, 0], n = [0, 1, 0], ix = []; for (let j = 0; j <= seg; j++) { const u = j / seg * 2 * Math.PI; p.push(Math.cos(u), 0, Math.sin(u)); n.push(0, 1, 0) } for (let j = 0; j < seg; j++) ix.push(0, j + 2, j + 1); return mesh(p, n, ix) }
  function plane(N, S, h) { const p = [], n = [], ix = []; for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const x = (j / N - .5) * S, z = (i / N - .5) * S; p.push(x, h(x, z), z); const e = .5, hx = h(x + e, z) - h(x - e, z), hz = h(x, z + e) - h(x, z - e); n.push(...norm([-hx, 2 * e, -hz])) } for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const a = i * (N + 1) + j, b = a + N + 1; ix.push(a, b, a + 1, b, b + 1, a + 1) } return mesh(p, n, ix) }
  const E = {
    gl, M, norm, mesh, plane, SPH: sphere(), CYL: cyl(), CONE: cyl(16, 0.001), BOX: box(), DISC: disc(),
    VP: M.id(), cam: [0, 0, 0], W: 1, H: 1,
    resize() { const d = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * d; canvas.height = innerHeight * d; gl.viewport(0, 0, canvas.width, canvas.height); E.W = innerWidth; E.H = innerHeight },
    begin(eye, tgt, fov, env) {
      env = env || {}; const asp = canvas.width / canvas.height; E.cam = eye;
      E.VP = M.mul(M.persp(fov || .9, asp, .3, 300), M.look(eye, tgt, [0, 1, 0]));
      const sky = env.sky || [.62, .74, .9]; gl.clearColor(sky[0], sky[1], sky[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.VP, false, E.VP); gl.uniform3fv(U.L, norm(env.light || [.5, .9, .35])); gl.uniform3fv(U.cam, eye);
      gl.uniform3fv(U.fogc, env.fog || [.93, .84, .68]); gl.uniform1f(U.fogn, env.fogNear || 30); gl.uniform1f(U.fogf, env.fogFar || 100); gl.uniform3fv(U.sun, env.sun || [1, .93, .8])
    },
    draw(m, mo, col, alpha = 1, shade = 1, spec = 0) { gl.bindBuffer(gl.ARRAY_BUFFER, m.b1); gl.vertexAttribPointer(AP, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(AP); gl.bindBuffer(gl.ARRAY_BUFFER, m.b2); gl.vertexAttribPointer(AN, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(AN); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.b3); gl.uniformMatrix4fv(U.Mo, false, mo); gl.uniform3fv(U.col, col); gl.uniform1f(U.a, alpha); gl.uniform1f(U.shade, shade); gl.uniform1f(U.spec, spec); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0) },
    shadow(x, y, z, r, a = .28) { E.draw(E.DISC, M.trs(x, y + .03, z, 0, r, 1, r * .8), [.3, .22, .12], a, 0) },
    /* project a world point to CSS pixels; returns null when behind the camera */
    project(x, y, z) { const m = E.VP; const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15]; if (cw <= 0) return null; return [(cx / cw * .5 + .5) * E.W, (1 - (cy / cw * .5 + .5)) * E.H] },
    /* a person: robe cone, plain head (never a face), optional staff */
    person(x, y, z, ry, robe, opt = {}) { const s = opt.s || 1, bob = opt.bob || 0; E.shadow(x, y, z, .8 * s); E.draw(E.CONE, M.trs(x, y, z, ry, .7 * s, 2.3 * s, .7 * s), robe); E.draw(E.SPH, M.trs(x, y + (2.35 + bob) * s, z, ry, .38 * s, .4 * s, .38 * s), [.55, .38, .26]); E.draw(E.SPH, M.trs(x, y + (2.5 + bob) * s, z, ry, .42 * s, .28 * s, .42 * s), opt.hat || [.92, .88, .78]); if (opt.staff) { const hx = x + Math.cos(ry) * .75 * s, hz = z - Math.sin(ry) * .75 * s; E.draw(E.CYL, M.trs(hx, y, hz, 0, .07 * s, 2.9 * s, .07 * s), [.42, .27, .13]) } }
  };
  /* sprites: 2D character art standing upright in the world, always turned toward the camera */
  const SVS = `attribute vec2 q;uniform mat4 VP;uniform vec3 c,R;uniform vec2 sz;uniform float flip;varying vec2 uv;void main(){uv=vec2(flip>0.5?1.-q.x:q.x,1.-q.y);vec3 p=c+R*(q.x-.5)*sz.x+vec3(0.,1.,0.)*q.y*sz.y;gl_Position=VP*vec4(p,1.);}`;
  const SFS = `precision mediump float;varying vec2 uv;uniform sampler2D t;uniform vec3 fogc,cam,cp;uniform float fogn,fogf;void main(){vec4 k=texture2D(t,uv);if(k.a<.45)discard;float f=clamp((length(cp-cam)-fogn)/(fogf-fogn),0.,1.);gl_FragColor=vec4(mix(k.rgb,fogc,f*.85),1.);}`;
  const SP = gl.createProgram(); gl.attachShader(SP, sh(gl.VERTEX_SHADER, SVS)); gl.attachShader(SP, sh(gl.FRAGMENT_SHADER, SFS)); gl.linkProgram(SP);
  const SL = {}; ["VP", "c", "cp", "R", "sz", "flip", "t", "fogc", "cam", "fogn", "fogf"].forEach(k => SL[k] = gl.getUniformLocation(SP, k)); const SQ = gl.getAttribLocation(SP, "q");
  const QB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, QB); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
  const TEX = {}, queue = []; let envFog = [.93, .84, .68], envN = 30, envF = 100;
  function tex(name) { if (TEX[name]) return TEX[name]; const t = { tex: gl.createTexture(), w: 1, h: 2, ok: false }; TEX[name] = t; const img = new Image(); img.onload = () => { gl.bindTexture(gl.TEXTURE_2D, t.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); t.w = img.width; t.h = img.height; t.ok = true }; img.src = name.includes("/") ? name + ".png" : (opts.spritePath || "chars/") + name + ".png"; return t }
  E.preload = names => names.forEach(tex);
  /* queue a character: h = height in world units; its feet stand at (x, y, z) */
  E.sprite = (name, x, y, z, h, flip, shadow = true) => { const t = tex(name); const w = t.ok ? h * t.w / t.h : h * .5; if (shadow) E.shadow(x, y, z, w * .42, .25); queue.push({ t, x, y, z, w, h, flip }) };
  E.flushSprites = () => { if (!queue.length) return; gl.useProgram(SP); gl.bindBuffer(gl.ARRAY_BUFFER, QB); gl.enableVertexAttribArray(SQ); gl.vertexAttribPointer(SQ, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(SL.VP, false, E.VP); gl.uniform3fv(SL.fogc, envFog); gl.uniform3fv(SL.cam, E.cam); gl.uniform1f(SL.fogn, envN); gl.uniform1f(SL.fogf, envF); gl.activeTexture(gl.TEXTURE0); gl.uniform1i(SL.t, 0);
    const rx = E.VP[0], rz = E.VP[8], rl = Math.hypot(rx, rz) || 1; gl.uniform3f(SL.R, rx / rl, 0, rz / rl);
    queue.sort((a, b) => Math.hypot(b.x - E.cam[0], b.z - E.cam[2]) - Math.hypot(a.x - E.cam[0], a.z - E.cam[2]));
    for (const s of queue) { if (!s.t.ok) continue; gl.uniform3f(SL.c, s.x, s.y, s.z); gl.uniform3f(SL.cp, s.x, s.y, s.z); gl.uniform2f(SL.sz, s.w, s.h); gl.uniform1f(SL.flip, s.flip ? 1 : 0); gl.bindTexture(gl.TEXTURE_2D, s.t.tex); gl.drawArrays(gl.TRIANGLES, 0, 6) }
    queue.length = 0; gl.useProgram(pr) };
  const _begin = E.begin; E.begin = (eye, tgt, fov, env) => { env = env || {}; envFog = env.fog || [.93, .84, .68]; envN = env.fogNear || 30; envF = env.fogFar || 100; queue.length = 0; _begin(eye, tgt, fov, env) };
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  E.resize(); addEventListener("resize", E.resize);
  return E;
};
/* shared UI: question card */
window.QuizCard = function (el) {
  const T = el.querySelector(".cT"), P = el.querySelector(".cP"), O = el.querySelector(".opts"), G = el.querySelector(".go");
  return {
    show(title, text, btn, cb) { T.textContent = title; P.textContent = text; O.innerHTML = ""; G.textContent = btn; G.style.display = "block"; G.onclick = () => { el.classList.remove("on"); cb && cb() }; el.classList.add("on"); setTimeout(() => G.focus(), 50) },
    ask(title, q, cb) {
      const [text, opts, a, ex] = q; T.textContent = title; P.textContent = text; G.style.display = "none";
      const order = opts.map((x, k) => k).sort(() => Math.random() - .5);
      O.innerHTML = order.map(k => `<button data-k="${k}">${opts[k]}</button>`).join("");
      O.querySelectorAll("button").forEach(b => b.onclick = () => { const ok = +b.dataset.k === a; O.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.k === a) x.classList.add("ok"); else if (x === b) x.classList.add("bad") }); P.textContent = (ok ? "Right! " : "Not quite. ") + ex; G.textContent = "Continue"; G.style.display = "block"; G.onclick = () => { el.classList.remove("on"); cb && cb(ok) } });
      el.classList.add("on"); setTimeout(() => { const f = O.querySelector("button"); f && f.focus() }, 50)
    }
  };
};
