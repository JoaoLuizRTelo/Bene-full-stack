# Especificação — Ditado

> Aplicação web de transcrição de áudio.
> Disciplina de Tópicos Especiais em Programação — UNEMAT Sinop, Aula 07.

Este documento é o produto mais importante do projeto: o código pode ser regenerado a
partir dele, mas o contrário não é verdade. Ele responde a quatro perguntas — **o que**
construir, **com que dados**, **com que contrato** e **como saber que terminou**.

A forma de trabalhar no repositório está em [`../AGENTS.md`](../AGENTS.md).

---

## 1. Visão do produto

O visitante conhece o Ditado numa landing page, cria uma conta e, na área interna, envia um
arquivo de áudio e recebe o texto transcrito. As transcrições ficam salvas num histórico
pessoal, que ele pode reler, copiar e apagar. Um usuário administrador gerencia as contas.

### 1.1 Atores

| Ator | O que pode fazer |
|---|---|
| **Visitante** | Ver a landing page, criar conta, entrar |
| **Usuário** (`role: user`) | Enviar áudio, ver/copiar/excluir **as próprias** transcrições |
| **Administrador** (`role: admin`) | Tudo o que o usuário faz, mais listar, alterar e excluir contas |

### 1.2 Fora de escopo nesta entrega

Deploy em VPS, HTTPS, proxy reverso, contêineres de frontend e backend e migrações
versionadas são assunto da Aula 08. Recuperação de senha, confirmação de e-mail, edição do
texto transcrito e transcrição por URL não entram.

---

## 2. Arquitetura

Três camadas, cada uma um processo separado que conversa com a vizinha pela rede, mais um
serviço externo.

| Camada | Programa | Porta | Responsabilidade |
|---|---|---|---|
| Interface | React, executado no navegador e servido pelo Vite | 5173 | Exibir as telas e coletar o que o usuário informa |
| API | NestJS | 3000 | Aplicar as regras, autenticar, acessar o banco e chamar a Groq |
| Dados | PostgreSQL em contêiner | 127.0.0.1:5432 | Guardar usuários e transcrições |
| Serviço externo | Groq (modelo Whisper) | — | Transcrever o áudio |

### 2.1 O caminho `/api`

O navegador só conhece a porta 5173. Toda chamada à API é feita ao **caminho relativo**
`/api/...`, e o proxy de desenvolvimento do Vite a repassa para `http://127.0.0.1:3000`.
(O alvo e o endereco IPv4, e nao `localhost`: no Windows o Node resolve `localhost`
para `::1` primeiro, e o backend escuta em `127.0.0.1` — com `localhost` o proxy falha
com `ECONNREFUSED ::1:3000`.)

Isso tem duas consequências que a especificação exige:

1. **É proibido endereço absoluto no código do frontend.** Um front que chamasse
   `http://localhost:3000` funcionaria na máquina de quem o escreveu e falharia no
   navegador de qualquer outra pessoa, porque o `localhost` dela não tem backend nenhum.
   O mesmo código precisa rodar em desenvolvimento e em produção sem alteração.
2. **Não há CORS por endereço a configurar**, porque o navegador vê uma única origem.

### 2.2 Por que o backend chama a Groq

O navegador poderia enviar o áudio direto à Groq, e a aplicação teria uma camada a menos.
O custo seria a chave: tudo o que o frontend usa é entregue ao navegador de quem acessa a
página, e qualquer pessoa leria a chave no código-fonte ou na aba Rede. Por isso:

> **O frontend não tem segredo nenhum** — ele não tem sequer um arquivo `.env`.

Toda credencial fica no backend, que também é o ponto onde se controla quem pode transcrever.

### 2.3 Portas

Só um processo escuta em cada porta. `EADDRINUSE: address already in use` no backend ou
`port is already allocated` no Docker significam porta ocupada. O contêiner do banco publica
`127.0.0.1:5432:5432` — sem o endereço na frente, o Docker publicaria em `0.0.0.0` e o banco
aceitaria conexões de qualquer máquina da rede local.

---

## 3. Modelo de dados

### 3.1 `users`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, gerado |
| `name` | `varchar(120)` | `NOT NULL` |
| `email` | `varchar(180)` | `NOT NULL`, **UNIQUE**, gravado em minúsculas |
| `passwordHash` | `varchar(60)` | `NOT NULL`, bcrypt com 10 rounds |
| `role` | `enum('user','admin')` | `NOT NULL`, default `user` |
| `isActive` | `boolean` | `NOT NULL`, default `true` |
| `createdAt` | `timestamptz` | automático |
| `updatedAt` | `timestamptz` | automático |

