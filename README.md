# Ditado

Aplicação web de transcrição de áudio. O visitante conhece o produto numa landing page, cria
uma conta e, na área interna, envia um arquivo de áudio e recebe o texto transcrito. As
transcrições ficam salvas num histórico pessoal. Um usuário administrador gerencia as contas.

Projeto da disciplina de **Tópicos Especiais em Programação** — Bacharelado em Sistemas de
Informação, UNEMAT Câmpus de Sinop. Aula 07: aplicação web full stack com agentes.

| | |
|---|---|
| **Especificação** | [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md) — o que construir, com que dados, com que contrato e como saber que terminou |
| **Contexto do agente** | [`AGENTS.md`](AGENTS.md) — pilha, convenções, comandos e o que nunca fazer |

## A pilha

| Camada | Tecnologia | Porta |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 | 5173 |
| Backend | NestJS + TypeORM | 3000 |
| Banco | PostgreSQL 17 em contêiner Docker | 127.0.0.1:5432 |
| Transcrição | Groq (modelo Whisper), atrás de uma interface trocável | — |

O navegador só conhece a porta 5173. Toda chamada à API é feita ao caminho relativo `/api`,
que o proxy do Vite repassa ao backend — nenhum arquivo do frontend contém endereço absoluto,
e o frontend não tem `.env` nem segredo nenhum.

---

## Rodar do zero

### Pré-requisitos

| Programa | Versão mínima | Como conferir |
|---|---|---|
| Node.js | **22.12** | `node -v` |
| npm | 10 | `npm -v` |
| Docker | com Docker Desktop **aberto** | `docker compose version` |
| Git | qualquer | `git --version` |

> No Windows, o Docker Desktop precisa estar em execução antes do primeiro comando — não
> basta estar instalado.

### 1. Clonar e instalar

```bash
git clone <url-do-repositorio> ditado
cd ditado

cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configurar o backend

Copie o modelo e preencha os valores:

```bash
cp backend/.env.example backend/.env       # PowerShell: Copy-Item backend\.env.example backend\.env
```

Duas variáveis precisam de valor antes de subir:

```bash
# JWT_SECRET - gere um valor longo e aleatório:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# ADMIN_PASSWORD - a senha do administrador que o seed vai criar (mínimo 8 caracteres)
```

As demais já vêm com valores que funcionam para desenvolvimento. A aplicação valida o `.env`
na inicialização e falha com mensagem clara se faltar algo.

> **O `.env` não vai para o repositório** e não vai no `.zip` da entrega. O `.gitignore` o
> exclui. Uma chave da Groq que chegue ao GitHub precisa ser **revogada** no console da Groq,
> não apenas apagada do arquivo.

### 3. Subir o banco

```bash
docker compose up -d
docker compose exec db psql -U ditado -c "select version();"   # deve imprimir PostgreSQL 17
```

O esquema é criado pelo próprio TypeORM na primeira inicialização do backend
(`synchronize: true`), então não há migração para rodar.

### 4. Criar o administrador

```bash
cd backend && npm run seed:admin && cd ..
```

Cria a conta com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` do `.env`. Rodar de novo redefine a
senha dessa conta. Sem esse passo, a área de **Contas** não tem como ser acessada — o
cadastro público sempre cria usuários comuns.

### 5. Subir a aplicação

**Com duplo clique (Windows):**

Abra **`iniciar.bat`**. Ele confere o Docker (e abre o Docker Desktop se estiver
fechado), sobe o banco, o backend e o frontend, e abre o navegador. Para derrubar,
abra **`parar.bat`**.

Rodar o `iniciar.bat` com o sistema já no ar é inofensivo: ele detecta o que já está
nas portas 3000 e 5173 e mantém, em vez de colidir com `EADDRINUSE`.

**Com um comando:**

```bash
./start.sh                      # Linux, WSL e macOS
.\start.ps1                     # Windows, PowerShell
.\start.ps1 -SemNavegador       # idem, sem abrir o navegador
```

**Ou em dois terminais, manualmente:**

```bash
cd backend  && npm run start:dev    # terminal 1 — porta 3000
cd frontend && npm run dev          # terminal 2 — porta 5173
```

Abra **http://localhost:5173**.

Para derrubar:

```bash
./stop.sh  --banco     # Linux, WSL e macOS (--banco também para o PostgreSQL)
.\stop.ps1 -Banco      # Windows, PowerShell
parar.bat              # Windows, duplo clique (mantém o banco de pé)
```

### 6. Ligar a transcrição real (opcional)

Sem chave da Groq, a aplicação funciona inteira com um provedor dublê: o upload responde
`201` e devolve um texto fixo, com `model: "mock"`. É assim que ela vem configurada.

Para transcrever de verdade:

1. Crie a conta em <https://console.groq.com> e gere uma API Key (ela começa com `gsk_` e é
   exibida uma única vez).
