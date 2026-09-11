#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

if command -v docker >/dev/null 2>&1; then
  docker compose up -d
else
  echo "未检测到 Docker。请确认本机 PostgreSQL 已按 .env 中的 DATABASE_URL 可连接。"
fi

if [[ ! -d node_modules ]]; then
  npm install
fi

npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
