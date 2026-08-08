import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/*
 * Kopiert das Sveltia-CMS-Bundle aus node_modules nach public/admin/, damit
 * der Editor lokal (self-hosted) statt von einem CDN geladen wird.
 *
 * Läuft automatisch vor `npm run build` und `npm run dev` (npm-Hooks
 * "prebuild"/"predev"). Die Kopie ist generiert und steht in .gitignore –
 * damit gibt es weiterhin nur eine Quelle der Wahrheit (das npm-Paket).
 */
const dateien = [
  // Sveltia-CMS – moderner, Drop-in-Nachfolger von Decap CMS
  ['node_modules/@sveltia/cms/dist/sveltia-cms.js', 'public/admin/sveltia-cms.js'],
];

for (const [von, nach] of dateien) {
  mkdirSync(dirname(nach), { recursive: true });
  copyFileSync(von, nach);
  console.log(`Admin-Assets aktualisiert: ${von} → ${nach}`);
}
