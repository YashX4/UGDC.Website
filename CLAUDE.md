# CLAUDE.md

Project: UMass Game Dev Club website (proof of concept turned into the real site). Owner: Yash Laad. Read HANDOFF.md first, it is the source of truth.

## Rules

- Do not change how the approved screens look or move. This prototype is the design. Screenshot before and after every visual change.
- Palette is final, light only, no dark mode. Blue frames, orange pops once per screen, text is always ink, no other hues. Colors live in `css/tokens.css` only.
- Two typefaces only: Goethe (rasterized, see `js/pixel.js`) and Silkscreen. System captions are uppercase and in square brackets.
- Motion steps like old hardware. The pixel wipe is the page transition. Respect `prefers-reduced-motion`.
- No boxes around text on the 3D scenes. No instruction text. The table screen has no nav, only the corner plus.
- Copy: casual and direct, short sentences, NO dashes of any kind (no em dash, en dash, or hyphen used as punctuation or in compound words). Rewrite with separate words. Public copy must keep: not for kids, under 16 needs an accompanying adult.
- Content lives in `js/data.js`, never hard coded in views.
- Jam winners: mark the game `winner: true` in `src/data.js`. A winner shows the pixel crown in place of the heart, and winners always come first on every cartridge table (the table view sorts them to the front).
- Only one WebGL context alive at a time. Engines must be disposed on view unmount.
- The site must be served over http (not `file://`).

## Commands

- Serve: `npx serve -l 8080 .` or `python3 -m http.server 8080`
- There is no build step and no test suite yet. Add Playwright screenshot tests when the real project is set up.

## Where things are

See section 3 of HANDOFF.md for the file map and section 7 for known gaps. Ask the owner before deciding anything listed under "decide".
