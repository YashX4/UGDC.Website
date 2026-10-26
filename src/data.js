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
  instagram: 'https://www.instagram.com/umassgamedev/',
  linkedin: 'https://www.linkedin.com/company/umassgamedev/'
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
   games[]: title, team, desc, credits [{name, role, social}], link (itch.io url, empty = none yet),
            social is optional: any profile url (Instagram, LinkedIn, itch, site). With it the name is a link.
            cover (square image path/url, centre cropped onto the cartridge label, empty = placeholder),
            color (cartridge plastic hex, optional, falls back to a rotating Klein palette),
            winner: true puts the pixel crown next to the title in place of the heart, and winners always come first on the table
   Credits come from each itch.io page. When a page names one creator and no roles, that person gets SOLO. */
var SOLO = 'Art, code, sound';
function solo(name) { return [{ name: name, role: SOLO }]; }
/* blank cartridges for a jam whose games are not in yet. They never show on the Games tab. */
function placeholders(n) {
  var list = [];
  for (var i = 0; i < n; i++) {
    var num = (i < 9 ? '0' : '') + (i + 1);
    list.push({ title: '[GAME TITLE ' + num + ']', team: '', desc: '[Submissions land here soon.]', credits: [], link: '', cover: '', color: '', placeholder: true });
  }
  return list;
}
export const JAMS = {
  'fall-2026': { title: 'Fall Game Jam 2026', games: [
    { title: "The Witch's Tarot", team: 'Shuchi', desc: "A pixel art deduction puzzle. Play Witch Kitty, read the cards and pick your poison to win an old witch's tarot deck.",
      credits: [{ name: 'Shuchi Mishra', role: 'Design, writing, code, art', social: 'https://shuchi123.itch.io' }],
      link: 'https://shuchi123.itch.io/witches-tarot', cover: 'assets/covers/fall-witches-tarot.jpg', color: '' },
    { title: 'Toxic Relationships', team: 'Mark Brothers', desc: 'A tabletop card game. Poison everyone else at the party to be the last spy standing.',
      credits: [{ name: 'Ian Mark', role: 'Design, art' }, { name: 'Tristan Mark', role: 'Design, art' }],
      link: 'https://mister-coolest.itch.io/toxic-relationships', cover: '', color: '' },
    { title: 'Last One Standing', team: 'Jason', desc: 'A horror TTRPG. Survivor meets Cthulhu.',
      credits: [{ name: 'Jason Mark', role: 'Everything' }],
      link: 'https://bobhope1999.itch.io/last-standing', cover: 'assets/covers/fall-last-one-standing.jpg', color: '' },
    { title: 'Calamitous Cat', team: 'Quinn Bracken', desc: "Play as a cat knocking bottles of poison off the shelves and wrecking someone's room!",
      credits: [{ name: 'Quinn Bracken', role: 'Programming, art, design' }],
      link: 'https://qbrack.itch.io/calamitous-cat', cover: 'assets/covers/fall-calamitous-cat.jpg', color: '' },
    { title: 'Dungeon of Verdicts', team: 'Dungeon', desc: 'You are the king of a dungeon. Every choice improves it... or destroys it.',
      credits: [{ name: 'Jason Wang', role: 'Game design, text and balance', social: 'https://muchenjy.itch.io/' }, { name: 'Zhi Yuan Pan', role: 'Co game designer' }, { name: 'Naing Min Khant', role: 'Programmer' }, { name: 'Andrew Alekseyev', role: 'Programmer' }],
      link: 'https://andrew-alekseyev-games.itch.io/dungeon-of-verdicts', cover: 'assets/covers/fall-dungeon-of-verdict.jpg', color: '' },
    { title: 'Poisons, Please!', team: 'Rocazulu', desc: "You're the poison chef for a bunch of rude and impatient assassins. Good luck.",
      credits: [{ name: 'Calvin Ellsworth', role: 'Lead programmer', social: 'https://itch.io/profile/theesteemed' }, { name: 'Rohan Sharma', role: 'Artist', social: 'https://rohbot.itch.io/' }, { name: 'Lucas Sardone', role: 'Music and sound', social: 'https://soundcloud.com/tastheartast' }, { name: 'Zubin Gupta', role: 'Programmer' }],
      link: 'https://theesteemed.itch.io/poisons-please', cover: 'assets/covers/fall-poisons-please.jpg', color: '' },
    { title: 'Take your meds.', team: 'Jared', desc: 'An arcade puzzle game where you clear dots from the screen by taking your meds.',
      credits: [{ name: 'Jared Cole', role: 'Art, code, sound' }],
      link: 'https://jc-cole.itch.io/take-your-meds', cover: 'assets/covers/fall-take-your-meds.jpg', color: '' },
    { title: 'Poisonous Odds', team: 'SHAL', desc: 'A game of skill and chance against DrSatan. Take sips of the poison to scout and survive the odds.',
      credits: [{ name: 'Harris Kyaw', role: 'Programmer' }, { name: 'Samarth Rao', role: 'Programmer' }, { name: 'Ashley Lau', role: 'Artist' }, { name: 'Luke Autio', role: 'Artist' }],
      link: 'https://kyawva.itch.io/poisonous-odds', cover: 'assets/covers/fall-poisonous-odds.jpg', color: '' },
    { title: 'Witch Hunt', team: 'Blake Harper and Eldar Yaharou', desc: 'The last witch left alive. Blend in, deceive the townsfolk and harvest ingredients for unique spells.',
      credits: [{ name: 'Blake Harper', role: 'Programmer', social: 'https://www.instagram.com/bharper714/' }, { name: 'Eldar Yaharou', role: 'Artist, sound' }],
      link: 'https://blakrr.itch.io/witch-hunt', cover: 'assets/covers/fall-witch-hunt.jpg', color: '' },
    { title: 'YAGOL', team: 'Duy Nguyen', desc: 'Kill a patient you hate with pathogens! Mix 3 chemicals, resist immune attacks and deliver death at all costs.',
      credits: [{ name: 'Duy Nguyen', role: 'Everything', social: 'https://ribosome.itch.io/' }],
      link: 'https://ribosome.itch.io/yagol', cover: 'assets/covers/fall-yagol.jpg', color: '' },
    { title: 'Alchemist of Aevyria', team: '7 Game Dev Gambit', desc: 'A puzzle game where you diagnose your clients and brew their elixirs. But not all potions exist to heal...',
      credits: [{ name: 'Josephine Noble', role: 'Programming, sound, design' }, { name: 'Fro De Agostini-Frometa', role: 'Programming, design' }, { name: 'Sadie Janks', role: 'Artist, designer, writer' }],
      link: 'https://7-game-dev-gambit.itch.io/alchemist-of-aevyria', cover: 'assets/covers/fall-alchemist.jpg', color: '' }
  ],
    /* shown at the foot of this jam's loading screens; any jam can have a list.
       logo: a white on transparent PNG in assets/sponsors/ (empty shows the name as text) */
    sponsors: [
      { name: 'Adobe', logo: 'assets/sponsors/adobe.png' },
      { name: "Antonio's Pizza", logo: 'assets/sponsors/antonios.png' },
      { name: 'Pioneer Valley Game Dev', logo: 'assets/sponsors/pvgd.png' },
      { name: 'Bueno y Sano', logo: 'assets/sponsors/bueno-y-sano.png' }
    ] },
  'spring-2026': { title: 'Spring Game Jam 2026', games: [
    { title: 'Drill Game', winner: true, team: 'Antidissmist', desc: 'Drill around, smack some things and maybe fight some robots.', credits: solo('Antidissmist'), link: 'https://antidissmist.itch.io/drill-game?secret=WVlC1mgEU6aHDWjPDkT65HizuE', cover: 'assets/covers/drill-game.jpg', color: '' },
    { title: 'Purrfectly Unbuilt', team: 'delayyy', desc: 'Play as a cat and destroy the house items before your owner returns.', credits: solo('delayyy'), link: 'https://delayyy.itch.io/purrfectly-unbuilt', cover: 'assets/covers/purrfectly-unbuilt.jpg', color: '' },
    { title: 'Nazi Excape Story', team: 'YashX4', desc: 'Bark, flip the lights and find the torch to reach the next level.', credits: solo('YashX4'), link: 'https://yashx4.itch.io/nazi-excape-story', cover: 'assets/covers/nazi-excape.jpg', color: '' },
    { title: 'Opposite Day', team: 'MelliMe', desc: 'Chat with your stressed out friends in a game that may or may not hold together.', credits: solo('MelliMe'), link: 'https://mellime.itch.io/opposite-day', cover: 'assets/covers/opposite-day.jpg', color: '' },
    { title: 'Pop Culture Jam', team: 'natanco', desc: 'Collect Yakult and spread the love of bacteria.', credits: solo('natanco'), link: 'https://natanco.itch.io/pop-culture-jam', cover: 'assets/covers/pop-culture-jam.jpg', color: '' },
    { title: 'Palindome', team: 'nullishew', desc: 'A two way stacking game where gravity flips. Build a tower, survive the flip and outrun the water.', credits: solo('nullishew'), link: 'https://nullishew.itch.io/palindome', cover: 'assets/covers/palindome.jpg', color: '' },
    { title: 'Flip Ray', team: 'Dollamenu', desc: 'Move with WASD, shoot with the arrow keys and share your time.', credits: solo('Dollamenu'), link: 'https://dollamenu.itch.io/flip-ray', cover: 'assets/covers/flip-ray.jpg', color: '' }
  ] }
};
/* the Games tab: every real game from every jam on one table, newest jam first in the list order above */
JAMS.games = { title: 'All Games', games: [].concat(JAMS['fall-2026'].games, JAMS['spring-2026'].games).filter(function (g) { return !g.placeholder; }) };
export const OPEN_ITCH_IN_NEW_TAB = true;


