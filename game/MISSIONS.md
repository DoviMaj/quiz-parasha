# Weekly 3D missions — storyline format

The game (`game/index.html` + `game/game.js`) shows one map of all parshiot (`game/missions/index.json`) and plays `game/missions/<node id>.json`. Each week add ONE **story** mission for the coming parashah, using the node id already in `index.json` (e.g. `miketz`), and set `"type":"story"` on that node. Change `game.js`, `engine.js`, `games.css` or `game/index.html` only to fix a real bug or problem you found (minimal, targeted edits on the latest live copy), then replay several existing story missions in en/es/he to confirm nothing else broke. Use the game-developer skill.

The easiest way: copy a generator from `build.py`-style scripts like `/home/claude/patch/stories_3.py` (helpers in `storylib.py`: `L, say, narr, ch, path, step, explore, herd, run, collect, person, obj, ask, opt, mopt, sub, tap`). If those files are not present, copy the structure of `missions/vayetzei.json` or `missions/vayera.json` by hand.

## Structure
`{id, type:"story", title, intro:{}, outro:{}, q:[], scene, story:{intro, cast:{key:{en,es,he}}, paths:[…]}}`
- **paths**: 2–3 storylines, each seen through a different person (`who` = a sprite in `chars/`, or `"scenery/…"`). `{id, who, name, tag, outro, chapters:[…]}`. The quiz unlocks them: path 1 at 10 answered questions of the week, path 2 at 20, path 3 at 30.
- **chapter**: `{title, talk:[lines], game?, after?:[lines]}`. Without `game` it is dialogue only.
- **line**: `{w: speaker sprite key (omit = narrator), t:{en,es,he}, src:"בראשית כח:יב"}`; `n:{…}` overrides the name (e.g. Efron, shepherds) when there is no sprite.
- **choice inside dialogue**: `{ask:{en,es,he}, options:[{e:"🙏", label:{…}, middah?:"chesed|emunah|achdut|gevurah|emet|anavah|zerizut|kibud|hakarat|shalom|savlanut", reply:[lines]}]}`. Choices change HOW, never WHAT: the Torah's events always happen; a "wrong" choice gets a gentle reply that tells what really happened.
- **task menu chapter**: `{title, talk, choose:{mode:"all"|"one", title, options:[{e, label, fmt:"tap|herd|explore|run|build", middah?, chapters:[{game,…}]}]}}` — the player picks the order (all) or one branch (one).

## Game types (`game`)
- `explore`: `start [x,z]`, `player:{sprite,h}`, `objects`, `steps:[{text (may use <b>), at, r, talk?, objects?, npc?:[{x,z,sprite,h,wander?,follow?:1|"start"}], collect?:{sprite|sprites, n, r, h, wave?, fade? seconds (items melt), float?}, par? seconds, limit? seconds (timed delivery)}]`. Every step must DO something: gather story items (stones for an altar, mann, sheaves…), deliver on time, lead companions (`follow:"start"`), find a person.
- `herd`: `animal` (sheep | goat | cow | camel | mixed), `n`, `pen {x:0,z:-24…-26,r,gap,style fence|ark|well}`, `player`, `par`.
- `build`: as in `terumah`/`bereshit` (reuse with `from_existing`).
- `run`: `runner` sprite, `goal` 360–600, `walls` none|canyon|water, `low` [rock jars bush stone wheel reeds] (jumpable), `tall` [boulder camel cart tent palm pile] (dodge), `pickup` sprite or false, `goalSprite`, `side` sprites.
- **2D mini-games** (a chapter `game`, or an explore step's `"mini": {…}`): every one takes `text`, optional `hint`, `done`.
  - `rhythm` {img, n hits, bpm} — tap on the beat (Shirat HaYam, Miriam's tof).
  - `steer` {img boat/rider, time, obstacles:[sprites], pickup?} — drag left/right through a stream (the ark on the waters).
  - `sort` {bins:[{id,label,img?,mark?}], items:[{img, mark?:"spots|speckles|stripes", bin}]} — drag into groups (Yaakov's speckled/spotted flock, kosher animals).
  - `hidden` {targets:[sprites], decoys:[sprites], count, time} — find what's hidden (the ram in the thicket).
  - `pour` {n vessels, img jar, lo, hi} — hold to pour, stop between the lines (Rivkah's trough, Menorah oil).
  - `stack` {n} — drop swinging stones straight up (Gal-Ed, an altar).
  - `path` {walls 0–.2, obstacles, count, walker, goal} — draw a route (through the sea).
  - `memory` {cards:[sprites]} — match pairs (animals two by two, dream symbols, Shevatim).
  - `sneak` {player, guard, hide, goal, guards} — move unseen, hide in reeds (Yocheved/Miriam and baby Moshe).
  - `maze` {size, stations, player, station, goal} — the journeys in the wilderness.
  - `sticker` {bg, steps:[{sticker, x 0–1, y 0–1, h?, caption}], end} — retell a scene step by step.
  - `catch` {sprite|sprites, n} — basket catch for things falling from above (mann, frogs).
- `tap` (timing): `{type:"tap", img, n, speed, zone, text, hint?, done, night?:1}` (`night` darkens the screen for scenes at night) — rolling a stone, drawing water, wrestling until dawn, Miriam's tof.

Sprites: characters in `chars/` (faceless art; never show Hashem), scenery in `scenery/` (olive, palm, fig, acacia, bush, rocks, boulder, hill, wheat, sheaf, tent_dark, tent_light, well, pit, altar, fence, jars, baskets, campfire, cart, silo, ark, egypt_house, store_city, prison, har_sinai, sea_wall, riverbank, city_gate, stone_pile, dune, oasis, aron, shulchan, menorah, mizbach_ketoret, mizbach_nechoshet, kiyor, keresh, parochet, courtyard, mishkan_tent, pillar_cloud, pillar_fire, scroll, coin, coins, spice_jar, star, rainbow, dove, sparkle, mann, heart, bread, staff). Place a scenery sprite as `{"t":"person","x","z","sprite":"scenery/…","h"}`.

## Rules
Every quote and fact verified on Sefaria (pasuk or Rashi, with a Hebrew reference in Hebrew numerals); quotes “ ” in en/es and ״ ״ in he; names transliterated (Yaakov, Yosef, Mitzrayim / Mitzráyim…); G-d / D-os / לאלקים, ה׳; no quiz questions; no faces; nothing implying use on Shabbat. Three reviewer agents check the text before publishing.
Test: serve the app folder, open `game/index.html#all&m=<id>`, play every path to the results screen (Playwright), screenshot, then publish.
