import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '../../lib/cx';

/* -------------------------------------------------------------- Botao ----- */

type Variante = 'tinta' | 'contorno' | 'discreto' | 'correcao';

const variantes: Record<Variante, string> = {
  tinta:
    'bg-bic text-white hover:bg-bic-strong active:translate-y-px disabled:bg-ink-faint shadow-[0_1px_0_0] shadow-bic-strong',
  contorno: 'border border-ink/25 text-ink hover:border-bic hover:text-bic bg-paper-raised',
  discreto: 'text-ink-soft hover:text-bic hover:bg-bic-wash',
  correcao: 'border border-correction/40 text-correction hover:bg-correction-wash',
};

interface BotaoProps extends ComponentPropsWithoutRef<'button'> {
  variante?: Variante;
  carregando?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Botao({
  variante = 'tinta',
  carregando = false,
  className,
  children,
  disabled,
  ...resto
}: BotaoProps) {
  return (
    <button
      {...resto}
      disabled={disabled ?? carregando}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-sheet px-4 py-2.5 font-display text-sm font-semibold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-70',
        variantes[variante],
        className,
      )}
    >
      {carregando && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- Campo ----- */

interface CampoProps extends ComponentPropsWithoutRef<'input'> {
  rotulo: string;
  erro?: string;
  dica?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Campo({ rotulo, erro, dica, id, className, ...resto }: CampoProps) {
  const campoId = id ?? resto.name;
  const descricaoId = erro ? `${campoId}-erro` : dica ? `${campoId}-dica` : undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={campoId}
        className="block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft"
      >
        {rotulo}
      </label>

      <input
        {...resto}
        id={campoId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricaoId}
        className={cx(
          'w-full rounded-sheet border bg-paper-raised px-3 py-2.5 text-ink transition-colors placeholder:text-ink-faint',
          erro ? 'border-correction' : 'border-rule hover:border-ink-faint',
          className,
        )}
      />

      {erro ? (
        <p id={descricaoId} className="font-mono text-xs text-correction">
          {erro}
        </p>
      ) : dica ? (
        <p id={descricaoId} className="font-mono text-xs text-ink-faint">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- Aviso ----- */

export function Aviso({
  tom = 'correcao',
  children,
  className,
}: {
  tom?: 'correcao' | 'visto' | 'tinta';
  children: ReactNode;
  className?: string;
}) {
  const tons = {
    correcao: 'border-correction/35 bg-correction-wash text-correction',
    visto: 'border-tick/35 bg-tick-wash text-tick',
    tinta: 'border-bic/30 bg-bic-wash text-bic-strong',
  } as const;

  return (
    <p
      role={tom === 'correcao' ? 'alert' : 'status'}
      className={cx('rounded-sheet border px-3 py-2.5 text-sm', tons[tom], className)}
    >
      {children}
    </p>
  );
}

/* --------------------------------------------------------------- Folha ----- */

/** Um bloco de conteudo com a cara de uma folha solta. */
export function Folha({
  children,
  className,
  ...resto
}: ComponentPropsWithoutRef<'section'>) {
  return (
    <section
      {...resto}
      className={cx(
        'rounded-sheet border border-rule bg-paper-raised',
        className,
      )}
    >
      {children}
    </section>
  );
}

/* -------------------------------------------------------------- Rotulo ----- */

/** O rotulo que vive na margem: eyebrow em versalete monoespacado. */
export function Rotulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-faint',
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Selo ------ */

export function Selo({
  children,
  tom = 'neutro',
}: {
  children: ReactNode;
  tom?: 'neutro' | 'tinta' | 'visto' | 'correcao';
}) {
  const tons = {
    neutro: 'border-rule text-ink-soft',
    tinta: 'border-bic/40 bg-bic-wash text-bic-strong',
    visto: 'border-tick/40 bg-tick-wash text-tick',
    correcao: 'border-correction/40 bg-correction-wash text-correction',
  } as const;

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-sheet border px-1.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em]',
        tons[tom],
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ Carregando --- */

export function Carregando({ texto = 'Carregando' }: { texto?: string }) {
  return (
    <p className="flex items-center gap-2 py-8 font-mono text-sm text-ink-faint">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {texto}
    </p>
  );
}

/* ----------------------------------------------------------------- Vazio --- */

/** Tela vazia e convite para agir, nao recado de ausencia. */
export function Vazio({
  titulo,
  children,
  icone,
}: {
  titulo: string;
  children?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 py-10">
      {icone && <span className="text-ink-faint">{icone}</span>}
      <h3 className="font-display text-lg font-semibold text-ink">{titulo}</h3>
      {children && <div className="max-w-prose text-sm text-ink-soft">{children}</div>}
    </div>
  );
}