Regras:

- O `email` é normalizado para minúsculas antes de gravar e antes de consultar, para que
  `Ana@teste.dev` e `ana@teste.dev` sejam a mesma conta. E-mail repetido retorna **409**.
- A senha em texto **nunca** é gravada nem comparada diretamente. Mínimo de 8 caracteres.
- `passwordHash` **nunca** aparece em resposta da API.
- O `role` nunca é aceito pelo cadastro: toda conta nasce `user`. Só um administrador
  promove alguém, pelo `PATCH /api/users/:id`.
- `isActive: false` impede o login (**401**), sem apagar o histórico da pessoa.

### 3.2 `transcriptions`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, gerado |
| `userId` | `uuid` | FK para `users.id`, `ON DELETE CASCADE`, indexado |
| `originalFilename` | `varchar(255)` | `NOT NULL` |
| `mimeType` | `varchar(100)` | `NOT NULL` |
| `sizeBytes` | `integer` | `NOT NULL` |
| `durationSeconds` | `numeric(10,2)` | nulo quando o provedor não informa |
| `language` | `varchar(10)` | `NOT NULL`, default `pt` |
| `model` | `varchar(80)` | `NOT NULL` — ex. `whisper-large-v3-turbo` ou `mock` |
| `text` | `text` | `NOT NULL` |
| `createdAt` | `timestamptz` | automático |

Regras:

- **O arquivo de áudio não é persistido.** Ele vive em memória durante a requisição e é
  descartado; só o texto e os metadados vão para o banco.
- Toda consulta filtra pelo `userId` do token. Uma transcrição de outro usuário responde
  **404**, não 403 — um 403 confirmaria que o recurso existe.
- Excluir um usuário remove as transcrições dele, pelo `CASCADE`.
- `userId` **nunca** aparece em resposta: o dono é sempre quem pediu.

### 3.3 Relação

Um usuário tem muitas transcrições; cada transcrição tem exatamente um dono.

### 3.4 Esquema

Criado pelo próprio TypeORM, com `synchronize: true`: a cada inicialização ele compara as
entidades com as tabelas e ajusta o que for diferente. É opção **de desenvolvimento** — ao
renomear ou remover um campo, a coluna é removida e os dados se perdem sem aviso. Em
produção o esquema muda por migrações versionadas (Aula 08).

---

## 4. Contrato da API

Prefixo global **`/api`**. Corpo em JSON em todas as rotas, exceto o envio de áudio, que usa
`multipart/form-data` porque um arquivo binário não cabe em JSON.

### 4.1 Rotas

| # | Operação | Método | Rota | Sucesso | Acesso |
|---|---|---|---|---|---|
| 1 | Saúde da API | `GET` | `/api/health` | `200` | público |
| 2 | Cadastro | `POST` | `/api/auth/register` | `201` | público |
| 3 | Login | `POST` | `/api/auth/login` | `200` | público |
| 4 | Sessão atual | `GET` | `/api/auth/me` | `200` | autenticado |
| 5 | Listar histórico | `GET` | `/api/transcriptions?page=&limit=` | `200` | dono |
| 6 | Criar transcrição | `POST` | `/api/transcriptions` | `201` | autenticado |
| 7 | Ler transcrição | `GET` | `/api/transcriptions/:id` | `200` | dono |
| 8 | Excluir transcrição | `DELETE` | `/api/transcriptions/:id` | `204` | dono |
| 9 | Listar usuários | `GET` | `/api/users?page=&limit=&search=` | `200` | **admin** |
| 10 | Ler usuário | `GET` | `/api/users/:id` | `200` | **admin** |
| 11 | Alterar usuário | `PATCH` | `/api/users/:id` | `200` | **admin** |
| 12 | Excluir usuário | `DELETE` | `/api/users/:id` | `204` | **admin** |

### 4.2 Formas de resposta

```ts
UserResponse = {
  id: string; name: string; email: string;
  role: 'user' | 'admin'; isActive: boolean; createdAt: string;
}

AuthResponse = { user: UserResponse; accessToken: string }

TranscriptionResponse = {
  id: string; originalFilename: string; mimeType: string; sizeBytes: number;
  durationSeconds: number | null; language: string; model: string;
  text: string; createdAt: string;
}

Paginated<T> = { items: T[]; total: number; page: number; limit: number }
```

