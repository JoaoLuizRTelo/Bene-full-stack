import { Link } from 'react-router-dom';
import { Rotulo } from '../components/ui';

export function NaoEncontradaPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-20 sm:px-6">
      <Rotulo>Erro 404</Rotulo>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
        Essa pagina nao existe
      </h1>
      <p className="mt-2 text-ink-soft">
        O endereco esta errado ou a pagina saiu do ar.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-sheet bg-bic px-5 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-bic-strong"
      >
        Ir para a pagina inicial
      </Link>
    </div>
  );
}
