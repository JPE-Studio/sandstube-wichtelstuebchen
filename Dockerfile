# ═══════════════════════════════════════════════════════════════════════
# Dockerfile – SandStube & Wichtelstübchen (Astro Static + Decap CMS)
# ═══════════════════════════════════════════════════════════════════════
# Multi-Stage-Build:
#   1. Build-Stage:  Node installiert Dependencies und baut die statische Seite
#   2. Serve-Stage:  Nginx (Alpine) serviert ./dist – extrem leichtgewichtig
#
# In Coolify: "Dockerfile" als Build Pack wählen. Das Image läuft dann als
# eigenständiger Container mit ~10–20 MB RAM-Verbrauch.
# ═══════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ───
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies zuerst kopieren (besserer Docker-Layer-Cache)
COPY package.json package-lock.json* ./
# Kein --omit=optional: Astros Bundler (rolldown) liefert seine plattform-
# spezifischen Binaries als optionalDependencies – ohne sie schlägt der Build fehl.
RUN npm ci

# Quellcode kopieren und bauen
COPY . .
RUN npm run build

# ─── Stage 2: Serve ───
FROM nginx:alpine AS serve

# Saubere URLs, Caching und Gzip – siehe nginx.conf im Repo-Root
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