/* ---------- ABOUT: the eboard row and the photo stream ----------
   linkedin: profile url. Empty falls back to a LinkedIn search for the name until the real link is added */
export const BOARD = [
  { name: 'Yash Laad', role: 'President', desc: 'Favorite game: Pokemon B&W 2. It is foundational to a lot of what is wrong with me.', photo: 'assets/img/team/yash-laad.jpg', linkedin: 'https://www.linkedin.com/in/yash-laad-4b132a217/' },
  { name: 'Aparna Venkatesh', role: 'Vice President', desc: 'Favorite game: Call of Duty. It is a very essential part of my destress routine.', photo: 'assets/img/team/aparna-venkatesh.jpg', linkedin: '' },
  { name: 'Soha Haldikar', role: 'Treasurer', desc: 'Favorite game: Insomniac Spiderman. I am a huge Spiderman fan.', photo: 'assets/img/team/soha-haldikar.jpg', linkedin: '' },
  { name: 'Poorvi Goyal', role: 'Events Coordinator and Logistics', desc: 'Favorite game: Uncharted 4. It is the first game I ever played and I miss it.', photo: 'assets/img/team/poorvi-goyal.jpg', linkedin: '' },
  { name: 'Rohan Sharma', role: 'Freshman Representative', desc: 'Favorite game: N++. A slick and ingenious platformer.', photo: 'assets/img/team/rohan-sharma.jpg', linkedin: '' },
  { name: 'Amira White', role: 'Social Media', desc: 'Favorite game: Parappa The Rappa. It taught me how to believe!', photo: 'assets/img/team/amira-white.jpg', linkedin: '' },
  { name: 'Zhi Yuan Pan', role: 'Social Media and Videographer', desc: 'Favorite game: Roblox. It lets me play the games I do not wanna buy on Steam.', photo: 'assets/img/team/zhi-yuan-pan.jpg', linkedin: '' },
  { name: 'Duy Nguyen', role: 'Development Specialist', desc: 'Favorite game: Thief: The Dark Project. I love blackjacking Benny.', photo: 'assets/img/team/duy-nguyen.jpg', linkedin: '' },
  { name: 'Boden Harris', role: 'Development Specialist', desc: 'Favorite game: The Witness. Brutal puzzles and amazing graphics.', photo: 'assets/img/team/boden-harris.jpg', linkedin: '' },
  { name: 'Owen Donohoe', role: 'Developer', desc: 'Favorite game: Cult of the Lamb. A mix of story building, building, and dungeon game.', photo: 'assets/img/team/owen-donohoe.jpg', linkedin: '' }
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
   blank: true draws a "next jam" placeholder instead of an image (none on the wall right now). */
export const POSTERS = [
  { id: 'fall', title: 'Fall Game Jam 2026', date: 'October 23 to 25', theme: 'Theme: Pick Your Poison',
    front: 'assets/posters/fall.jpg', back: 'assets/posters/fall-theme.jpg', jam: 'fall-2026' },
  { id: 'spring', title: 'Spring Game Jam', date: 'April 17 to 24', theme: 'Theme: Inverted',
    front: 'assets/posters/spring.jpg', back: 'assets/posters/spring-theme.jpg', jam: 'spring-2026' }
];
export const WALL_START = 0; /* index of the poster centred when the wall opens */
