#!/usr/bin/env bash
# Auf dem VPS (76.13.137.234) als root ausführen:
#   bash <(curl -fsSL https://raw.githubusercontent.com/Cianta/youareneo-app/claude/pensive-keller-fqddkf/apps/ebook/deploy/install-on-server.sh)
# Holt apps/ebook nach /docker/ebook, legt beim ersten Mal .env an und startet den Container.
set -euo pipefail

BRANCH="${BRANCH:-claude/pensive-keller-fqddkf}"
TARGET=/docker/ebook
TMP=$(mktemp -d)

git clone --depth 1 --branch "$BRANCH" --filter=blob:none --sparse https://github.com/Cianta/youareneo-app.git "$TMP/repo"
git -C "$TMP/repo" sparse-checkout set apps/ebook

mkdir -p "$TARGET"
rsync -a --delete --exclude .env --exclude node_modules "$TMP/repo/apps/ebook/" "$TARGET/app/"
rm -rf "$TMP"

if [ ! -f "$TARGET/.env" ]; then
  cp "$TARGET/app/deploy/.env.example" "$TARGET/.env"
  chmod 600 "$TARGET/.env"
  echo
  echo ">>> $TARGET/.env angelegt. Trage SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY ein:"
  echo "    nano $TARGET/.env"
  echo ">>> Danach dieses Skript noch einmal ausführen."
  exit 0
fi

grep -q '^SUPABASE_SERVICE_ROLE_KEY=.\+' "$TARGET/.env" || { echo "SUPABASE_SERVICE_ROLE_KEY fehlt in $TARGET/.env"; exit 1; }

# Traefik-Netz von mission-control übernehmen, damit der Router den Container erreicht
NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$(docker ps -qf name=traefik | head -1)" 2>/dev/null | awk '{print $1}')
cd "$TARGET/app/deploy"
rm -f docker-compose.override.yml
# Traefik im Host-Netz erreicht Container direkt über ihre Bridge-IP, dann kein extra Netz nötig
if [ -n "${NET:-}" ] && [ "$NET" != "host" ] && [ "$NET" != "bridge" ]; then
  cat > docker-compose.override.yml <<EOF
services:
  ebook:
    networks: [proxy]
    labels:
    - traefik.docker.network=$NET
networks:
  proxy:
    external: true
    name: $NET
EOF
fi

docker compose -f docker-compose.production.yml $( [ -f docker-compose.override.yml ] && echo -f docker-compose.override.yml ) up -d --build
docker compose -f docker-compose.production.yml ps
echo ">>> Fertig. Test: curl -I https://ebook.youareneo.com"
