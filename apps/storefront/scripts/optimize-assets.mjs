import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { readdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

const directory = resolve('src/assets/products');
const embedScript = resolve('.agents/skills/impeccable/scripts/embed-prompt.mjs');

for (const name of readdirSync(directory).filter(file => file.endsWith('.png'))) {
  const source = join(directory, name);
  const target = join(directory, name.replace(/\.png$/, '.webp'));
  const prompt = execFileSync(process.execPath, [embedScript, '--read', source], { encoding: 'utf8' }).trim();
  await sharp(source).resize({ width: name.startsWith('hero-') ? 1200 : 900, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 92, effort: 5 }).toFile(target);
  execFileSync(process.execPath, [embedScript, target, '--prompt', prompt], { stdio: 'inherit' });
  unlinkSync(source);
}

console.log('Packshot dioptimalkan ke WebP dan provenance dipertahankan.');
