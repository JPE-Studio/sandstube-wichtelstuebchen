// @ts-check
import { defineConfig } from 'astro/config';

// SandStube & Wichtelstübchen – statische Papierwelt-Seite
// Build-Output: ./dist (statisches HTML, von Coolify Static Build Pack serviert)
export default defineConfig({
  site: 'https://sandstube-siegen.de',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // Saubere URLs: /sandstube statt /sandstube.html
    format: 'directory',
  },
});
