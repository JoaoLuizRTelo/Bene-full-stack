import { useState } from 'react';
import { Search, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { Aviso, Botao, Campo, Carregando, Rotulo, Selo, Vazio } from '../components/ui';
import { useAlterarConta, useContas, useExcluirConta } from '../hooks/useContas';
import { formatarData } from '../lib/formato';
import { mensagemDeErro } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function ContasPage() {
  const eu = useAuthStore((estado) => estado.user);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const contas = useContas(pagina, busca);
  const alteracao = useAlterarConta();
  const exclusao = useExcluirConta();

  const paginas = contas.data ? Math.ceil(contas.data.total / contas.data.limit) : 0;
  const erro = alteracao.error ?? exclusao.error;

  return (
    <div className="space-y-6">
      <header>
        <Rotulo>Administração</Rotulo>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Contas
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-soft">
          Promova, desative ou exclua contas. Excluir uma conta apaga as transcrições dela.
          A sua própria conta não pode ser rebaixada nem excluída aqui.
        </p>
      </header>

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          setPagina(1);
        }}
        className="flex items-end gap-3 border-b border-rule pb-5"
      >
        <div className="flex-1">
          <Campo
            rotulo="Buscar por nome ou e-mail"
            name="busca"
            value={busca}
            placeholder="ana, @teste.dev..."
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>

        <Botao type="submit" variante="contorno" className="mb-px">
          <Search aria-hidden className="size-4" />
          Buscar
        </Botao>
      </form>

      {erro && <Aviso>{mensagemDeErro(erro)}</Aviso>}

      {contas.isPending && <Carregando texto="Buscando as contas" />}

      {contas.isError && <Aviso>{mensagemDeErro(contas.error)}</Aviso>}

      {contas.data?.items.length === 0 && (
        <Vazio titulo="Nenhuma conta encontrada" icone={<UserRound aria-hidden className="size-6" />}>
          {busca
            ? `Nada corresponde a "${busca}". Limpe a busca para ver todas as contas.`
            : 'Ainda não há contas cadastradas.'}
        </Vazio>
      )}

      {contas.data && contas.data.items.length > 0 && (
        <ul className="divide-y divide-rule">
          {contas.data.items.map((conta) => {
            const souEu = conta.id === eu?.id;
            const ocupado = alteracao.isPending || exclusao.isPending;

            return (
              <li key={conta.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-semibold text-ink">
                        {conta.name}
                      </span>

                      {conta.role === 'admin' && (
                        <Selo tom="tinta">
                          <ShieldCheck aria-hidden className="mr-1 size-3" />
                          admin
                        </Selo>
                      )}
                      {!conta.isActive && <Selo tom="correcao">desativada</Selo>}
                      {souEu && <Selo tom="visto">você</Selo>}
                    </div>

                    <p className="mt-0.5 truncate font-mono text-sm text-ink-soft">
                      {conta.email}
                    </p>
                    <p className="mt-1 font-mono text-[0.6875rem] text-ink-faint">
                      conta criada em {formatarData(conta.createdAt)}
                    </p>
                  </div>

                  {!souEu && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Botao
                        type="button"
                        variante="contorno"
                        disabled={ocupado}
                        onClick={() =>
                          alteracao.mutate({
                            id: conta.id,
                            dados: { role: conta.role === 'admin' ? 'user' : 'admin' },
                          })
                        }
                      >
                        {conta.role === 'admin' ? 'Tornar usuário' : 'Tornar admin'}
                      </Botao>

                      <Botao
                        type="button"
                        variante="contorno"
                        disabled={ocupado}
                        onClick={() =>
                          alteracao.mutate({
                            id: conta.id,
                            dados: { isActive: !conta.isActive },
                          })
                        }
                      >
                        {conta.isActive ? 'Desativar' : 'Reativar'}
                      </Botao>

                      {excluindo === conta.id ? (
                        <>
                          <Botao
                            type="button"
                            variante="correcao"
                            disabled={ocupado}
                            onClick={() =>
                              exclusao.mutate(conta.id, {
                                onSuccess: () => setExcluindo(null),
                              })
                            }
                          >
                            Confirmar exclusão
                          </Botao>
                          <Botao
                            type="button"
                            variante="discreto"
                            onClick={() => setExcluindo(null)}
                          >
                            Manter
                          </Botao>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Excluir a conta de ${conta.name}`}
                          disabled={ocupado}
                          onClick={() => setExcluindo(conta.id)}
                          className="rounded-sheet p-2 text-ink-faint transition-colors hover:bg-correction-wash hover:text-correction disabled:opacity-50"
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {paginas > 1 && (
        <nav
          aria-label="Páginas das contas"
          className="flex items-center justify-between border-t border-rule pt-4"
        >
          <Botao
            type="button"
            variante="contorno"
            disabled={pagina <= 1}
            onClick={() => setPagina((atual) => atual - 1)}
          >
            Anterior
          </Botao>

          <span className="font-mono text-xs text-ink-faint">
            Página {pagina} de {paginas}
          </span>

          <Botao
            type="button"
            variante="contorno"
            disabled={pagina >= paginas}
            onClick={() => setPagina((atual) => atual + 1)}
          >
            Próxima
          </Botao>
        </nav>
      )}
    </div>
  );
}
