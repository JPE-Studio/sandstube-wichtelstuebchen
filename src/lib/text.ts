import { marked } from 'marked';

/* ------------------------------------------------------------------
 * Text-Helfer für CMS-Inhalte
 *
 * Maria schreibt im Decap-Editor einfaches Markdown. Diese drei
 * Funktionen übersetzen es in genau das HTML, das das Papierwelt-CSS
 * erwartet – damit sie das Design nicht versehentlich zerlegen kann.
 * Alles läuft zur Build-Zeit, es landet kein Markdown-Code im Browser.
 * ------------------------------------------------------------------ */

/** HTML-Sonderzeichen entschärfen, bevor eigenes Markup eingesetzt wird. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Überschriften.
 *   Zeilenumbruch  → <br>
 *   **Wort**       → <span class="mark">Wort</span>  (der gemalte Schwung)
 *
 * Bewusst kein volles Markdown: In Überschriften gibt es genau diese
 * eine Auszeichnung, deshalb ist ** hier eindeutig der Schwung.
 */
export function heading(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<span class="mark">$1</span>')
    .replace(/\r?\n/g, '<br>');
}

/**
 * Externe Links öffnen in einem neuen Tab – mit rel="noopener" gegen
 * das Reverse-Tabnabbing. Interne Links (/…, #…, mailto:) bleiben normal.
 */
function externalLinks(html: string): string {
  return html.replace(
    /<a href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener"'
  );
}

/**
 * Fließtext innerhalb eines bestehenden Absatzes (kein <p>-Wrapper).
 * Erlaubt **fett**, *kursiv* und [Links](…).
 */
export function rich(value: string): string {
  return externalLinks(marked.parseInline(value ?? '', { async: false }) as string);
}

/**
 * Mehrere Absätze (Rechtstexte). Erzeugt <p>, <ul>, <a> usw.
 * `breaks: true` – ein einfacher Zeilenumbruch wird zu <br>, damit
 * Adressblöcke so aussehen, wie Maria sie eintippt.
 */
export function blocks(value: string): string {
  return externalLinks(marked.parse(value ?? '', { async: false, breaks: true }) as string);
}

/**
 * Ersetzt {{platzhalter}} durch die zentralen Stammdaten aus site.json.
 * So steht die Adresse nur an einer Stelle, taucht aber im Impressum
 * und in der Datenschutzerklärung auf.
 */
export function fill(value: string, values: Record<string, string>): string {
  return (value ?? '').replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (match, key) => values[key] ?? match
  );
}
