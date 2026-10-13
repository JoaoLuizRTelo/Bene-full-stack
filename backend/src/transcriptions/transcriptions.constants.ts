/** Tipos que a Groq aceita no endpoint de transcricao. */
export const MIME_TYPES_ACEITOS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/x-flac',
  'video/mp4',
  'video/webm',
] as const;

/**
 * Tipos genericos, que nao afirmam nada sobre o conteudo. O curl envia
 * application/octet-stream quando nao reconhece a extensao, e alguns
 * clientes mandam um campo vazio. Eles passam pelo filtro do Multer e sao
 * decididos pela assinatura dos bytes, no servico.
 */
export const MIME_TYPES_AMBIGUOS = [
  'application/octet-stream',
  'binary/octet-stream',
  '',
] as const;

export const EXTENSOES_ACEITAS = 'mp3, m4a, wav, ogg, webm, flac, mp4 e mpeg';
