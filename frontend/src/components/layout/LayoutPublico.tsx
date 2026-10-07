import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Marca } from './Marca';

/** Cabecalho e rodape das telas abertas a visitantes. */
export function LayoutPublico() {
  const user = useAuthStore((estado) => estado.user);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Marca />

          <nav className="flex items-center gap-1.5">
            {user ? (
              <Link
                to="/app"
                className="rounded-sheet bg-bic px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-bic-strong"
              >
                Ir para o painel
              </Link>
            ) : (
              <>
                <Link
                  to="/entrar"
                  className="rounded-sheet px-3 py-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:bg-bic-wash hover:text-bic"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastrar"
                  className="rounded-sheet bg-bic px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-bic-strong"
                >
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-rule bg-paper-sunken">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-mono text-xs">
            Ditado — projeto academico de Topicos Especiais em Programacao, UNEMAT Sinop.
          </p>
          <p className="font-mono text-xs">
            Transcricao por modelo Whisper. Nenhum audio e armazenado.
          </p>
        </div>
      </footer>
    </div>
  );
}
