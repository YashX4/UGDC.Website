# UMass Game Dev site: handoff

This folder is the integrated proof of concept for the UMass Game Development Club site. Everything the club approved is in here and working end to end. Your job is to turn it into the real site without changing how it looks or feels.

Owner: Yash Laad (President, UMass Game Development Club). Fall 2026.

## 1. What it is

A single page site with three screens and one shared frame.

| Screen | Route token | What it is |
|---|---|---|
| Home | `#home` (or no hash) | Pixel emblem, rasterized serif headline, image trail over the title |
| Poster wall | `#events` | 3D brick wall with past jam posters taped on. One big centred poster you scroll between |
| Cartridge table | `#fall-2026` (one per jam) | 3D wooden table with one cartridge per game. Click one to load the game |

Shared frame: the Klein blue loader, the pixel block wipe between pages, the pill nav that grows into a full menu, the CRT scanline overlay.

User flow:

1. Loader (blue, logo, percent) shatters into pixel blocks and reveals Home.
2. Menu, Events: blocks cover the screen, the wall loads behind them, blocks reveal the wall.
3. Wall: hover the screen edges, use the wheel, drag, or arrow keys to scroll. Tape lifts off posters that move and sticks back down when they settle (with a synthesized sound). Click a side poster to centre it.
4. Click the centred poster: it flips to the theme poster, the camera pushes in a short way, the pixel wipe covers the screen, the blue loader shows the jam name, then the wipe dissolves and the cartridge table appears.
5. Table: hover the screen edges to slide the row, hover a cartridge to tilt it, click to zoom into its label, then the pixel wipe and the same blue loader show the game name with an "Open on itch.io" button and a "Back to the table" button.
6. Plus in the very corner of the table screen (opens on hover and on click): "Back to the wall" and "Home".

## 2. Run it

It must be served over http. Opening `index.html` from the file system will not work (WebGL textures and `fetch` are blocked on `file://`).

```
npx serve -l 8080 .
# or
python3 -m http.server 8080
```

Then open http://localhost:8080. No build step, no dependencies. three.js r149 is vendored in `vendor/`.

## 3. File map

```
index.html            all markup: loader, wipe, nav, three views. Plain scripts at the bottom, order matters.
css/tokens.css        THE palette and font tokens. Change colors here only.
css/base.css          reset, CRT overlay, type helpers, stepped animations, buttons
css/nav.css           pill nav
css/loader.css        loader, wipe canvas, cartridge loader variation
css/home.css          hero, emblem, trail
css/wall.css          poster wall layout
css/table.css         table layout, corner plus, loading screen
js/data.js            ALL content: links, asset paths, jams and games, posters. Edit here to change content.
js/util.js            helpers, lazy three.js loader
js/pixel.js           pixel icons, emblem painter, rasterized serif (two entry points), scramble hover
js/transition.js      loader intro and the pixel block wipe
js/nav.js             pill nav open and close
js/home-view.js       home view and image trail
js/wall.js            poster wall 3D engine
js/wall-view.js       wall view: DOM, input, text on the wall
js/table.js           cartridge table 3D engine
js/table-view.js      table view: DOM, info text, corner plus, loading screen
js/app.js             router, view lifecycle, transitions
assets/               fonts, images, posters, textures, 3D data
vendor/three.min.js   three.js r149 (UMD build, loaded on first use of the wall or table)
```

Architecture in one paragraph: each screen is a "view" object with `mount(route)` and `unmount()`. `app.js` owns the route, swaps views and plays transitions. The two 3D screens each have an engine (`wall.js`, `table.js`) that knows nothing about the DOM except its canvas, and a view (`wall-view.js`, `table-view.js`) that wires input, text and callbacks to it. Engines are created on mount and fully disposed on unmount (including `forceContextLoss`) so only one WebGL context is alive at a time.

## 4. Design rules (these are decisions, do not drift)

Palette (light only, no dark mode, ever):

