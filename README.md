# SandStube & Wichtelstübchen Siegen

Statische Webseite (Astro) mit Decap CMS für redaktionelle Pflege, deploybar auf Coolify.

- **Frontend:** Astro (Static Site Generator) — Papierwelt-Designsystem aus 6 handgeschriebenen HTML-Seiten 1:1 übernommen
- **CMS:** [Decap CMS](https://decapcms.org/) unter `/admin` — Inhalte liegen als Markdown/JSON im Repo (Git-basiert)
- **Hosting:** [Coolify](https://coolify.io/) via Dockerfile (Nginx + statische Dateien, ~10–20 MB RAM)

## Lokale Entwicklung

```bash
npm install
npm run dev      # Dev-Server unter http://localhost:4321
npm run build    # statischen Build nach ./dist
npm run preview  # gebauten Build lokal anschauen
```

## Inhalte bearbeiten (für Maria)

1. Gehe zu `https://eure-domain.de/admin`
2. Mit GitHub einloggen (über den konfigurierten OAuth-Proxy)
3. Teammitglieder, Preise, Zeiten, Kontaktdaten lassen sich dort ändern
4. Nach „Veröffentlichen“ baut Coolify automatisch neu und die Änderung ist live

**Lokales CMS-Testen** (ohne GitHub): in einem zweiten Terminal `npx decap-server`
starten, dann `http://localhost:4321/admin` öffnen. In `public/admin/config.yml`
ist `local_backend: true` dafür aktiviert.

## Deployment auf Coolify

### 1. Webseite deployen
1. In Coolify: **New Resource → Public/Private Repository** → dieses Repo wählen
2. **Build Pack: Dockerfile** (die `Dockerfile` im Repo Root wird automatisch erkannt)
3. **Domain** + **Let's Encrypt HTTPS** in Coolify konfigurieren
4. Coolify baut das Image (`npm run build` → Nginx serviert `dist/`)

### 2. Auto-Deploy (damit Marias CMS-Änderungen live gehen)
- In Coolify: **Settings → Webhooks** → URL kopieren
- In GitHub: **Repo → Settings → Webhooks → Add webhook**
  - Payload URL: die Coolify-Webhook-URL
  - Content type: `application/json`
  - Trigger: „Just the push event“
- Jeder Push (auch Decap-Commits aus `/admin`) löst nun einen Rebuild aus

### 3. OAuth-Proxy für Decap CMS (einmalig)
Damit Maria sich ohne technische GitHub-Kenntnisse einloggt, braucht Decap einen
OAuth-Proxy. Empfehlung: [`decap-cms-oauth-provider`](https://github.com/samkap/decap-cms-oauth-provider)
oder [`astro-decap-cms-oauth`](https://github.com/dorukgezici/astro-decap-cms-oauth).

1. In GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://eure-domain.de`
   - Authorization callback URL: `https://auth.eure-domain.de/callback`
2. OAuth-Proxy als eigenes Mini-Service in Coolify deployen (eigene Subdomain)
3. Client ID + Secret als Umgebungsvariablen im Proxy-Service setzen
4. In `public/admin/config.yml` die `base_url` auf die Proxy-URL anpassen

## Architektur

```
Maria → /admin (Decap UI) → [OAuth-Proxy] → GitHub-Repo (Markdown + JSON + Bilder)
                                                    ↓ (Push-Webhook)
                                              Coolify-Build (Dockerfile)
                                                    ↓
                                          Nginx serviert dist/ (~15 MB RAM)
```

**Warum kein Datenbank-CMS?** Inhalte als Git-Dateien = kostenloses Backup,
volle Versionshistorie jeder Änderung, minimaler Ressourcenverbrauch.

## Struktur

```
src/
├── components/     Header.astro, Footer.astro
├── content/team/   Teammitglieder als Markdown (CMS-pflegbar)
├── data/site.json  Kontakt, Preise, Zeiten (CMS-pflegbar)
├── layouts/        BaseLayout.astro (HTML-Gerüst)
├── pages/          6 Seiten: index, sandstube, wichtelstuebchen, team, impressum, datenschutz
├── scripts/app.js  Burger-Menu + Scroll-Reveal (vanilla JS)
└── styles/paperworld.css  Papierwelt-Designsystem (unverändert übernommen)
public/
├── admin/          Decap CMS (index.html + config.yml)
└── images/         Alle Bilder
```
