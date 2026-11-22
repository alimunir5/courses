// Génère les icônes PNG / ICO à partir de icons/icon.svg (à relancer seulement si le logo change).
// Pas de dépendance dans ce dépôt : sharp et sharp-ico sont empruntés à un projet voisin
// (par défaut ../muscu/node_modules, ou le dossier donné par SHARP_FROM).
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const from = path.resolve(process.env.SHARP_FROM ?? path.join(root, '../muscu/node_modules'));
const require = createRequire(path.join(from, 'noop.js'));
const sharp = require('sharp');
const ico = require('sharp-ico');

const svg = await readFile(path.join(root, 'icons/icon.svg'));
const png = (size) => sharp(svg, { density: 300 }).resize(size, size).flatten({ background: '#000000' }).png();

for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await png(size).toFile(path.join(root, 'icons', file));
}
await writeFile(path.join(root, 'icons/favicon.ico'), ico.encode(await Promise.all([16, 32, 48].map((s) => png(s).toBuffer()))));
console.log('Icônes générées.');
