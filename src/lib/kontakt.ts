import site from '../data/site.json';

/* ------------------------------------------------------------------
 * Kontakt-Helfer für Telefon & WhatsApp
 *
 * Die Nummer steht einmalig in src/data/site.json (CMS-pflegbar) im
 * deutschen Format, z. B. „0176 96186003“. tel:-Links und wa.me
 * brauchen aber die internationale Form ohne Sonderzeichen –
 * diese Helfer leiten beides zur Build-Zeit daraus ab.
 * ------------------------------------------------------------------ */

/** 0176 96186003 → 4917696186003 */
const ziffern = (site.kontakt.telefon ?? '').replace(/\D/g, '').replace(/^0/, '49');

/** Erst wahr, wenn im CMS wirklich eine Nummer eingetragen ist. */
export const telefonVorhanden = ziffern.length >= 8;

/** Anruf-Link: tel:+4917696186003 */
export const telHref = telefonVorhanden ? `tel:+${ziffern}` : '';

/** WhatsApp-Chat-Link ohne vorbelegte Nachricht. */
export const waHref = telefonVorhanden ? `https://wa.me/${ziffern}` : '';

/** WhatsApp-Chat-Link mit vorbelegter Nachricht. */
export function waChat(text: string): string {
  return `${waHref}?text=${encodeURIComponent(text)}`;
}