`passwordHash` e `userId` não existem em nenhuma resposta.

### 4.3 Corpo de cada rota

**2 · `POST /api/auth/register`** devolve `201 AuthResponse`

```json
{ "name": "Ana Souza", "email": "ana@teste.dev", "password": "segredo123" }
```

| Campo | Regra |
|---|---|
| `name` | string, 2 a 120 caracteres |
| `email` | e-mail válido, até 180 caracteres |
| `password` | string, 8 a 72 caracteres |

Qualquer campo fora desta lista — **`role` em especial** — faz a requisição falhar com
**400**, pelo `whitelist` + `forbidNonWhitelisted` do `ValidationPipe`.

**3 · `POST /api/auth/login`** devolve `200 AuthResponse`

```json
{ "email": "ana@teste.dev", "password": "segredo123" }
```

Credencial errada, conta inexistente ou conta inativa retornam **401**, sempre com a mesma
mensagem, para não revelar quais e-mails existem.

**4 · `GET /api/auth/me`** devolve `200 UserResponse`.

**5 · `GET /api/transcriptions`** devolve `200 Paginated<TranscriptionResponse>`.

`page` a partir de 1 (default 1), `limit` de 1 a 50 (default 10). Ordenado por `createdAt`
descendente. Na listagem, `text` vem truncado em 280 caracteres, para não trafegar
transcrições inteiras num histórico longo; o texto completo vem na rota 7.

**6 · `POST /api/transcriptions`** devolve `201 TranscriptionResponse`.

`Content-Type: multipart/form-data` com duas partes:

| Parte | Obrigatória | Regra |
|---|---|---|
| `file` | sim | o áudio; tipo e tamanho validados abaixo |
| `language` | não | código de 2 a 5 caracteres, default `pt` |

Tipos aceitos, os mesmos que a Groq aceita: `audio/mpeg`, `audio/mp3`, `audio/mp4`,
`audio/x-m4a`, `audio/m4a`, `audio/wav`, `audio/x-wav`, `audio/wave`, `audio/ogg`,
`audio/webm`, `audio/flac`, `audio/x-flac`, `video/mp4`, `video/webm`.

Tamanho máximo: `MAX_UPLOAD_MB`, default **25 MB**, o limite da camada gratuita da Groq.

**11 · `PATCH /api/users/:id`** devolve `200 UserResponse`.

Corpo com ao menos um campo, todos opcionais: `name`, `email`, `role`, `isActive`.
Aqui o `role` **é** aceito, porque a rota é de administrador. Dois travamentos:

- um administrador não pode remover o próprio `role: admin` nem se desativar — **400**,
  para não existir sistema sem administrador;
- `email` já usado por outra conta retorna **409**.

**12 · `DELETE /api/users/:id`** devolve `204`. Um administrador não pode excluir a própria
conta (**400**). Excluir uma conta leva as transcrições dela junto.

### 4.4 Status de erro

| Status | Significado nesta aplicação |
|---|---|
| `400` | Corpo inválido: campo ausente, formato errado, **campo não permitido**, arquivo que não é áudio, regra de negócio violada |
| `401` | Sem token, token inválido ou expirado, credencial errada, conta inativa |
| `403` | Token válido, mas sem permissão (usuário comum em rota de administrador) |
| `404` | Recurso inexistente **ou de outro usuário** |
| `409` | Conflito: e-mail já cadastrado |
| `413` | Arquivo acima do limite de tamanho |
| `502` | Falha no serviço externo (Groq) |

Formato do corpo de erro, o padrão do NestJS:

```json
{ "statusCode": 409, "message": "E-mail já cadastrado", "error": "Conflict" }
```

### 4.5 Exemplo completo — o login

```http
POST /api/auth/login HTTP/1.1
Host: localhost:5173
Content-Type: application/json

{"email":"ana@teste.dev","password":"segredo123"}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"user":{"id":"3f2a...","name":"Ana Souza","email":"ana@teste.dev","role":"user",
"isActive":true,"createdAt":"2026-10-06T19:00:00.000Z"},"accessToken":"eyJhbGciOi..."}
```

---

## 5. Autenticação e autorização

A aplicação identifica o usuário por um **token JWT**, e não por uma sessão guardada no
servidor — o que é coerente com a ausência de estado do REST. O backend não se lembra de
quem fez a requisição anterior, e por isso cada requisição leva o token no cabeçalho
`Authorization: Bearer <token>`.

