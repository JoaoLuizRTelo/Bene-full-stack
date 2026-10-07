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

export const EXTENSOES_ACEITAS = 'mp3, m4a, wav, ogg, webm, flac, mp4 e mpeg';
