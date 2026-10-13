import { LogOut, ShieldCheck } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cx } from '../../lib/cx';
import { Marca } from './Marca';

const classeAba = ({ isActive }: { isActive: boolean }) =>
  cx(
    'inline-flex items-center gap-1.5 border-b-2 px-1 pb-2.5 font-display text-sm font-semibold transition-colors',
    isActive
      ? 'border-bic text-bic'
      : 'border-transparent text-ink-soft hover:border-rule hover:text-ink',
  );

/** Cabecalho, navegacao e rodape da area interna. */
export function LayoutApp() {
  const { user, sair } = useAuthStore();
  const navegar = useNavigate();

  function encerrar() {
    sair();
    navegar('/', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-paper-raised">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Marca para="/app" />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="font-display text-sm font-semibold leading-tight text-ink">
                {user?.name}
              </p>
              <p className="font-mono text-[0.6875rem] leading-tight text-ink-faint">
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={encerrar}
              className="inline-flex items-center gap-1.5 rounded-sheet border border-ink/20 px-3 py-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:border-correction hover:text-correction"
            >
              <LogOut aria-hidden className="size-4" />
              Sair
            </button>
          </div>
        </div>

        <nav
          aria-label="Seções do painel"
          className="mx-auto w-full max-w-5xl px-4 sm:px-6"
        >
          <div className="flex items-center gap-6">
            <NavLink to="/app" end className={classeAba}>
              Transcrever
            </NavLink>

            {user?.role === 'admin' && (
              <NavLink to="/app/contas" className={classeAba}>
                <ShieldCheck aria-hidden className="size-4" />
                Contas
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-rule">
        <p className="mx-auto w-full max-w-5xl px-4 py-5 font-mono text-xs text-ink-faint sm:px-6">
          Nenhum áudio enviado fica armazenado. Apenas o texto transcrito.
        </p>
      </footer>
    </div>
  );
}
