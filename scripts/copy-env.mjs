// Copies example env files to their real names if missing, so `npm run setup` is one command.
// © 2026 Mohamed Marwen Maalawi
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['backend/.env.example', 'backend/.env'],
  ['frontend/.env.example', 'frontend/.env.local'],
];

for (const [from, to] of pairs) {
  const dest = join(root, to);
  if (existsSync(dest)) {
    console.log(`✓ ${to} existe déjà`);
    continue;
  }
  copyFileSync(join(root, from), dest);
  console.log(`✓ ${to} créé depuis ${from}`);
}
