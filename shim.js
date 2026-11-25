/* Stands in for the claude.ai artifact runtime (window.claude.use) on our own hosting.
   db   -> Firestore (same doc/collection/onSnapshot shape the app already uses)
   user -> Firebase anonymous auth (one id per device)
   Also: registers sw.js and shows a bell button to subscribe to weekly push. */
(function () {
  var C = window.QUIZ_CFG || {};
  var V = "https://www.gstatic.com/firebasejs/10.12.2/";
  var ready;
  function init() {
    return ready || (ready = (async function () {
      var m = await Promise.all([import(V + "firebase-app.js"), import(V + "firebase-firestore.js"), import(V + "firebase-auth.js")]);
      var app = m[0].initializeApp(C.firebase), F = m[1], A = m[2];
      var auth = A.getAuth(app);
      await auth.authStateReady();
      if (!auth.currentUser) await A.signInAnonymously(auth);
      return { F: F, A: A, auth: auth, fs: F.getFirestore(app), uid: auth.currentUser.uid };
    })());
  }
  function wrapSnap(s) { return { id: s.id, exists: s.exists(), data: function () { return s.data(); } }; }
  function makeDb(x) {
    var F = x.F;
    return {
      doc: function (p) {
        var r = F.doc(x.fs, p);
        return {
          set: function (d) { return F.setDoc(r, d); },
          get: function () { return F.getDoc(r).then(wrapSnap); }
        };
      },
      collection: function (n) {
        return {
          onSnapshot: function (cb, err) {
            return F.onSnapshot(F.collection(x.fs, n), function (s) { cb({ docs: s.docs.map(wrapSnap) }); }, err);
          }
        };
      }
    };
  }
  if (!window.claude && C.firebase) {
    window.claude = {
      use: function (name) {
        if (name !== "db" && name !== "user") return Promise.resolve(null);
        return init().then(function (x) {
          return name === "db" ? makeDb(x) : { id: function () { return x.uid; }, can: function () { return true; } };
        }).catch(function (e) { console.warn("backend unavailable", e); return null; });
      }
    };
  }

  /* ---- push notifications ---- */
  var T = {
    es: { on: "🔔 Avisarme del quiz semanal", done: "✓ Te avisaremos", ios: "Para recibir avisos: Compartir → “Agregar a inicio” y abre la app desde ahí." },
    en: { on: "🔔 Notify me of the weekly quiz", done: "✓ You'll be notified", ios: "To get alerts: Share → “Add to Home Screen”, then open the app from there." },
    he: { on: "🔔 הודיעו לי על החידון השבועי", done: "✓ נודיע לך", ios: "לקבלת התראות: שיתוף ← ״הוספה למסך הבית״ ופתחו משם." }
  };
  function lang() { try { return JSON.parse(localStorage.getItem("parasha-app-v1")).lang || "es"; } catch (e) { return "es"; } }
  function b64(s) { s = (s + "===".slice((s.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  async function hash(t) { var h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return Array.from(new Uint8Array(h), function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }
  async function subscribe(btn) {
    var t = T[lang()] || T.es;
    if (await Notification.requestPermission() !== "granted") return;
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(C.vapidPublic) });
    var x = await init();
    await x.F.setDoc(x.F.doc(x.fs, "push/" + await hash(sub.endpoint)), { sub: JSON.parse(JSON.stringify(sub)), lang: lang(), at: Date.now() });
    btn.textContent = t.done; setTimeout(function () { btn.remove(); }, 2500);
  }
  async function bell() {
    if (!("serviceWorker" in navigator)) return;
    var reg = await navigator.serviceWorker.register("sw.js");
    var t = T[lang()] || T.es;
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
    var canPush = "PushManager" in window && C.vapidPublic;
    if (canPush && Notification.permission === "granted" && await reg.pushManager.getSubscription()) return;
    if (!canPush && !(ios && !standalone)) return;
    if (localStorage.getItem("bell-hidden")) return;
    var b = document.createElement("button");
    b.className = "btn ghost"; b.style.cssText = "width:100%;margin-top:8px";
    b.dir = lang() === "he" ? "rtl" : "ltr";
    b.textContent = canPush ? t.on : t.ios;
    b.onclick = function () { if (canPush) subscribe(b).catch(function (e) { console.warn(e); }); else { localStorage.setItem("bell-hidden", "1"); b.remove(); } };
    place(b);
  }
  /* buttons live inside the profile/settings dialog (#onb), above its main button */
  function place(b) {
    var go = document.getElementById("oGo");
    if (go) go.parentNode.insertBefore(b, go); else document.body.appendChild(b);
  }
  /* ---- Google sign-in: links the anonymous account, so scores and the leaderboard entry
     follow you to other devices. Signing in on a 2nd device switches to the Google account's id. ---- */
  var G = {
    es: { in: "Guardar progreso con Google", out: "Cerrar sesión" },
    en: { in: "Save progress with Google", out: "Sign out" },
    he: { in: "שמירת התקדמות עם Google", out: "התנתקות" }
  };
  async function google() {
    var x = await init(), A = x.A, u = x.auth.currentUser, g = G[lang()] || G.es;
    var b = document.createElement("button");
    b.className = "btn ghost"; b.style.cssText = "width:100%;margin-top:8px";
    b.dir = lang() === "he" ? "rtl" : "ltr";
    if (u.isAnonymous) {
      if (localStorage.getItem("google-hidden")) return;
      b.textContent = "G · " + g.in;
      b.onclick = async function () {
        var p = new A.GoogleAuthProvider();
        try { await A.linkWithPopup(u, p); }
        catch (e) {
          if (e.code === "auth/credential-already-in-use") await A.signInWithCredential(x.auth, A.GoogleAuthProvider.credentialFromError(e));
          else if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
          else { console.warn(e); return; }
        }
        location.reload();
      };
    } else {
      b.textContent = (u.displayName || u.email || "") .split(" ")[0] + " · " + g.out;
      b.onclick = async function () { await A.signOut(x.auth); location.reload(); };
    }
    place(b);
  }
  addEventListener("load", function () {
    bell().catch(function () {});
    if (C.firebase) google().catch(function (e) { console.warn(e); });
  });
})();
