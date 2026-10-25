/* Add a slide deck to the Resources page.
     npm run add-deck -- path/to/deck.pdf "Deck title" "Nov 2026"
   Copies the PDF to public/assets/slides/, renders slide 1 as the hover cover, counts the pages and puts the deck at the
   top of src/content/slides.json. If a "Soon" row has the same title, it is replaced. Needs poppler (brew install poppler). */
import { execFileSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [pdf, title, date] = process.argv.slice(2);
if (!pdf || !title || !date) {
  console.error('usage: npm run add-deck -- path/to/deck.pdf "Deck title" "Nov 2026"');
  process.exit(1);
}
const root = resolve(import.meta.dirname, '..');
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').join('-');
const dir = resolve(root, 'public/assets/slides');
mkdirSync(dir, { recursive: true });

copyFileSync(pdf, resolve(dir, slug + '.pdf'));
execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-scale-to-x', '800', '-scale-to-y', '-1', '-jpeg', '-jpegopt', 'quality=82', '-singlefile', pdf, resolve(dir, slug)]);
const pages = +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1];

const file = resolve(root, 'src/content/slides.json');
const list = JSON.parse(readFileSync(file, 'utf8')).filter((s) => !(s.title === title && !s.pdf));
list.unshift({ title, date, pages, pdf: `assets/slides/${slug}.pdf`, cover: `assets/slides/${slug}.jpg` });
writeFileSync(file, '[\n' + list.map((s) => '  ' + JSON.stringify(s).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/^\{/, '{ ').replace(/\}$/, ' }')).join(',\n') + '\n]\n');
console.log(`added "${title}" (${pages} slides) as assets/slides/${slug}.pdf`);
