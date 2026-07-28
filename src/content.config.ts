import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ------------------------------------------------------------------
 * Content Collections für die SandStube & Wichtelstübchen
 *
 * Diese Schemas sind die SINGLE SOURCE OF TRUTH für die Felder,
 * die Maria im Decap CMS (/admin) sehen und bearbeiten kann.
 * Jede Änderung hier muss auch in public/admin/config.yml
 * nachgezogen werden (und umgekehrt).
 * ------------------------------------------------------------------ */

/* ---------- Teammitglieder ---------- */
const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    rolle: z.string(),
    foto: z.string(),
    reihenfolge: z.number().default(0),
  }),
});

export const collections = { team };
