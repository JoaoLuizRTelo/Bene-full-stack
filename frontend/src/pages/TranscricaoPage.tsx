import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Trash2 } from 'lucide-react';
import { Aviso, Botao, Carregando, Folha, Rotulo, Selo } from '../components/ui';
import { useExcluirTranscricao, useTranscricao } from '../hooks/useTranscricoes';
import { formatarDataHora, formatarDuracao, formatarTamanho } from '../lib/formato';
import { mensagemDeErro } from '../services/api';

export function TranscricaoPage() {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [copiado, setCopiado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const consulta = useTranscricao(id);
  const exclusao = useExcluirTranscricao();

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  }

  if (consulta.isPending) {
    return <Carregando texto="Abrindo a transcrição" />;
  }

  if (consulta.isError) {
    return (
      <div className="space-y-5">
        <Aviso>{mensagemDeErro(consulta.error)}</Aviso>
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-bic hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar ao histórico
        </Link>
      </div>
    );
  }

  const transcricao = consulta.data;
  const duracao = formatarDuracao(transcricao.durationSeconds);
  const palavras = transcricao.text.trim().split(/\s+/).length;

  return (
    <article className="space-y-6">
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-ink-soft transition-colors hover:text-bic"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Histórico
      </Link>

      <header>
        <Rotulo>Transcrição</Rotulo>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight break-words text-ink sm:text-3xl">
          {transcricao.originalFilename}
        </h1>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-ink-faint">
          <div className="flex gap-1.5">
            <dt>enviado</dt>
            <dd className="text-ink-soft">{formatarDataHora(transcricao.createdAt)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>tamanho</dt>
            <dd className="text-ink-soft">{formatarTamanho(transcricao.sizeBytes)}</dd>
          </div>
          {duracao && (
            <div className="flex gap-1.5">
              <dt>duração</dt>
              <dd className="text-ink-soft">{duracao}</dd>
            </div>
          )}
          <div className="flex gap-1.5">
            <dt>palavras</dt>
            <dd className="text-ink-soft">{palavras}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>idioma</dt>
            <dd className="text-ink-soft">{transcricao.language}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Selo tom="tinta">{transcricao.model}</Selo>
          <Selo>{transcricao.mimeType}</Selo>
        </div>
      </header>

      <Folha className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-2.5">
          <Rotulo>Texto</Rotulo>

          <button
            type="button"
            onClick={() => void copiar(transcricao.text)}
            className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-bic transition-colors hover:text-bic-strong"
          >
            {copiado ? (
              <>
                <Check aria-hidden className="size-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy aria-hidden className="size-4" />
                Copiar texto
              </>
            )}
          </button>
        </div>

        <div className="pauta px-5 py-3 [--spacing-pauta:2.25rem]">
          <p className="font-mono text-base leading-[2.25rem] whitespace-pre-wrap text-ink">
            {transcricao.text}
          </p>
        </div>
      </Folha>

      <footer className="border-t border-rule pt-5">
        {confirmando ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink">
              Apagar esta transcrição em definitivo? Não há como recuperar.
            </p>
            <Botao
              type="button"
              variante="correcao"
              carregando={exclusao.isPending}
              onClick={() =>
                exclusao.mutate(transcricao.id, {
                  onSuccess: () => navegar('/app', { replace: true }),
                })
              }
            >
              Apagar
            </Botao>
            <Botao type="button" variante="discreto" onClick={() => setConfirmando(false)}>
              Manter
            </Botao>
          </div>
        ) : (
          <Botao type="button" variante="correcao" onClick={() => setConfirmando(true)}>
            <Trash2 aria-hidden className="size-4" />
            Apagar transcrição
          </Botao>
        )}

        {exclusao.isError && <Aviso className="mt-4">{mensagemDeErro(exclusao.error)}</Aviso>}
      </footer>
    </article>
  );
}
