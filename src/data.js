/* ============================================================
   UMGD SITE DATA
   Everything an editor changes lives here: jams, posters, games, links.
   In the real build this becomes a content file or CMS collection.
   ============================================================ */

import SLIDES from './content/slides.json';

export const LINKS = {
  register: 'https://docs.google.com/forms/d/e/1FAIpQLSdA4lD9BzwX4RGVV_xasmu5-RuxoWZ03b2TdHLUO8iNusApDQ/viewform',
  discord: 'https://discord.gg/KpcNjcHaXu',
  jamDiscord: 'https://discord.gg/yYMbBbNmP4',
  instagram: 'https://www.instagram.com/umassgamedev/' /* CONFIRM the real handle */
};

/* Where each binary asset lives. Paths are relative to index.html. */
export const ASSETS = {
  wall: { brick: 'assets/3d/brick-klein.jpg', brickNormal: 'assets/3d/brick-normal.jpg' },
  table: {
    cart: 'assets/3d/cart.json', cartBase: 'assets/3d/cart-base.jpg', cartNormal: 'assets/3d/cart-normal.jpg',
    table: 'assets/3d/table.json', tableDiff: 'assets/3d/table-diff.jpg', tableNormal: 'assets/3d/table-normal.jpg'
  },
  trail: (function () { var t = []; for (var i = 1; i <= 14; i++) t.push('assets/img/trail-' + i + '.jpg'); return t; })()
};

/* ---------- JAMS: one entry per jam that has a cartridge table ----------
   key = the route token (#fall-2026)
   games[]: title, team, desc, credits [{name, role}], link (itch.io url, empty = none yet),
            cover (square image path/url, centre cropped onto the cartridge label, empty = placeholder),
            color (cartridge plastic hex, optional, falls back to a rotating Klein palette) */
function placeholders(n) {
  var list = [];
  for (var i = 0; i < n; i++) {
    var num = (i < 9 ? '0' : '') + (i + 1);
    list.push({
      title: '[GAME TITLE ' + num + ']', team: '[TEAM NAME]',
      desc: '[One or two lines about the game.]',
      credits: [{ name: '[NAME]', role: '[ROLE]' }, { name: '[NAME]', role: '[ROLE]' }, { name: '[NAME]', role: '[ROLE]' }],
      link: '', cover: '', color: ''
    });
  }
  return list;
}
export const JAMS = {
  'fall-2026': { title: 'Fall Game Jam 2026', games: placeholders(12) },
  'spring-2026': { title: 'Spring Game Jam 2026', games: [
    { title: 'Drill Game', team: 'antidissmist', desc: 'Drill around, smack some things and maybe fight some robots.', credits: [{ name: 'antidissmist', role: 'Creator' }], link: 'https://antidissmist.itch.io/drill-game?secret=WVlC1mgEU6aHDWjPDkT65HizuE', cover: 'assets/covers/drill-game.jpg', color: '' },
    { title: 'Purrfectly Unbuilt', team: 'delayyy', desc: 'Play as a cat and destroy the house items before your owner returns.', credits: [{ name: 'delayyy', role: 'Creator' }], link: 'https://delayyy.itch.io/purrfectly-unbuilt', cover: 'assets/covers/purrfectly-unbuilt.jpg', color: '' },
    { title: 'Nazi Excape', team: 'yashx4', desc: '[One or two lines about the game.]', credits: [{ name: 'yashx4', role: 'Creator' }], link: 'https://yashx4.itch.io/nazi-excape-', cover: '', color: '' },
    { title: 'Opposite Day', team: 'mellime', desc: 'Chat with your stressed out friends in a game that may or may not hold together.', credits: [{ name: 'mellime', role: 'Creator' }], link: 'https://mellime.itch.io/opposite-day', cover: 'assets/covers/opposite-day.jpg', color: '' },
    { title: 'Robo Chef', team: 'frumsy', desc: '[One or two lines about the game.]', credits: [{ name: 'frumsy', role: 'Creator' }], link: 'https://frumsy.itch.io/robo-chef', cover: '', color: '' },
    { title: 'Pop Culture Jam', team: 'natanco', desc: 'Collect Yakult and spread the love of bacteria.', credits: [{ name: 'natanco', role: 'Creator' }], link: 'https://natanco.itch.io/pop-culture-jam', cover: 'assets/covers/pop-culture-jam.jpg', color: '' },
    { title: 'Palindome', team: 'nullishew', desc: 'A two way stacking game where gravity flips. Build a tower, survive the flip and outrun the water.', credits: [{ name: 'nullishew', role: 'Creator' }], link: 'https://nullishew.itch.io/palindome', cover: 'assets/covers/palindome.jpg', color: '' },
    { title: 'Flip Ray', team: 'dollamenu', desc: 'Move with WASD, shoot with the arrow keys and share your time.', credits: [{ name: 'dollamenu', role: 'Creator' }], link: 'https://dollamenu.itch.io/flip-ray', cover: 'assets/covers/flip-ray.jpg', color: '' }
  ] } /* titles and teams come from the itch.io links, descriptions and covers still to add */
};
/* the Games tab: every jam's cartridges on one table, newest jam first in the list order above */
JAMS.games = { title: 'All Games', games: [].concat(JAMS['fall-2026'].games, JAMS['spring-2026'].games) };
export const OPEN_ITCH_IN_NEW_TAB = true;