2. No `backend/.env`:
   ```
   TRANSCRIPTION_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=whisper-large-v3-turbo
   ```
3. Reinicie o backend.

Nenhuma linha de código muda — o provedor é escolhido na inicialização. Se a chave estiver
ausente com `TRANSCRIPTION_PROVIDER=groq`, o backend se recusa a subir e diz o porquê.

### Usar o Neon em vez do Postgres local

```
DATABASE_URL=postgres://usuario:senha@ep-xxx.neon.tech/neondb
DATABASE_SSL=true
```

O `docker compose` deixa de ser necessário. Nada mais muda.

---

## Comandos

```bash
# banco (na raiz)
docker compose up -d                 # sobe
docker compose ps                    # PORTS deve mostrar 127.0.0.1:5432->5432/tcp
docker compose down                  # derruba, mantendo os dados no volume

# backend (em backend/)
npm run start:dev                    # :3000, recarga a cada alteração
npm run build                        # compila para dist/
npm run lint
npm run seed:admin

# frontend (em frontend/)
npm run dev                          # :5173
npm run build                        # gera dist/ para produção
npm run lint
```

## Mapa de rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Landing | público |
| `/entrar` · `/cadastrar` | Login e cadastro | público |
| `/app` | Envio de áudio e histórico | autenticado |
| `/app/transcricoes/:id` | Detalhe da transcrição | dono |
| `/app/contas` | Gestão de contas | administrador |

A API vive sob `/api`: `auth/register`, `auth/login`, `auth/me`, `transcriptions`, `users` e
`health`. O contrato completo, rota por rota e status por status, está na seção 4 da
especificação.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `port is already allocated` no `docker compose up` | Outro PostgreSQL ocupa a 5432. Veja quem é com `lsof -i :5432` ou `netstat -ano \| findstr :5432` |
| `EADDRINUSE` ao subir o backend | Já há um backend rodando. `./stop.sh` ou `.\stop.ps1` |
| `ECONNREFUSED ::1:3000` no log do Vite | O proxy aponta para `127.0.0.1:3000`, não `localhost` — no Windows o Node resolve `localhost` como IPv6 primeiro. Já está corrigido em `frontend/vite.config.ts` |
| `Configuracao invalida em backend/.env` | Falta uma variável obrigatória. A mensagem diz qual; compare com `.env.example` |
| O texto transcrito começa com `[transcricao simulada]` | O provedor é o `mock`. Veja o passo 6 acima |
| `502` ao transcrever | A Groq recusou a chamada — normalmente chave inválida ou cota esgotada. O log do backend traz a resposta dela |

---

## Declaração de uso de inteligência artificial

Na construção deste projeto foram utilizadas ferramentas de inteligência artificial como
instrumento de trabalho, nas seguintes etapas:

| Etapa | Ferramenta e modelo | O que a IA fez |
|---|---|---|
| Leitura do enunciado | Claude Code · Claude Opus 5 (Anthropic) | Extração e leitura do PDF da Aula 07, levantamento dos requisitos da aplicação e dos entregáveis |
| Especificação e `AGENTS.md` | Claude Code · Claude Opus 5 | Redação de `docs/ESPECIFICACAO.md` (modelo de dados, contrato da API, telas, plano de etapas e critérios de aceite) e do `AGENTS.md`, a partir do enunciado |
| Backend | Claude Code · Claude Opus 5 | Geração dos módulos NestJS (`health`, `users`, `auth`, `transcriptions`), entidades TypeORM, DTOs, guardas, provedores de transcrição e script de seed |
| Frontend | Claude Code · Claude Opus 5 | Geração das telas React, do sistema visual em Tailwind v4, do cliente axios com os dois interceptadores, da sessão em Zustand e dos hooks de TanStack Query |
| Scripts e documentação | Claude Code · Claude Opus 5 | `start`/`stop` em Bash e PowerShell, `docker-compose.yml` e este README |
| Verificação | Claude Code · Claude Opus 5 | Execução dos critérios de aceite de cada etapa no terminal (curl, psql, `npm run build`, `npm run lint`) |

Os critérios de aceite foram conferidos pela **saída dos comandos no terminal**, e não apenas
pelo relato do agente. O conteúdo foi revisado, e a responsabilidade pelo que está publicado
aqui é de quem entrega o trabalho.

**Revisão crítica aplicada.** Os quatro pontos que a Aula 07 aponta como falhas frequentes do
agente foram verificados um a um, com os comandos da seção 11.1 da especificação:

1. O `passwordHash` não aparece em nenhuma resposta da API
2. Um cadastro com `"role":"admin"` no corpo recebe `400`, e não cria um administrador
3. A transcrição de outro usuário responde `404`, e não `403` — um 403 confirmaria que o
   recurso existe
4. Nenhum controlador importa de `typeorm`: regra de negócio e acesso ao banco ficam no
   serviço
