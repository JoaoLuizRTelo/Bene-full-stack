#!/usr/bin/env bash
#
# Sobe o Ditado inteiro: banco, backend e frontend.
#
#   ./start.sh
#
# A saida de cada processo vai para logs/, que e onde se procura o erro quando
# algo nao sobe. Para derrubar tudo: ./stop.sh
#
# Este script e Bash e nao roda no PowerShell. No Windows, use ./start.ps1.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$RAIZ"
mkdir -p logs

falhar() {
  echo "ERRO: $1" >&2
  exit 1
}

# ---------------------------------------------------------------- 1. Banco ---

echo "[1/3] Subindo o PostgreSQL..."
docker compose up -d || falhar "o Docker nao respondeu. O Docker Desktop esta aberto?"

printf '      aguardando o banco aceitar conexoes'
for _ in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U ditado -d ditado >/dev/null 2>&1; then
    echo " ok"
    break
  fi
  printf '.'
  sleep 1
done

# --------------------------------------------------------------- 2. Backend ---

[ -f backend/.env ] || falhar "backend/.env nao existe. Copie backend/.env.example e preencha o JWT_SECRET."
[ -d backend/node_modules ] || falhar "faltam as dependencias do backend. Rode: cd backend && npm install"

echo "[2/3] Subindo o backend na porta 3000..."
(cd backend && npm run start:dev > "$RAIZ/logs/backend.log" 2>&1 &
  echo $! > "$RAIZ/logs/backend.pid")

printf '      aguardando /api/health'
for _ in $(seq 1 45); do
  if curl -fsS -m 2 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo " ok"
    break
  fi
  printf '.'
  sleep 1
done

# -------------------------------------------------------------- 3. Frontend ---

[ -d frontend/node_modules ] || falhar "faltam as dependencias do frontend. Rode: cd frontend && npm install"

echo "[3/3] Subindo o frontend na porta 5173..."
(cd frontend && npm run dev > "$RAIZ/logs/frontend.log" 2>&1 &
  echo $! > "$RAIZ/logs/frontend.pid")

sleep 3

echo
echo "  Ditado no ar:  http://localhost:5173"
echo "  API:           http://localhost:3000/api/health"
echo
echo "  Logs:          logs/backend.log  e  logs/frontend.log"
echo "  Para parar:    ./stop.sh"
