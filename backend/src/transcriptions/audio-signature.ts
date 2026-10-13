/**
 * Deteccao de formato pelos BYTES do arquivo, e nao pelo cabecalho que o
 * cliente declara.
 *
 * O Content-Type de um upload e escolhido por quem envia: o navegador o
 * preenche a partir da extensao do arquivo, entao um .txt renomeado para
 * .mp3 chega anunciado como audio/mpeg. Confiar nesse cabecalho deixa passar
 * qualquer arquivo com a extensao certa - e o custo e uma chamada paga a
 * Groq para transcrever um arquivo que nunca foi audio.
 *
 * Todo formato de audio tem uma assinatura nos primeiros bytes. Ela nao
 * mente, porque e o proprio codec que a escreve.
 */

/** Um formato reconhecido pela assinatura, ou `null` se nenhuma bateu. */
export type FormatoDeAudio = 'mp3' | 'wav' | 'ogg' | 'flac' | 'mp4' | 'webm';

/** `true` se os bytes de `buffer` na posicao `offset` sao o texto ASCII `assinatura`. */
function comecaCom(buffer: Buffer, assinatura: string, offset = 0): boolean {
  return (
    buffer.length >= offset + assinatura.length &&
    buffer.toString('latin1', offset, offset + assinatura.length) === assinatura
  );
}

/**
 * Um quadro de MPEG audio comeca com 11 bits ligados (o "frame sync").
 * Em bytes: 0xFF seguido de um byte cujos tres bits mais altos sao 1.
 */
function temFrameSyncMpeg(buffer: Buffer, offset: number): boolean {
  return (
    buffer.length >= offset + 2 &&
    buffer[offset] === 0xff &&
    (buffer[offset + 1] & 0xe0) === 0xe0
  );
}

/**
 * O formato do arquivo, lido dos primeiros bytes. `null` quando nenhuma
 * assinatura conhecida aparece - e ai o arquivo nao e audio, qualquer que
 * seja a extensao ou o Content-Type.
 */
export function detectarFormatoDeAudio(buffer: Buffer): FormatoDeAudio | null {
  if (buffer.length < 12) {
    return null;
  }

  // RIFF....WAVE - o tamanho fica entre as duas marcas, por isso o offset 8.
  if (comecaCom(buffer, 'RIFF') && comecaCom(buffer, 'WAVE', 8)) {
    return 'wav';
  }

  if (comecaCom(buffer, 'OggS')) {
    return 'ogg';
  }

  if (comecaCom(buffer, 'fLaC')) {
    return 'flac';
  }

  // ISO BMFF (mp4, m4a): o primeiro box e o ftyp, logo apos o tamanho.
  if (comecaCom(buffer, 'ftyp', 4)) {
    return 'mp4';
  }

  // Matroska/WebM: o EBML header, 0x1A45DFA3.
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'webm';
  }

  // MP3 com tag ID3 na frente: "ID3" e, depois dela, os quadros.
  if (comecaCom(buffer, 'ID3')) {
    return 'mp3';
  }

  // MP3 sem tag: o arquivo abre direto num quadro. Alguns gravadores deixam
  // bytes de preenchimento antes do primeiro, por isso a varredura curta.
  for (let offset = 0; offset < Math.min(buffer.length - 1, 1024); offset++) {
    if (temFrameSyncMpeg(buffer, offset)) {
      return 'mp3';
    }
  }

  return null;
}
