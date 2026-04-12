#!/usr/bin/env bash
# One-shot local setup: MySQL (Docker) + Drizzle migrations.
# Requires: Docker Desktop, Node 20+, npm/pnpm in PATH.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker 未安装或未在 PATH 中。请先安装 Docker Desktop：https://docs.docker.com/desktop/"
  exit 1
fi

if [[ ! -f .env.local ]]; then
  echo "缺少 .env.local。请从 .env.example 复制并填写，或保留仓库里已有的 .env.local。"
  exit 1
fi

echo ">>> 启动 MySQL 容器…"
docker compose up -d mysql

echo ">>> 等待 MySQL 就绪…"
ready=0
for _ in $(seq 1 90); do
  if docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -pchinabymonica_dev --silent 2>/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  echo "MySQL 在 90s 内未就绪。请检查: docker compose logs mysql"
  exit 1
fi

echo ">>> 执行数据库迁移…"
set -a
# shellcheck disable=SC1091
[[ -f .env ]] && source .env
# shellcheck disable=SC1091
source .env.local
set +a
export NODE_OPTIONS="${NODE_OPTIONS:---experimental-global-webcrypto}"
npx drizzle-kit migrate

echo ""
echo ">>> 完成。"
echo "    启动站点:  npm run dev"
echo "    后台登录:  http://localhost:${PORT:-3000}/admin/login"
echo "    账号见 .env.local 中的 ADMIN_EMAIL / ADMIN_PASSWORD"
