import { Transcription } from '../entities/transcription.entity';

/**
 * O que PODE SAIR sobre uma transcricao. userId nao esta aqui: o dono e sempre
 * quem pediu, e expor o identificador de outro usuario nao serve a nada.
 */
export interface TranscriptionResponse {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  language: string;
  model: string;
  text: string;
  createdAt: string;
}

/** Quanto do texto vai na listagem, para nao trafegar transcricoes inteiras. */
export const RESUMO_MAX = 280;

export function toTranscriptionResponse(
  transcription: Transcription,
  options: { truncate?: boolean } = {},
): TranscriptionResponse {
  const text =
    options.truncate && transcription.text.length > RESUMO_MAX
      ? `${transcription.text.slice(0, RESUMO_MAX).trimEnd()}...`
      : transcription.text;

  return {
    id: transcription.id,
    originalFilename: transcription.originalFilename,
    mimeType: transcription.mimeType,
    sizeBytes: transcription.sizeBytes,
    // numeric volta do PostgreSQL como string, para nao perder precisao.
    durationSeconds:
      transcription.durationSeconds === null ? null : Number(transcription.durationSeconds),
    language: transcription.language,
    model: transcription.model,
    text,
    createdAt: transcription.createdAt.toISOString(),
  };
}