**No login:** o backend busca o hash da senha no banco e o compara com a senha digitada
usando `bcrypt.compare`. Se bate, assina um token com o `JWT_SECRET` e o devolve.

**Em cada requisição seguinte:** o banco nem é consultado para autenticar. A guarda verifica
a assinatura e a validade do token, e o usuário que ele descreve fica disponível para o
controlador pelo decorator `@CurrentUser()`.

Conteúdo do token: `sub` (id do usuário), `email`, `role`, `iat`, `exp`.

Por isso o token tem prazo de validade (`JWT_EXPIRES_IN`, default `1d`), e por isso um
`JWT_SECRET` vazado permite a qualquer pessoa emitir tokens válidos em nome de qualquer
usuário. O segredo não vai para o repositório.

**Autorização.** `JwtAuthGuard` protege tudo o que não é público. `RolesGuard`, junto com
`@Roles('admin')`, protege as rotas de usuários: token válido sem o papel retorna **403**.
O controle por **dono** não é feito por guarda, e sim no serviço, filtrando pelo `userId` do
token em toda consulta.

---

## 6. Os dados em cada camada

Uma mesma informação muda de forma a cada camada que atravessa, e cada forma é um contrato
diferente, que protege contra uma falha diferente.

| Forma | Onde é definida | O que controla |
|---|---|---|
| Formulário | `frontend/src/pages/`, com react-hook-form + zod | O que o usuário digita, validado antes do envio |
| JSON do corpo | Este documento, seção 4 | O que o frontend envia e o que recebe |
| DTO | `backend/src/<módulo>/dto/` | **O que pode entrar**: campos aceitos, formatos, tamanhos. Com `whitelist`, um campo não declarado, como `role` no cadastro, é recusado |
| Entidade | `backend/src/<módulo>/entities/` | **O que é gravado**: colunas, tipos e relações |
| Resposta | O serviço, ao montar o retorno | **O que pode sair**: nunca o `passwordHash` |
| Tipo TypeScript | `frontend/src/types/` | O que o frontend espera receber |

A validação no formulário é conveniência para quem usa a tela; ela **não substitui** a do
DTO, porque qualquer pessoa pode chamar a API sem passar pela tela.

---

## 7. O caminho de uma requisição

O envio de um áudio atravessa todas as camadas e serve de exemplo para as demais.

| # | Onde | O que acontece |
|---|---|---|
| 1 | `pages/TranscreverPage.tsx` | O usuário escolhe o arquivo e clica em **Transcrever** |
| 2 | `services/api.ts` | O axios monta um `multipart/form-data` e o interceptador acrescenta `Authorization: Bearer <token>` |
| 3 | Vite | O proxy repassa `POST /api/transcriptions` para `http://127.0.0.1:3000` |
| 4 | `JwtAuthGuard` | O NestJS valida o token; se inválido ou ausente, responde **401** e a requisição termina aqui |
| 5 | `transcriptions.controller.ts` | O controlador recebe o arquivo, o multer aplica o limite de tamanho (**413**) e o filtro de tipo (**400**), e chama o serviço |
| 6 | `transcriptions.service.ts` | O serviço envia o áudio ao provedor com a chave lida do `.env` e recebe o texto; falha do provedor vira **502** |
| 7 | TypeORM | Grava a transcrição no PostgreSQL, associada ao usuário do token |
| 8 | Resposta | O backend devolve **201** com a transcrição em JSON; a tela a exibe e o TanStack Query invalida o histórico, que se atualiza sem recarregar a página |

---

## 8. Telas

| Rota | Tela | Acesso | Conteúdo |
|---|---|---|---|
| `/` | Landing | público | O que é o Ditado, como funciona em três passos, formatos aceitos, chamada para cadastro. Quem já tem sessão é levado a `/app` |
| `/entrar` | Login | público | E-mail e senha; link para o cadastro; erro em 401 |
| `/cadastrar` | Cadastro | público | Nome, e-mail, senha e confirmação; erro em 409 aponta o campo de e-mail |
| `/app` | Área interna | autenticado | Envio de áudio e histórico pessoal paginado |
| `/app/transcricoes/:id` | Detalhe | dono | Texto completo, metadados, copiar e excluir |
| `/app/contas` | Contas | **admin** | Lista de contas com busca, promover/rebaixar, ativar/desativar, excluir |

