#!/bin/sh
set -e

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."

# Ako je DB_PASSWORD prazan, nemoj slati -p uopšte.
if [ -z "${DB_PASSWORD}" ]; then
  until mysqladmin ping -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" --silent; do
    sleep 2
  done
else
  until mysqladmin ping -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" --silent; do
    sleep 2
  done
fi

echo "MySQL is up."

# Uvek očisti cache da ne ostane DB_HOST=127.0.0.1 iz config:cache.
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true
php artisan view:clear || true

# .env unutar kontejnera (ako fali, kopiraj primer)
if [ ! -f .env ]; then
  cp .env.example .env
fi

# APP_KEY
php artisan key:generate --force || true

# Migracije + seed
php artisan migrate:fresh --seed --force

# Start server
php artisan serve --host=0.0.0.0 --port=8000