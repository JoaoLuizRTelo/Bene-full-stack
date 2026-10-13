import { useEffect, useReducer, useState } from 'react';

/**
 * A linha de ditado: o elemento de assinatura da pagina.
 *
 * E a tese do produto em movimento - som entrando pela esquerda, escrita
 * saindo sobre a pauta, os dois sincronizados pelo mesmo relogio. Nao e
 * decoracao: e a explicacao mais curta possivel do que a aplicacao faz.
 *
 * Quem pediu menos movimento (prefers-reduced-motion) ve o estado final,
 * completo e legivel, sem nenhuma animacao.
 */

const FALA =
  'Ata da reunião de terça: o prazo do relatório passou para o dia vinte, e a Marina ficou responsável por fechar os números até sexta.';

/** Alturas fixas: a onda e sempre a mesma, para a demo ser reproduzivel. */
const ONDA = [
  18, 34, 52, 41, 63, 78, 58, 44, 30, 47, 69, 86, 72, 55, 38, 26, 44, 61, 80, 94, 77, 59, 43,
  31, 22, 39, 57, 74, 88, 70, 52, 36, 25, 41, 60, 76, 64, 48, 33, 20, 35, 54, 71, 85, 68, 50,
  34, 23, 16, 28,
];

const MS_POR_CARACTERE = 28;
const PAUSA_FINAL_MS = 2600;

function prefereMenosMovimento(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * O ciclo da demo. Reiniciar e remontar: o contador volta a zero pelo estado
 * inicial, sem que o efeito precise zerar nada.
 */
export function DemoDitado() {
  const [ciclo, reiniciar] = useReducer((n: number) => n + 1, 0);

  return <Linha key={ciclo} aoTerminar={reiniciar} />;
}

function Linha({ aoTerminar }: { aoTerminar: () => void }) {
  const [estatico] = useState(prefereMenosMovimento);
  const [escritos, setEscritos] = useState(() => (prefereMenosMovimento() ? FALA.length : 0));

  useEffect(() => {
    if (estatico) return;

    const relogio = window.setInterval(() => {
      setEscritos((atual) => Math.min(atual + 1, FALA.length));
    }, MS_POR_CARACTERE);

    return () => window.clearInterval(relogio);
  }, [estatico]);

  const terminou = escritos >= FALA.length;

  // Ao chegar no fim, espera e pede ao pai um novo ciclo.
  useEffect(() => {
    if (estatico || !terminou) return;

    const espera = window.setTimeout(aoTerminar, PAUSA_FINAL_MS);
    return () => window.clearTimeout(espera);
  }, [terminou, estatico, aoTerminar]);

  const progresso = escritos / FALA.length;

  return (
    <figure className="m-0 overflow-hidden rounded-sheet border border-rule bg-paper-raised">
      {/* Cabecalho: o arquivo que entrou */}
      <figcaption className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <span className="truncate font-mono text-xs text-ink-soft">reuniao-terca.m4a</span>
        <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
          {terminou ? 'transcrito' : 'transcrevendo'}
        </span>
      </figcaption>

      {/* O som */}
      <div className="px-4 pt-5">
        <div
          className="flex h-16 items-end gap-[3px]"
          role="img"
          aria-label="Forma de onda do áudio sendo percorrida"
        >
          {ONDA.map((altura, indice) => {
            const percorrido = indice / ONDA.length <= progresso;

            return (
              <span
                key={indice}
                aria-hidden
                className={
                  percorrido
                    ? 'flex-1 rounded-full bg-bic transition-colors duration-150'
                    : 'flex-1 rounded-full bg-rule transition-colors duration-150'
                }
                style={{ height: `${altura}%` }}
              />
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between font-mono text-[0.6875rem] text-ink-faint">
          <span>0:00</span>
          <span>0:42</span>
        </div>
      </div>

      {/* A escrita, sobre a pauta */}
      <div className="pauta mt-1 border-t border-rule px-4 py-3 [--spacing-pauta:2.125rem]">
        <p
          aria-hidden
          className="min-h-[6.375rem] font-mono text-[0.9375rem] leading-[2.125rem] text-ink"
        >
          {FALA.slice(0, escritos)}
          {!terminou && <span className="cursor-ditado">&nbsp;</span>}
        </p>
      </div>

      {/* Para leitor de tela: o resultado, nao o processo */}
      <p className="sr-only">Texto transcrito: {FALA}</p>
    </figure>
  );
}