- Blue (`--brand` #002fa7) frames things: logo, borders, bars, the wipe, the loader.
- Orange (`--lime` #ff4f00, name kept from the prototype) pops ONCE per screen: the heart on home and the table, the menu tile.
- Text is always ink (`--content` #0a0f26). Secondary text `--content-subtle`.
- Ground `--bg` #ebe8e1, paper `--bg-subtle` #f6f4ef.
- No other hues. No gradients as decoration. The red variant of the prototype was dropped on purpose.

Type:

- Goethe (rasterized serif) for headlines. It is NEVER drawn as normal text at display sizes. It is drawn on a 20 pixel em grid, thresholded, scaled and thresholded again so you get square pixels with softened steps. See `pixel.js`. Small body copy (like the game description) uses plain Goethe.
- Silkscreen for captions, labels and UI. Always uppercase, wrapped in square brackets for system messages: `[ LOADING CARTRIDGES ]`.
- Do not add a third face.

Motion:

- Everything steps like old hardware: `steps()` easings for UI, 3 or 4 opacity levels on the wipe. No smooth springy UI.
- The pixel wipe and the blue loader are the only transitions, including the poster to table hop and the cartridge loading screen.
- Respect `prefers-reduced-motion` (already handled in the engines, the wipe and the loader).

Layout:

- No boxes around text laid on the 3D scenes. Text sits directly on the wall or table with a soft halo of `--bg`.
- Nothing explains how to use the page. No instruction text, no "click here" hints.
- The table screen has no nav. The only chrome is the plus in the very top left corner.

Copy (this matters to the owner):

- Casual, direct, short punchy sentences.
- NO dashes of any kind in copy: no em dash, no en dash, no hyphen as punctuation or in compound modifiers. Rewrite with separate words ("step by step", not "step-by-step"; "April 17 to 24", not "April 17-24").
- Public facing copy: keep sentences short.
- Every public posting must keep this constraint: the event is not for kids, anyone under 16 needs an accompanying adult.

## 5. How the pieces work

### Loader and wipe (`transition.js`)

`U.intro(ready)` shows the blue loader, counts up while fonts and the first view load (minimum 1.1 s), then fades the mark, paints the screen blue on the wipe canvas and dissolves it in blocks. `U.wipe('in' | 'out', ms)` covers from the bottom up or reveals from the top down in random blocks with 4 opacity steps. `app.go()` always does: wipe in, swap views (wait until the new view says it is ready, capped at 8 s), wipe out. While covering, the wipe canvas blocks pointer events.

### Rasterized serif (`pixel.js`)

Two entry points on purpose, merge them when you refactor:

- `renderT(el)` for `.t[data-text]` elements (home, nav, loader). Reads size and colour from CSS.
- `U.rasterInto(canvas, text, sizePx, rgb, maxWidth)` for existing canvases (wall and table titles).

Both need Goethe loaded first (`U.fonts()`), and both redraw on resize.

### Poster wall engine (`wall.js`)

`PosterWall(canvas, posters, assets, callbacks)`. A normal-mapped brick plane under a raking light, one paper mesh per poster (a gentle curl toward the bottom, taped at two corners), a back face for the flip. Layout is computed every frame from a floating `offset` that eases toward an integer `target`.

Tuning knobs (all in `wall.js`):

| Knob | Where | Meaning |
|---|---|---|
| `G = 1.62`, `G2 = 1.12` | top of `PosterWall` | spacing from centre to first neighbour, and between the rest |
| `H = 2.1` | same | poster height in world units |
| `s = 1.06 - .36 * ad` | frame loop | centre poster scale vs side posters |
| `dist = 5.2 * max(1, 1.8 / aspect)` | `resize()` | camera distance, bigger number means smaller posters |
| `EDGE = .2` and `* .06` | input | width of the hover scroll zone (fraction of screen) and its speed |
| wheel threshold `> 4`, `130 ms` | `wheel()` | how snappy wheel scrolling is (one poster per notch) |
| `.22` | `offset += (target - offset) * .22` | how fast the row eases (higher is snappier) |
| tape peel | `loose`, `peel`, `sway` | tape lifts and opacity drops while a poster moves, sticks again on settle |

Sounds are synthesized with WebAudio (no files): a noise sweep for the peel, a thump plus a click for the stick. Audio only starts after the first pointer, wheel or key event (browser rule). There is no mute control yet.

### Cartridge table engine (`table.js`)

`GameTable(canvas, games, assets, callbacks)`. The cartridge mesh is a low poly Game Boy style cart (`assets/3d/cart.json`, raw position, uv arrays). Each cartridge gets its own canvas texture built from the base colour map tinted with the game colour, the "UMASS GAME DEV" stamp, the label (cover art or a dashed placeholder) and a canvas drawn spine with the title. The table mesh is stretched to fit the row.

Tuning knobs (in `table.js`):

| Knob | Meaning |
|---|---|
| `SP = .22` | spacing between cartridges |
| `dist = 2.9 * max(1, 1.9 / aspect)` | camera distance, smaller number is more zoomed in |
| `baseCam.set(0, .24, dist)`, `baseLook (0, .11, 0)` | camera height and where it looks. The look height keeps the cartridge tops clear of the info text on wide screens |
| `EDGE = .2`, `* .16` | hover scroll zone and speed |
| `PLASTIC[]` | rotating cartridge plastic colours (Klein family only) |
| open sequence | dolly toward the cartridge (0 to 1.1 s) then push into the label (1.5 to 2.5 s), then `onZoomed` |

### Router (`app.js`)

Hash tokens: empty or `home`, `events`, and any key of `UMGD.JAMS`. `history.pushState` keeps back and forward working. Deep links work: opening `#fall-2026` straight away loads the table behind the loader. The prototype uses bare tokens (not `#/events`) because the preview sandbox only passes plain anchors, so for production switch to real paths (`/events`, `/events/fall-2026`).

## 6. Content model (`js/data.js`)

```js
U.JAMS['fall-2026'] = { title, games: [ { title, team, desc, credits:[{name, role}], link, cover, color } ] }
U.POSTERS = [ { id, title, date, theme, front, back, jam, blank? } ]
```

- A poster is only clickable when `jam` points at a key in `JAMS`.
- `blank: true` draws a "next jam" placeholder (three are on the wall now, leaving room for future events).
- Cartridge `cover` is a square image, centre cropped onto the label. Empty means the dashed placeholder.
- The Fall table is still placeholder text: `[GAME TITLE 01]` to `12`. The Spring table has the 8 real submissions (title and team taken from the itch.io links, descriptions and covers still to add).

Planned: move this to a content file or CMS collection and generate it. Do not hard code content in the views.

## 7. Known gaps and things to decide

Fix or decide these early.

1. **Popup blocker.** After a cartridge zoom, the page calls `window.open(itchUrl)` from a timeout, which browsers often block because it is not a direct click. The loading screen has a visible "Open on itch.io" button as the fallback. Probably make the button the main path, or open on a second click.
2. **Fringe colour.** Home, nav and loader text use the original red and cyan CRT fringe (that is how the approved home screen was built). The wall and table titles use blue only fringe (from the palette doc). Pick one.
3. **Two raster text functions.** Merge `renderT` and `rasterInto`.
4. **Silkscreen** is loaded from Google Fonts. Self host it. Canvas text (cartridge labels, spines) needs the font loaded before the texture is drawn, which `loadTableAssets` already waits for.
5. **Weight.** First load is about 2.5 MB (three.js 600 KB, textures about 1.9 MB). Convert textures to WebP or KTX2, drop the normal map resolution, lazy load the wall assets while the home screen is idle. The wall assets could preload right after the home reveal.
6. **Mobile and touch.** Drag and tap are wired and the layout is responsive, but the 3D screens have not been tested on real phones. Check poster and cartridge sizes on narrow portrait screens, and the plus menu with touch (click opens, tap elsewhere closes).
7. **Accessibility.** The 3D screens are canvases. Add a real list of jams and games (visually hidden or a "list view" toggle) so screen readers and crawlers get the content. Focus order, aria labels and keyboard support (arrows, Enter, Escape) exist but need an audit.
8. **Sound.** Add a mute toggle and remember it. Never autoplay.
9. **About and Resources** are built (see the About and Resources section). Their content is still placeholder, see section 10.
10. **Events link** used to point at the registration form. It now opens the wall. The form is still linked as "Register" in the menu footer.
11. **Spring poster copy** (date, theme) is a placeholder written by the assistant. Confirm the real dates.
12. **SEO and sharing.** Title, description, Open Graph image, per page meta once routes are real.
13. **WebGL fallback.** If WebGL is unavailable, show the list view instead of a blank screen.

## 8. Assets and credits (check licences before launch)

- Goethe font by Kreative Korporation, freeware (Kreative Software Relay Fonts Free Use License).
- Silkscreen by Jason Kottke, SIL OFL (Google Fonts).
- Poster art: made by the club (Spring and Fall jam posters).
- Wooden table: WoodenTable_01 (Poly Haven style 1k textures, CC0 as far as known, confirm).
- Brick wall: a brick texture recoloured into a Klein blue duotone. Confirm the source licence.
- Cartridge: a low poly Game Boy cartridge model (`gameboy-cartridge-lowpoly`). Confirm its licence and that a Nintendo shaped cartridge is fine for the club's use, or reskin it into an original shape.
- three.js: MIT.

## 9. What was removed on purpose

- The red colour version of every screen.
- The older boxed layouts of the cartridge table and shelf, and the earlier "event game select" and "game shelf" boards.
- Dark mode and all dark palette code.
- The "Insert cartridge" and "itch.io" buttons on the table, and all how to use hints.

## 10. Suggested next steps

1. Stand up the real project: Vite, vanilla JS or TypeScript modules (the code is already structured as small files with one global namespace, convert `window.UMGD` to imports), three.js from npm (keep r149 behaviour, upgrading three changes colour management and lighting, do it as its own task with screenshot comparison).
2. Move content into data files. Add real jams and games.
3. Real routes and per page meta.
4. Performance pass (section 7, point 5).
5. About and Resources pages in the same language: Klein frame, one orange pop, rasterized serif headline, Silkscreen captions, pixel wipe in and out.
6. Accessibility list view and mobile pass.
7. Hosting and deploy (static, any CDN).

Always keep the screens looking exactly like this prototype. When in doubt, screenshot before and after.

## 11. First message to paste into Claude Code

> Read HANDOFF.md and CLAUDE.md in this folder, then run the prototype with a local server and click through every screen (home, menu, Events, the wall, the Fall poster, the table, the corner plus, back to the wall). Do not change how anything looks. First task: set up a Vite project that serves this exact site, convert the plain scripts to ES modules, keep behaviour identical, and prove it with before and after screenshots of each screen. Then work through section 7 of HANDOFF.md in order and ask me before deciding anything marked "decide".

## Open item: Instagram handle

The menu has an Instagram link in `index.html` and `U.LINKS.instagram` in `js/data.js`. The handle `umassgamedev` is a guess, confirm the real one before launch.

## Emblem art

`js/emblem-data.js` holds three pixel art PNGs (49 by 73, transparent, inlined as data URIs), one per background: `home` for the cream page ground (the hero, split in two at the middle row), `blue` for the Klein blue loader, `orange` for the orange menu tile. Each is the club's own artwork, so change the logo by replacing those three strings. Canvases pick one with `data-emblem="home|blue|orange"` and are drawn at whole device pixels per art pixel so blocks are never uneven. The old two tone emblem is kept as `docs/emblem-original.png`.

## About and Resources pages
Routes `#about` and `#resources`. Markup in body.html (`#view-about`, `#view-resources`), styles in `css/about.css`, logic in `js/about-view.js`. Content lives in `js/data.js`: `U.BOARD` (eboard, placeholder members use a pixel portrait until a `photo` is set), `U.ABOUT_STREAM` (photo stream files in `assets/img/about/`), `U.SLIDES` (resources list, an empty `pdf` shows "Soon"). The About page has three scroll scenes: hero photo eaten by pixel blocks, photo stream that stacks and flies up, eboard row that slides sideways. Photos are club photos supplied by Yash.

## Posters and jams
Poster wall order is Fall Game Jam first, Spring second, then blanks. `U.WALL_START = 0`. Both `fall-2026` and `spring-2026` open a cartridge table (games are placeholders). Spring theme is still TBA in data.js. The Instagram handle (`U.LINKS.instagram`) still needs confirming.

## Games tab and table menu
`#games` is a virtual jam (`U.JAMS.games`, built in data.js from every jam's games) so it reuses the cartridge table. The main menu has a Games link. On any table screen the main nav is restyled by css/nav.css as a corner plus with a Back button beside it: Back goes to the posters (`#events`), or home for `#games` (set in table-view.js). The nav is hidden while a game loading screen shows. Spring poster now has its theme flip side (`assets/posters/spring-theme.jpg`, theme Inverted).

## 10. Launch checklist

### Assets that are not ours (check licence, get permission or replace)
1. **Jam photos:** all Wikimedia photos are gone. The About page hero and photo stream (20 photos, from the jam videos and the first photo batch) and the home trail (14 photos) and menu icon are now club photos supplied by Yash. Confirm everyone who is clearly visible is fine with being on the public site. More club photos will be added (the stream and trail lists in `data.js` take any number).
2. **Goethe font** (`assets/fonts/Goethe.ttf`, also inlined as a data URI in the built page): Kreative Korporation freeware. Check the Free Use License covers a public website and embedding.
3. **Silkscreen font:** SIL OFL, loaded from Google Fonts. Self host it.
4. **Cartridge 3D model** (`assets/3d/cart.json`, `cart-base.jpg`, `cart-normal.jpg`): a low poly Game Boy shaped cartridge from a model site. Confirm the licence, and decide if a Nintendo shaped cartridge is fine or reskin it into an original shape.
5. **Wooden table** (`table.json`, `table-diff.jpg`, `table-normal.jpg`): Poly Haven style textures, believed CC0, confirm.
6. **Brick wall** (`brick-klein.jpg`, `brick-normal.jpg`): a brick texture recoloured to Klein blue. Confirm the source licence.
7. **three.js** (`vendor/three.min.js`, r149): MIT, keep the licence header.
8. **Game covers** (`assets/covers/`, 6 files) are screenshots of other people's games. Get permission from each team, or swap in art they send.
9. **Spring poster date:** "April 17 to 24" was written by the assistant, confirm it.

Ours (no action): the emblem art, the Fall and Spring posters and theme posters, the Fall Game Jam logo, the cartridge and menu copy.

### Content to add or change
1. **Spring games:** covers for 6 of 8 are screenshots taken from the itch.io pages and the running web builds (`assets/covers/`), descriptions for the same 6 are paraphrased from the itch pages. Robo Chef (page is password protected) and Nazi Excape (page not public) still need a description and a square cover. 8 real entries are in `data.js` (Drill Game, Purrfectly Unbuilt, Nazi Excape, Opposite Day, Robo Chef, Pop Culture Jam, Palindome, Flip Ray). Titles and team handles came from the itch.io links because the pages could not be fetched. Still needed per game: real title spelling (check "Nazi Excape"), description, credits with real names and roles, and a square cover image. The Drill Game link is a private secret link, swap it for the public page once it is live.
2. **Fall games:** 12 placeholders. Add the real submissions when the jam ends.
3. **Eboard:** 9 real members are in `U.BOARD` (names, roles and favorite game lines from the eboard sheet). Yash has his portrait (`assets/img/team/yash-laad.jpg`). For the others, add a 4 by 5 portrait (800 by 1000 works) to `assets/img/team/` and set `photo` per member, until then a pixel silhouette shows.
4. **Resources:** 5 slide decks listed, all show "Soon". Yash will add them once adding is easy, so build a simple way to add a deck (a content file or CMS entry with title, date and PDF).
5. **Instagram:** `instagram.com/umassgamedev` confirmed correct.
6. **Final jam name,** judges and prizes (not decided yet).
7. **Blank posters** ("Your Poster Here") on the wall: replace as new jams are planned or remove.

### Things to change for full website functionality
1. **Hosting and domain:** serve over https, pick the domain, set up the deploy (static host such as Netlify, Vercel or GitHub Pages).
2. **Hash routes to real routes:** `#home`, `#games` and so on work as is. For real URLs and sharing, add host rewrites and pushState paths.
3. **SEO and sharing:** page title and description per route, Open Graph image, favicon, `robots.txt` and a sitemap.
4. **Crawlable content:** the games and jams live in canvases. Add a visually hidden list (or list view) of jams and games so search engines and screen readers get them.
5. **Popup blocker** on the cartridge itch.io link, see section 7 item 1.
6. **Self host fonts** and compress textures (section 7 items 4 and 5).
7. **Phones:** test the 3D screens, the corner menu and Back button on real devices.
8. **WebGL fallback** list view for devices without WebGL.
9. **Content out of the code:** move `data.js` to a content file or CMS so editors do not touch JavaScript.
10. **Analytics and cookie notice** if wanted. Nothing is tracked right now.
11. **Registration form link** (Google Form) stays in the menu footer, update it after the jam.
12. **Public copy rule:** keep "not for kids, anyone under 16 needs an accompanying adult" on any jam page.

## Home photo physics
The home photo trail (`js/home-view.js`) is a small physics sim. Photos float where they land (no gravity), slide to a stop with drag, bounce off the screen edges and push each other apart. The cursor is a pusher: move it through the pile and photos get shoved, kicked and spun. Tune `GRAV` (0 now), `DRAG`, `BOUNCE`, `LIFE` and `MAXN` at the top of the physics block. Fine pointers only, skipped on touch and for reduced motion.
