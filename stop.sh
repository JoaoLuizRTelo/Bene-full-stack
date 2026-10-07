#!/usr/bin/env bash
#
# Derruba o que o start.sh subiu.
#
#   ./stop.sh            para backend e frontend, mantem o banco
#   ./stop.sh --banco    para tudo, inclusive o contêiner do PostgreSQL

set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$RAIZ"

parar() {
  local nome="$1" arquivo="logs/$1.pid"

  if [ ! -f "$arquivo" ]; then
    echo "  $nome: nenhum PID registrado"
    return
  fi

  local pid
  pid="$(cat "$arquivo")"

  if kill "$pid" 2>/dev/null; then
    echo "  $nome: parado (PID $pid)"
  else
    echo "  $nome: o processo $pid nao estava mais rodando"
  fi

  rm -f "$arquivo"
}

echo "Parando os processos Node..."
parar frontend
parar backend

if [ "${1:-}" = "--banco" ]; then
  echo "Derrubando o contêiner do PostgreSQL..."
  docker compose down
  echo "  os dados continuam no volume; use 'docker compose down -v' para apaga-los"
fi

echo "Pronto."