/* ---------- ABOUT: the eboard row and the photo stream ---------- */
export const BOARD = [
  { name: 'Yash Laad', role: 'President', desc: 'Favorite game: Pokemon B&W 2. It is foundational to a lot of what is wrong with me.', photo: 'assets/img/team/yash-laad.jpg' },
  { name: 'Soha Haldikar', role: 'Treasurer', desc: 'Favorite game: Insomniac Spiderman. I am a huge Spiderman fan.', photo: 'assets/img/team/soha-haldikar.jpg' },
  { name: 'Poorvi Goyal', role: 'Events Coordinator and Logistics', desc: 'Favorite game: Uncharted 4. It is the first game I ever played and I miss it.', photo: 'assets/img/team/poorvi-goyal.jpg' },
  { name: 'Rohan Sharma', role: 'Freshman Representative', desc: 'Favorite game: N++. A slick and ingenious platformer.', photo: 'assets/img/team/rohan-sharma.jpg' },
  { name: 'Amira White', role: 'Social Media', desc: 'Favorite game: Parappa The Rappa. It taught me how to believe!', photo: 'assets/img/team/amira-white.jpg' },
  { name: 'Zhi Yuan Pan', role: 'Social Media and Videographer', desc: 'Favorite game: Roblox. It lets me play the games I do not wanna buy on Steam.', photo: 'assets/img/team/zhi-yuan-pan.jpg' },
  { name: 'Duy Nguyen', role: 'Development Specialist', desc: 'Favorite game: Thief: The Dark Project. I love blackjacking Benny.', photo: 'assets/img/team/duy-nguyen.jpg' },
  { name: 'Boden Harris', role: 'Development Specialist', desc: 'Favorite game: The Witness. Brutal puzzles and amazing graphics.', photo: 'assets/img/team/boden-harris.jpg' },
  { name: 'Owen Donohoe', role: 'Developer', desc: 'Favorite game: Cult of the Lamb. A mix of story building, building, and dungeon game.', photo: 'assets/img/team/owen-donohoe.jpg' }
];
export const ABOUT_STREAM = [];
for (var s = 1; s <= 20; s++) ABOUT_STREAM.push('assets/img/about/stream-' + s + '.jpg');

/* ---------- RESOURCES: slide decks live in content/slides.json ----------
   Each deck: title, date, pages, pdf (empty shows "Soon"), cover (slide 1, shown on hover).
   Add one with: npm run add-deck -- path/to/deck.pdf "Deck title" "Nov 2026" */
export { SLIDES };

/* ---------- POSTERS: the wall, left to right ----------
   front: poster image. back: theme poster shown on the flip (empty = placeholder).
   jam: key into JAMS, or '' when that jam has no cartridge page yet (the poster is then not clickable).
   blank: true draws a "next jam" placeholder instead of an image. */
export const POSTERS = [
  { id: 'fall', title: 'Fall Game Jam 2026', date: 'October 23 to 25', theme: 'Theme: Pick Your Poison',
    front: 'assets/posters/fall.jpg', back: 'assets/posters/fall-theme.jpg', jam: 'fall-2026' },
  { id: 'spring', title: 'Spring Game Jam', date: 'April 17 to 24', theme: 'Theme: Inverted',
    front: 'assets/posters/spring.jpg', back: 'assets/posters/spring-theme.jpg', jam: 'spring-2026' },
  { id: 'next1', blank: true, title: 'Your Poster Here', date: 'Date to be announced', theme: '', front: '', back: '', jam: '' },
  { id: 'next2', blank: true, title: 'Your Poster Here', date: 'Date to be announced', theme: '', front: '', back: '', jam: '' },
  { id: 'next3', blank: true, title: 'Your Poster Here', date: 'Date to be announced', theme: '', front: '', back: '', jam: '' }
];
export const WALL_START = 0; /* index of the poster centred when the wall opens */
