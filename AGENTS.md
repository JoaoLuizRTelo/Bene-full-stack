# AGENTS.md — como trabalhar neste repositório

Este arquivo descreve **a forma de trabalhar** no projeto Ditado e vale para qualquer
tarefa aqui, inclusive as que ainda não foram pensadas. O **o que construir** está em
[`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md), e é lá que se mexe quando o produto muda.

## O produto

Ditado é uma aplicação web de transcrição de áudio. O visitante conhece o produto numa
landing page, cria uma conta e, na área interna, envia um arquivo de áudio e recebe o texto
transcrito. As transcrições ficam num histórico pessoal. Um usuário administrador gerencia
as contas.

## A pilha

| Camada | Tecnologia | Porta |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 | 5173 |
| Backend | NestJS + TypeORM | 3000 |
| Banco | PostgreSQL 17 em contêiner Docker | 127.0.0.1:5432 |
| Transcrição | Groq (Whisper), atrás de uma interface trocável | — |

Monorepo: `backend/` e `frontend/` são dois projetos Node, cada um com o próprio
`package.json`. Ficam juntos porque mudam juntos — uma alteração no contrato da API exige
mexer nos dois lados, no mesmo commit.

## Comandos

```bash
# banco (na raiz)
docker compose up -d
docker compose exec db psql -U ditado -c "select version();"
docker compose down

# backend (em backend/)
npm install
npm run start:dev          # :3000, recarga a cada alteração
npm run build
npm run lint
npm run seed:admin         # cria o admin a partir de ADMIN_EMAIL/ADMIN_PASSWORD

# frontend (em frontend/)
npm install
npm run dev                # :5173
npm run build
npm run lint

# tudo de uma vez, na raiz
./start.sh       |  .\start.ps1      # PowerShell
./stop.sh        |  .\stop.ps1
iniciar.bat      |  parar.bat        # Windows, duplo clique
```

## Convenções

**Backend — um módulo por domínio.** Cada módulo tem sempre as mesmas peças, e cada peça
tem uma responsabilidade única:

- `*.module.ts` — declara o que o módulo contém e o que exporta
- `*.controller.ts` — recebe a requisição, extrai parâmetros, devolve a resposta.
  **Nenhuma regra de negócio e nenhum acesso ao banco.**
- `*.service.ts` — regra de negócio e acesso ao banco pelo repositório do TypeORM
- `entities/*.entity.ts` — a classe que o TypeORM transforma em tabela
- `dto/*.dto.ts` — o formato aceito no corpo, com as regras do `class-validator`

**Frontend.** `pages/` tem um arquivo por rota; `components/ui/` guarda o que se repete
(botão, campo, cartão); `components/layout/` o cabeçalho e o layout da área interna. Toda
chamada HTTP passa por `services/api.ts`. Tipos do contrato da API em `types/`.

**Estado no frontend** — a confusão mais comum, e causa de tela desatualizada:

- **TanStack Query** guarda dados que pertencem ao servidor (transcrições, usuários) e é
  invalidado depois de criar ou excluir algo
- **Zustand** (`store/authStore.ts`) guarda dados que pertencem ao navegador: só a sessão
  (`user` e `accessToken`), persistida no `localStorage`

**Nomes.** O idioma muda conforme a camada, e a divisa é o contrato da API:

- **Backend** — tudo em inglês: arquivos, classes, métodos, variáveis, constantes
- **Contrato da API** — em inglês dos dois lados. Os campos do JSON (`accessToken`,
  `originalFilename`) e os tipos que os descrevem em `frontend/src/types/` têm o mesmo nome
  no backend e no frontend, porque são a mesma coisa; traduzir um dos lados obrigaria a um
  mapa de tradução no meio
- **Frontend, fora do contrato** — em português: páginas (`TranscreverPage`), componentes
  (`Botao`, `Campo`), hooks (`useTranscricoes`), rotas (`RotaProtegida`) e os caminhos que
  aparecem na barra de endereço (`/entrar`, `/app/contas`), que o usuário lê

**Texto visível ao usuário, mensagens de erro da interface e documentação em português** —
e português leva acento: `Você`, `transcrição`, `histórico`. Comentários de código seguem o
que já está no arquivo: português sem acento, para não depender da codificação do editor.

**Commits.** Um commit por etapa da especificação, com mensagem que nomeia a etapa.

## O que nunca fazer

1. **Nunca gravar segredo no código nem no repositório.** Chave da Groq, `JWT_SECRET` e
   senha do banco vivem em `backend/.env`, que o `.gitignore` exclui. Só o `.env.example`,
   com os nomes das variáveis e sem valores, é versionado. Uma chave que chegue ao GitHub
   precisa ser **revogada** no console da Groq, não apenas apagada do arquivo.
2. **Nunca dar segredo ao frontend.** Tudo o que o frontend usa é entregue ao navegador de
   quem acessa a página. O frontend não tem `.env` e não fala com a Groq nem com o banco.
3. **Nunca usar endereço absoluto no frontend.** Toda chamada vai para o caminho relativo
   `/api/...`, que o proxy do Vite repassa ao backend em desenvolvimento e o proxy reverso
   repassa em produção. `http://localhost:3000` no código do front funciona na sua máquina
   e quebra na de qualquer outra pessoa.
4. **Nunca devolver uma entidade direto do controlador.** O `passwordHash` escapa por aí.
   Todo usuário sai pelo mapeador `toUserResponse()`.
5. **Nunca aceitar `role` pelo cadastro.** O `RegisterDto` não declara o campo, e o
   `ValidationPipe` global roda com `whitelist: true` e `forbidNonWhitelisted: true`, então
   um corpo com `role: "admin"` recebe **400**.
6. **Nunca buscar um recurso sem filtrar pelo dono.** Toda consulta a `transcriptions`
   filtra pelo `userId` do token. O que não é do usuário responde **404**, não 403 — um 403
   confirmaria que o recurso existe.
7. **Nunca importar `Repository` do TypeORM num controlador.** É o sinal de que a regra de
   negócio vazou para a camada errada.
8. **Nunca comparar senha em texto.** Só `bcrypt.compare` contra o hash gravado.
9. **Nunca persistir o arquivo de áudio.** Ele vive em memória durante a requisição; só o
   texto e os metadados vão para o banco.
10. **Nunca confiar em `synchronize: true` fora do desenvolvimento.** Ao renomear ou remover
    um campo de uma entidade, o TypeORM remove a coluna e os dados se perdem sem aviso.

## Verificação

O relato de que "tudo passou" não substitui a saída do comando. Cada etapa da especificação
traz critérios de aceite executáveis, e eles rodam no terminal antes do commit. Os quatro
pontos de revisão crítica têm comandos próprios na seção *Verificação* da especificação.
