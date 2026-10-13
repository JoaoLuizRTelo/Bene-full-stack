import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileAudio, Inbox, Trash2, Upload } from 'lucide-react';
import {
  Aviso,
  Botao,
  Carregando,
  Folha,
  Rotulo,
  Selo,
  Vazio,
} from '../components/ui';
import {
  useEnviarAudio,
  useExcluirTranscricao,
  useTranscricoes,
} from '../hooks/useTranscricoes';
import { formatarDataHora, formatarDuracao, formatarTamanho } from '../lib/formato';
import { mensagemDeErro } from '../services/api';

const LIMITE_MB = 25;
const FORMATOS = 'mp3, m4a, wav, ogg, webm, flac, mp4 e mpeg';

export function TranscreverPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const entradaRef = useRef<HTMLInputElement>(null);

  const historico = useTranscricoes(pagina);
  const envio = useEnviarAudio();
  const exclusao = useExcluirTranscricao();

  const acimaDoLimite = arquivo !== null && arquivo.size > LIMITE_MB * 1024 * 1024;

  function escolher(selecionado: File | null) {
    envio.reset();
    setArquivo(selecionado);
  }

  function transcrever() {
    if (!arquivo || acimaDoLimite) return;

    envio.mutate(
      { arquivo, idioma: 'pt' },
      {
        onSuccess: () => {
          setArquivo(null);
          setPagina(1);
          if (entradaRef.current) entradaRef.current.value = '';
        },
      },
    );
  }

  const paginas = historico.data ? Math.ceil(historico.data.total / historico.data.limit) : 0;

  return (
    <div className="space-y-12">
      {/* ------------------------------------------------------- O envio */}
      <section>
        <Rotulo>Novo áudio</Rotulo>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Envie um arquivo para transcrever
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-soft">
          Aceitamos {FORMATOS}, com até {LIMITE_MB} MB. O arquivo não fica guardado — só o
          texto que voltar.
        </p>

        <label
          onDragOver={(evento) => {
            evento.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(evento) => {
            evento.preventDefault();
            setArrastando(false);
            escolher(evento.dataTransfer.files[0] ?? null);
          }}
          className={[
            'mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-sheet border-2 border-dashed px-6 py-12 text-center transition-colors',
            arrastando ? 'border-bic bg-bic-wash' : 'border-rule bg-paper-raised hover:border-ink-faint',
          ].join(' ')}
        >
          <input
            ref={entradaRef}
            type="file"
            accept="audio/*,video/mp4,video/webm,.m4a,.mp3,.wav,.ogg,.webm,.flac,.mp4,.mpeg"
            className="sr-only"
            onChange={(evento) => escolher(evento.target.files?.[0] ?? null)}
          />

          <Upload aria-hidden className="size-6 text-bic" />

          {arquivo ? (
            <>
              <span className="font-mono text-sm text-ink">{arquivo.name}</span>
              <span className="font-mono text-xs text-ink-faint">
                {formatarTamanho(arquivo.size)} · {arquivo.type || 'tipo não informado'}
              </span>
            </>
          ) : (
            <>
              <span className="font-display text-base font-semibold text-ink">
                Arraste o áudio aqui ou clique para escolher
              </span>
              <span className="font-mono text-xs text-ink-faint">
                Um arquivo por vez, até {LIMITE_MB} MB
              </span>
            </>
          )}
        </label>

        {acimaDoLimite && (
          <Aviso className="mt-4">
            Esse arquivo tem {formatarTamanho(arquivo.size)} e passa de {LIMITE_MB} MB.
            Tente um áudio mais curto.
          </Aviso>
        )}

        {envio.isError && <Aviso className="mt-4">{mensagemDeErro(envio.error)}</Aviso>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Botao
            type="button"
            onClick={transcrever}
            disabled={!arquivo || acimaDoLimite}
            carregando={envio.isPending}
          >
            {envio.isPending ? 'Transcrevendo' : 'Transcrever'}
          </Botao>

          {arquivo && !envio.isPending && (
            <Botao
              type="button"
              variante="discreto"
              onClick={() => {
                escolher(null);
                if (entradaRef.current) entradaRef.current.value = '';
              }}
            >
              Trocar o arquivo
            </Botao>
          )}

          {envio.isPending && (
            <span className="font-mono text-xs text-ink-faint">
              Um áudio longo pode levar um minuto. Não feche a página.
            </span>
          )}
        </div>
      </section>

      {/* -------------------------------------------- A transcricao recente */}
      {envio.isSuccess && envio.data && (
        <Folha className="entra overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
            <div className="flex items-center gap-2">
              <Selo tom="visto">Pronto</Selo>
              <span className="truncate font-mono text-sm text-ink-soft">
                {envio.data.originalFilename}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(envio.data.text)}
                className="font-display text-sm font-semibold text-bic hover:underline"
              >
                Copiar texto
              </button>
              <Link
                to={`/app/transcricoes/${envio.data.id}`}
                className="font-display text-sm font-semibold text-ink-soft hover:text-bic"
              >
                Abrir
              </Link>
            </div>
          </header>

          <div className="pauta px-5 py-3 [--spacing-pauta:2.125rem]">
            <p className="font-mono text-[0.9375rem] leading-[2.125rem] whitespace-pre-wrap text-ink">
              {envio.data.text}
            </p>
          </div>
        </Folha>
      )}

      {/* --------------------------------------------------- O historico */}
      <section>
        <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
          <div>
            <Rotulo>Histórico</Rotulo>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">
              Suas transcrições
            </h2>
          </div>

          {historico.data && historico.data.total > 0 && (
            <span className="font-mono text-xs text-ink-faint">
              {historico.data.total}{' '}
              {historico.data.total === 1 ? 'transcrição' : 'transcrições'}
            </span>
          )}
        </div>

        {historico.isPending && <Carregando texto="Buscando o seu histórico" />}

        {historico.isError && (
          <Aviso className="mt-4">{mensagemDeErro(historico.error)}</Aviso>
        )}

        {historico.data?.items.length === 0 && (
          <Vazio
            titulo="Nenhuma transcrição ainda"
            icone={<Inbox aria-hidden className="size-6" />}
          >
            Envie o primeiro áudio ali acima. O texto aparece aqui e fica salvo na sua
            conta.
          </Vazio>
        )}

        {historico.data && historico.data.items.length > 0 && (
          <ul className="divide-y divide-rule">
            {historico.data.items.map((item) => {
              const duracao = formatarDuracao(item.durationSeconds);

              return (
                <li key={item.id} className="group py-4">
                  <div className="flex items-start justify-between gap-4">
                    <Link to={`/app/transcricoes/${item.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileAudio aria-hidden className="size-4 shrink-0 text-ink-faint" />
                        <span className="truncate font-display text-base font-semibold text-ink group-hover:text-bic">
                          {item.originalFilename}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                        {item.text}
                      </p>

                      <p className="mt-1.5 font-mono text-[0.6875rem] text-ink-faint">
                        {formatarDataHora(item.createdAt)} ·{' '}
                        {formatarTamanho(item.sizeBytes)}
                        {duracao ? ` · ${duracao}` : ''} · {item.model}
                      </p>
                    </Link>

                    <button
                      type="button"
                      aria-label={`Excluir a transcrição de ${item.originalFilename}`}
                      disabled={exclusao.isPending}
                      onClick={() => exclusao.mutate(item.id)}
                      className="shrink-0 rounded-sheet p-2 text-ink-faint transition-colors hover:bg-correction-wash hover:text-correction disabled:opacity-50"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {exclusao.isError && (
          <Aviso className="mt-4">{mensagemDeErro(exclusao.error)}</Aviso>
        )}

        {paginas > 1 && (
          <nav
            aria-label="Páginas do histórico"
            className="mt-6 flex items-center justify-between border-t border-rule pt-4"
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
      </section>
    </div>
  );
}
