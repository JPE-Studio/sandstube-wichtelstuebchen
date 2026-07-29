import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/*
 * Kopiert das Papierwelt-CSS nach public/admin/, damit die Vorschau im
 * Decap-Editor exakt dieselben Stile benutzt wie die fertige Seite.
 *
 * Läuft automatisch vor `npm run build` und `npm run dev` (npm-Hooks
 * "prebuild"/"predev"). Die Kopie ist generiert und steht in .gitignore –
 * damit gibt es weiterhin nur eine Quelle der Wahrheit.
 */
const dateien = [
  // Stile, damit die Vorschau aussieht wie die Seite
  ['src/styles/paperworld.css', 'public/admin/preview.css'],
  // Stammdaten, damit {{email}} & Co. auch in der Vorschau eingesetzt werden
  ['src/data/site.json', 'public/admin/site.json'],
  // Layout-Daten (Footer, Nav), damit {{jahr}} & {{wichtelkompass_url}} stimmen
  ['src/data/ui.json', 'public/admin/ui.json'],
];

for (const [von, nach] of dateien) {
  mkdirSync(dirname(nach), { recursive: true });
  copyFileSync(von, nach);
  console.log(`Vorschau aktualisiert: ${von} → ${nach}`);
}