`RotaProtegida` barra `/app` sem sessão e redireciona a `/entrar`. `RotaAdmin` barra
`/app/contas` sem `role === 'admin'`. A tela de envio informa os formatos e o limite de
tamanho **antes** do clique, e traduz os status em mensagens legíveis:

| Status | Mensagem na tela |
|---|---|
| `400` | "Esse arquivo não parece ser um áudio. Use mp3, m4a, wav, ogg, webm ou flac." |
| `413` | "O arquivo passa de 25 MB. Tente um áudio mais curto." |
| `502` | "O serviço de transcrição não respondeu. Tente de novo em instantes." |
| `401` | A sessão é limpa e o usuário vai para `/entrar` |

---

## 9. Configuração

`backend/.env.example` é versionado com os **nomes** das variáveis; `backend/.env`, com os
valores, não é. O frontend não tem `.env`.

| Variável | Default | Para que serve |
|---|---|---|
| `NODE_ENV` | `development` | Ambiente |
| `PORT` | `3000` | Porta do backend |
| `DATABASE_URL` | `postgres://ditado:ditado@127.0.0.1:5432/ditado` | Conexão com o PostgreSQL |
| `DATABASE_SSL` | `false` | `true` para bancos gerenciados, como o Neon |
| `JWT_SECRET` | — | **Obrigatória.** Segredo que assina o token |
| `JWT_EXPIRES_IN` | `1d` | Validade do token |
| `TRANSCRIPTION_PROVIDER` | `mock` | `mock` ou `groq` |
| `GROQ_API_KEY` | — | Obrigatória quando o provedor é `groq` |
| `GROQ_MODEL` | `whisper-large-v3-turbo` | Modelo de transcrição |
| `MAX_UPLOAD_MB` | `25` | Limite de tamanho do áudio |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | — | Usadas só pelo `npm run seed:admin` |

A aplicação valida essas variáveis **na inicialização** e falha com mensagem clara se uma
obrigatória estiver ausente — melhor quebrar ao subir do que na primeira requisição.

### 9.1 O provedor de transcrição

A transcrição fica atrás de uma interface, para que a aplicação funcione inteira antes de
existir uma chave da Groq e para que o provedor possa ser trocado sem mexer no serviço:

```ts
abstract class TranscriptionProvider {
  abstract transcribe(file, language): Promise<{ text; model; durationSeconds? }>;
}
```

- **`mock`** — devolve um texto fixo com os metadados do arquivo, após um atraso curto.
  É o default, e é com ele que as etapas 4, 6, 7 e 8 são verificadas.
- **`groq`** — chama `audio.transcriptions.create` do `groq-sdk` com a chave e o modelo do
  `.env`. Qualquer erro da Groq vira **502**.

Trocar de um para o outro é mudar uma variável de ambiente. Nenhuma linha de código muda.

### 9.2 Trocar para o Neon

`DATABASE_URL` recebe a connection string do Neon e `DATABASE_SSL` vira `true`. O
`docker-compose.yml` deixa de ser necessário. Nada mais muda.

---

## 10. Plano de etapas

A especificação inteira não é entregue ao agente num pedido só: a janela de contexto se
enche antes de o trabalho terminar, e um erro na camada de dados contamina tudo o que é
construído sobre ela. Cada etapa termina em commit próprio e só avança quando os critérios
de aceite passam **no terminal** — o relato de que "tudo passou" é uma afirmação; a saída do
comando é um fato.

