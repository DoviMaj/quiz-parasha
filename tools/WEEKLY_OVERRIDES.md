HOSTING CHANGED — these rules override the prompt below wherever they conflict.

- The app is no longer a claude.ai artifact. It lives in the public GitHub repo DoviMaj/quiz-parasha and is deployed to Vercel at https://quiz-parasha.vercel.app/. Ignore every Artifact-tool instruction (list/read/publish, slug, artifact URL, "send the LIVE index.html back", refusal handling).
- START: `git clone https://x-access-token:$GITHUB_TOKEN@github.com/DoviMaj/quiz-parasha.git` and work in that clone. Run the build as `python3 tools/build.py.txt …`.
- Also treat game/minis.js like game.js/engine.js/games.css (download, fix rules, ?v= version bump).
- index.html loads config.js and shim.js (the Firebase backend). Change index.html, shim.js or config.js only to fix real bugs. In Playwright tests, define the mocked window.claude in an init script so it exists before shim.js runs (shim.js skips itself when window.claude exists).
- No Chrome? Run `npx -y playwright install chromium` and use it. If that fails, skip browser tests, build with --no-pdf, still publish, and say so in the notification.
- After building, `git rm` weeks/pdf/*.pdf of weeks whose shabbat is more than 4 weeks before today.
- PUBLISH (replaces step 7): `git pull --rebase` (rerun affected checks if incoming changes touch your files), `git add` only files you changed or the build listed, commit, `git push`. Then poll https://quiz-parasha.vercel.app/weeks/index.json?t=<now> every 10 s, up to 10 min, until it contains the new week id.
- NOTIFY (before step 8): `npm i firebase-admin web-push` then `node tools/notify.mjs "<parsha es>" "<parsha en>" "<parsha he>"` (env FIREBASE_SA, VAPID_PUBLIC, VAPID_PRIVATE, SITE_URL are set on the routine). Report its {sent, removed, failed}. In the step 8 message to the owner, use the link https://quiz-parasha.vercel.app/ and add the subscriber count.
- If the 3D mission can't be finished, still publish the quiz and say so.
