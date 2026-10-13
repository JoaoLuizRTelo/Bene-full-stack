import { Link } from 'react-router-dom';
import { ArrowRight, FileAudio, KeyRound, Lock, Trash2 } from 'lucide-react';
import { DemoDitado } from '../components/DemoDitado';
import { Rotulo } from '../components/ui';

const FORMATOS = ['mp3', 'm4a', 'wav', 'ogg', 'webm', 'flac', 'mp4', 'mpeg'];

/* O percurso e uma sequencia de verdade - cada passo depende do anterior -,
   e por isso ele e numerado. */
const PERCURSO = [
  {
    titulo: 'Você envia o arquivo',
    texto:
      'Escolhe um áudio de até 25 MB na área interna. O arquivo sai do seu computador e não fica guardado em lugar nenhum.',
  },
  {
    titulo: 'A transcrição acontece no servidor',
    texto:
      'O áudio é enviado ao modelo de transcrição pela nossa API, com a credencial guardada no servidor. O seu navegador nunca vê essa chave.',
  },
  {
    titulo: 'O texto fica no seu histórico',
    texto:
      'A transcrição é salva na sua conta, com o nome do arquivo, o tamanho e a data. Só você lê, e você apaga quando quiser.',
  },
];

const GARANTIAS = [
  {
    icone: FileAudio,
    titulo: 'O áudio não é guardado',
    texto: 'Ele atravessa a API em memória e é descartado. Fica apenas o texto.',
  },
  {
    icone: Lock,
    titulo: 'Histórico fechado',
    texto: 'Cada transcrição pertence a uma conta. Pedir a de outra pessoa não devolve nada.',
  },
  {
    icone: Trash2,
    titulo: 'Exclusão definitiva',
    texto: 'Apagar uma transcrição a remove do banco, sem cópia e sem lixeira.',
  },
  {
    icone: KeyRound,
    titulo: 'Senha nunca em texto',
    texto: 'Guardamos apenas o hash, e ele não sai da nossa API em resposta nenhuma.',
  },
];

export function LandingPage() {
  return (
    <>
      {/* ------------------------------------------------------------- Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,27rem)] lg:gap-14">
          <div className="entra">
            <Rotulo>Transcrição de áudio</Rotulo>

            <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,4.25rem)] leading-[0.95] font-bold tracking-[-0.035em] text-ink">
              Você fala.
              <br />
              Ele escreve
              <span className="text-bic">.</span>
            </h1>

            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
              Ditado transforma gravação em texto. Entrevista, aula, reunião, recado de
              áudio: envie o arquivo e leia o que foi dito, sem transcrever na mão.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/cadastrar"
                className="inline-flex items-center gap-2 rounded-sheet bg-bic px-5 py-3 font-display text-sm font-semibold text-white shadow-[0_1px_0_0] shadow-bic-strong transition-colors hover:bg-bic-strong active:translate-y-px"
              >
                Criar uma conta
                <ArrowRight aria-hidden className="size-4" />
              </Link>

              <Link
                to="/entrar"
                className="rounded-sheet border border-ink/25 px-5 py-3 font-display text-sm font-semibold text-ink transition-colors hover:border-bic hover:text-bic"
              >
                Entrar
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-rule pt-5">
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
                  Tamanho máximo
                </dt>
                <dd className="font-display text-base font-semibold text-ink">25 MB</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
                  Idioma
                </dt>
                <dd className="font-display text-base font-semibold text-ink">Português</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
                  Formatos
                </dt>
                <dd className="font-mono text-sm text-ink">{FORMATOS.join(' · ')}</dd>
              </div>
            </dl>
          </div>

          {/* A assinatura da pagina */}
          <div className="entra [animation-delay:120ms]">
            <DemoDitado />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- O percurso */}
      <section
        id="como-funciona"
        className="border-y border-rule bg-paper-sunken py-16 lg:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <header className="margem pl-5">
            <Rotulo>Como funciona</Rotulo>
            <h2 className="mt-3 max-w-[28ch] font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Três passos, nessa ordem
            </h2>
          </header>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-sheet border border-rule bg-rule md:grid-cols-3">
            {PERCURSO.map((passo, indice) => (
              <li key={passo.titulo} className="bg-paper-raised p-6">
                <span className="font-mono text-sm font-medium text-bic">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">
                  {passo.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------- As garantias */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <header className="margem pl-5">
            <Rotulo>O que fazemos com os seus arquivos</Rotulo>
            <h2 className="mt-3 max-w-[32ch] font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Quatro regras que valem para toda conta
            </h2>
          </header>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8">
            {GARANTIAS.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-4 border-t border-rule pt-5">
                <Icone aria-hidden className="mt-0.5 size-5 shrink-0 text-bic" />
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- Chamada */}
      <section className="border-t border-rule bg-paper-sunken py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Comece pelo primeiro áudio
            </h2>
            <p className="mt-2 max-w-[48ch] text-ink-soft">
              A conta é gratuita e leva um minuto. Depois disso, é arrastar o arquivo e ler.
            </p>
          </div>

          <Link
            to="/cadastrar"
            className="inline-flex shrink-0 items-center gap-2 rounded-sheet bg-bic px-5 py-3 font-display text-sm font-semibold text-white shadow-[0_1px_0_0] shadow-bic-strong transition-colors hover:bg-bic-strong active:translate-y-px"
          >
            Criar uma conta
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