| # | Etapa | Critérios de aceite |
|---|---|---|
| 0 | Raiz do monorepo: `.gitignore`, `docker-compose.yml`, `AGENTS.md`, esta especificação | `docker compose up -d` sobe o banco; `docker compose exec db psql -U ditado -c "select version();"` imprime `PostgreSQL 17`; `docker compose ps` mostra `127.0.0.1:5432->5432/tcp` |
| 1 | Backend base: NestJS, `ConfigModule` com validação, TypeORM, `ValidationPipe` global, `/api/health` | `curl localhost:3000/api/health` devolve `200 {"status":"ok","database":"up"}`; subir sem `JWT_SECRET` falha com mensagem clara |
| 2 | Módulo `users`: entidade, serviço, mapeador de resposta, rotas de administrador | Tabela `users` criada; `GET /api/users` sem token retorna **401** |
| 3 | Módulo `auth`: cadastro, login, `/me`, estratégia e guardas JWT, `RolesGuard`, `@CurrentUser()`, `seed:admin` | Cadastro devolve **201** com `accessToken`; e-mail repetido **409**; `role:"admin"` no corpo **400**; nenhuma resposta contém `passwordHash`; usuário comum em `GET /api/users` recebe **403**; `npm run seed:admin` cria o administrador |
| 4 | Módulo `transcriptions` com provedor `mock`: entidade, upload, CRUD por dono | Upload devolve **201** com texto; a lista traz só as do dono; `GET` de id alheio **404**; arquivo não-áudio **400**; arquivo acima do limite **413**; `DELETE` **204** |
| 5 | `GroqTranscriptionProvider` | Com `TRANSCRIPTION_PROVIDER=groq` e chave inválida, **502**; com chave válida, o áudio de teste volta transcrito |
| 6 | Frontend base: Vite, Tailwind v4, rotas, axios com os dois interceptadores, Zustand, TanStack Query, landing, login, cadastro | `localhost:5173` abre a landing; cadastro e login funcionam; recarregar a página mantém a sessão; `/app` sem sessão redireciona a `/entrar`; a aba Rede não mostra nenhuma chamada a `localhost:3000` |
| 7 | Área interna: envio de áudio, histórico paginado, detalhe, exclusão | Enviar um áudio exibe o texto e o histórico se atualiza sem recarregar; excluir remove da lista; um 401 leva a `/entrar` |
| 8 | Área de administrador | O administrador lista e altera contas; usuário comum em `/app/contas` é barrado pela tela **e** recebe **403** da API |
| 9 | `start`/`stop` (`.sh` e `.ps1`), `README.md` com a declaração de uso de IA, revisão crítica final | `npm run build` e `npm run lint` passam nos dois projetos; a aplicação sobe do zero seguindo só o README; os comandos da seção 11 todos conferem |

---

## 11. Verificação

### 11.1 Revisão crítica — as falhas que se procuram primeiro

Código que funciona não é, só por isso, código correto. Uma API que devolve o hash da senha
junto com os dados do usuário funciona; uma rota que entrega a transcrição de qualquer
usuário a quem souber o identificador também funciona. Os quatro comandos abaixo são a
primeira coisa a rodar na revisão.

```bash
# 1 - o hash da senha não escapa pela resposta
curl -s -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana","email":"ana@teste.dev","password":"segredo123"}' \
  | grep -ci "passwordHash"                                            # esperado: 0

# 2 - o campo role não entra pelo cadastro
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"X","email":"x@teste.dev","password":"segredo123","role":"admin"}'
                                                                       # esperado: 400

# 3 - a transcrição de outro usuário responde 404, não 403
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/transcriptions/$ID_DA_ANA \
  -H "Authorization: Bearer $TOKEN_DO_BRUNO"                           # esperado: 404

# 4 - nenhum controlador fala com o banco direto
grep -rn "from 'typeorm'" backend/src --include=*.controller.ts       # esperado: vazio
```

### 11.2 Os demais status do contrato

| O que fazer | Esperado |
|---|---|
| `GET /api/health` | `200` |
| Cadastro com e-mail já existente | `409` |
| Login com senha errada | `401` |
| Qualquer rota protegida sem `Authorization` | `401` |
| Usuário comum em `GET /api/users` | `403` |
| Upload de um `.txt` renomeado para `.mp3` | `400` |
| Upload de arquivo acima de `MAX_UPLOAD_MB` | `413` |
| `TRANSCRIPTION_PROVIDER=groq` com chave inválida | `502` |

### 11.3 Frontend, no navegador

Com a aba **Rede** (F12) aberta, percorrer: landing → cadastro → envio de áudio → histórico
→ detalhe → exclusão → sair → entrar como administrador → gestão de contas.

Conferir que **toda** requisição sai para `/api/...` e **nenhuma** para `localhost:3000`, e
que nenhuma resposta traz `passwordHash`.

### 11.4 Infraestrutura

```bash
docker compose ps              # PORTS = 127.0.0.1:5432->5432/tcp, e não 0.0.0.0
lsof -i :3000                  # Linux, WSL e macOS - quem ocupa a porta
netstat -ano | findstr :3000   # PowerShell; a última coluna é o PID
```

### 11.5 Entrega

```bash
unzip -l entrega.zip | grep -E "\.env$|node_modules"   # não deve listar nada
```

O `.env` contém a chave da Groq, e um arquivo compactado entregue a terceiros é tão público
quanto um repositório.
