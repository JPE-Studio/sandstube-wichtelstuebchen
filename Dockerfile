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
RUN npm ci --omit=optional

# Quellcode kopieren und bauen
COPY . .
RUN npm run build

# ─── Stage 2: Serve ───
FROM nginx:alpine AS serve

# Saubere URLs: leite /seite auf /seite/index.html um (Astro "directory" Output)
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / { try_files $uri $uri/ $uri.html /index.html; }\n\
    # Caching für gebündelte Assets (hash-basierte Dateinamen)\n\
    location /_astro/ { expires 1y; add_header Cache-Control "public, immutable"; }\n\
    # Bilder: moderates Caching\n\
    location /images/ { expires 7d; add_header Cache-Control "public"; }\n\
}\n' > /etc/nginx/conf.d/default.conf \
    && rm /etc/nginx/conf.d/default.conf.bak 2>/dev/null; true

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
