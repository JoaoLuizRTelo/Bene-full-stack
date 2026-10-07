import { Link } from 'react-router-dom';

/**
 * A marca: o nome escrito sobre a propria linha de pauta, com o cursor no fim.
 * O mesmo gesto do hero, reduzido ao tamanho de uma assinatura.
 */
export function Marca({ para = '/' }: { para?: string }) {
  return (
    <Link
      to={para}
      className="group inline-flex items-baseline gap-1.5 font-display text-xl font-bold tracking-[-0.03em] text-ink"
    >
      <span className="border-b-2 border-margin/70 leading-none transition-colors group-hover:border-bic">
        Ditado
      </span>
      <span aria-hidden className="cursor-ditado h-[0.9em]" />
    </Link>
  );
}
