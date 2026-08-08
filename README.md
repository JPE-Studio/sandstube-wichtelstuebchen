# SandStube & Wichtelstübchen Siegen

Statische Webseite (Astro) mit Sveltia CMS für redaktionelle Pflege, deploybar auf Coolify.

- **Frontend:** Astro (Static Site Generator) — Papierwelt-Designsystem aus 6 handgeschriebenen HTML-Seiten 1:1 übernommen
- **CMS:** [Sveltia CMS](https://sveltia.dev/) unter `/admin` — Inhalte liegen als Markdown/JSON im Repo (Git-basiert). Sveltia ist der moderne, Drop-in-Nachfolger von Decap CMS und nutzt dieselbe `config.yml`.
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
3. Nach „Veröffentlichen“ baut Coolify automatisch neu und die Änderung ist live

Bearbeitbar sind drei Bereiche:

| Bereich | Inhalt |
|---|---|
| **Seiten** | Alle Texte und Bilder der sechs Seiten – Überschriften, Absätze, Aufzählungen, Buttons, Galerien, Impressum und Datenschutz |
| **Team** | Personen anlegen, löschen und bearbeiten (Name, Rolle, Foto, Reihenfolge, Text) |
| **Einstellungen** | Kontaktdaten, Adresse, Betreuungszeiten, Ticketpreise und TidyCal-Pfade |

Nicht über das CMS änderbar sind Layout, Farben, Navigation und Fußzeile –
das sind bewusst Entwickler-Themen.

### Schreibweisen in den Textfeldern

| Eingabe | Ergebnis |
|---|---|
| `**Wort**` in einer **Überschrift** | der handgemalte Schwung darunter |
| `**Wort**` in einem **Fließtext** | fett |
| `[Text](https://…)` | Link (externe Links öffnen automatisch in neuem Tab) |
| Zeilenumbruch in einer Überschrift | neue Zeile |
| `{{email}}`, `{{strasse}}`, `{{plz_ort}}`, `{{inhaberin}}` | wird in Impressum und Datenschutz automatisch aus den Einstellungen eingesetzt |

Zwei Schalter sind praktisch: der **Saison-Hinweis** auf der SandStube-Seite
(Sommerpause ein-/ausblenden) und die gelben **Warnkästen** in Impressum und
Datenschutz – die abschalten, sobald die Texte geprüft sind.

**Lokales CMS-Testen:** Sveltia CMS unterstützt keinen lokalen Proxy-Server
(`decap-server`/`local_backend` wird ignoriert). Zum Testen der Redaktion die
Seite deployen und `/admin` dort öffnen, oder gegen einen Test-Branch arbeiten.

## Deployment auf Coolify

Aktuell live unter **https://sandstube.jpe-studio.dev**

### 1. Webseite deployen
1. In Coolify: **New Resource → Public/Private Repository** → dieses Repo wählen
2. **Build Pack: Dockerfile** (die `Dockerfile` im Repo Root wird automatisch erkannt)
3. **Domain** + **Let's Encrypt HTTPS** in Coolify konfigurieren
4. ⚠️ **Ports Exposes: `80`** — Nginx im Container lauscht auf 80. Steht hier
   ein anderer Wert, läuft der Container zwar, aber der Proxy davor liefert
   **502**, weil er ins Leere routet.

### 2. Auto-Deploy
Läuft bereits über die **GitHub-App-Integration** von Coolify: Jeder Push auf
`main` startet automatisch einen Rebuild – auch die Commits, die Sveltia beim
Veröffentlichen aus `/admin` heraus erzeugt. Ein zusätzlicher Repo-Webhook ist
dafür **nicht** nötig.

### 3. Admin-Bereich freischalten (einmalig)

**Warum überhaupt ein Extra-Dienst?** Sveltia speichert Änderungen als Git-Commits
auf GitHub. GitHub verlangt beim Login zwingend ein *Client-Secret* – und das
darf nicht in einer statischen Seite stehen, die jeder im Browser auslesen kann.
Deshalb übernimmt ein winziger Vermittler-Dienst diesen Austausch. Ein reines
Passwort-Feld ohne GitHub ist im GitHub-Backend nicht vorgesehen.

**Was Maria davon merkt:** nichts. Sie öffnet `/admin`, klickt einmal auf
„Login with GitHub", tippt E-Mail + Passwort ihres GitHub-Kontos – fertig.
Die Sitzung bleibt bestehen, danach ist es ein einziger Klick.

#### 3.1 GitHub-Konto für Maria
Maria braucht ein GitHub-Konto mit Schreibrechten auf dieses Repo:
**Repo → Settings → Collaborators → Add people** (Rolle: *Write*).
Die Zugangsdaten dieses Kontos sind das „Passwort", das sie sich merken muss.

#### 3.2 GitHub-OAuth-App anlegen
**GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**

| Feld | Wert |
|---|---|
| Application name | `SandStube CMS` |
| Homepage URL | `https://sandstube.jpe-studio.dev` |
| Authorization callback URL | `https://sandstube-auth.jpe-studio.dev/callback` |

Danach **Client ID** notieren und **Generate a new client secret** → Secret
sofort kopieren (es wird nur einmal angezeigt).

#### 3.3 Vermittler-Dienst in Coolify deployen
1. **New Resource → Docker Compose** → dieses Repo
2. Compose-Datei: `/docker-compose.oauth.yml`
3. **Domain:** `sandstube-auth.jpe-studio.dev` (+ Let's Encrypt)
4. ⚠️ **Ports Exposes: `80`** — gleiche Falle wie bei der Webseite
5. **Environment Variables:**
   - `OAUTH_GITHUB_CLIENT_ID` = Client ID aus 3.2
   - `OAUTH_GITHUB_CLIENT_SECRET` = Secret aus 3.2 → **„Is Secret" anhaken**

#### 3.4 Prüfen
```bash
curl -sI "https://sandstube-auth.jpe-studio.dev/auth?provider=github" | head -3
```
Erwartet: **301** mit `Location:` auf `github.com/login/oauth/authorize…`.
Kommt 502 → Ports Exposes prüfen. Kommt 400 → Client ID/Secret prüfen.

Danach `https://sandstube.jpe-studio.dev/admin` öffnen und einloggen.

> Ändert sich die Domain des Vermittlers, muss `base_url` in
> `public/admin/config.yml` **und** die Callback-URL der OAuth-App mitgeändert
> werden – beide müssen exakt übereinstimmen.

## Architektur

```
Maria → /admin (Sveltia UI) → OAuth-Vermittler → GitHub-Repo (Markdown + JSON + Bilder)
        sandstube.jpe-        sandstube-auth.              ↓ (GitHub-App-Integration)
        studio.dev            jpe-studio.dev         Coolify-Build (Dockerfile)
                              (compose.oauth)              ↓
                                                   Nginx serviert dist/ auf Port 80
```

Zwei getrennte Coolify-Resources: die Webseite (dieses `Dockerfile`) und der
OAuth-Vermittler (`docker-compose.oauth.yml`). **Beide brauchen `Ports Exposes: 80`.**

**Warum kein Datenbank-CMS?** Inhalte als Git-Dateien = kostenloses Backup,
volle Versionshistorie jeder Änderung, minimaler Ressourcenverbrauch.

## Struktur

```
src/
├── components/     Header.astro, Footer.astro
├── content/team/   Teammitglieder als Markdown (CMS-pflegbar)
├── data/
│   ├── site.json   Kontakt, Preise, Zeiten (CMS-pflegbar)
│   └── pages/      Texte + Bilder je Seite (CMS-pflegbar)
├── layouts/        BaseLayout.astro (HTML-Gerüst)
├── lib/text.ts     Markdown → HTML, {{platzhalter}}, Überschriften-Schwung
├── pages/          6 Seiten: index, sandstube, wichtelstuebchen, team, impressum, datenschutz
├── scripts/app.js  Burger-Menu + Scroll-Reveal (vanilla JS)
└── styles/paperworld.css  Papierwelt-Designsystem
public/
├── admin/          Sveltia CMS (index.html + config.yml + generiertes Bundle)
└── images/         Alle Bilder
```
