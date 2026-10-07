import { Injectable, Logger } from '@nestjs/common';
import { TranscriptionProvider, TranscriptionResult } from './transcription-provider';

/**
 * Provedor dublê, usado quando TRANSCRIPTION_PROVIDER=mock. Existe para que a
 * aplicacao inteira possa ser construida e verificada sem uma chave da Groq -
 * e sem gastar cota em cada teste de tela.
 */
@Injectable()
export class MockTranscriptionProvider extends TranscriptionProvider {
  private readonly logger = new Logger(MockTranscriptionProvider.name);

  async transcribe(
    file: Express.Multer.File,
    language: string,
  ): Promise<TranscriptionResult> {
    this.logger.warn(
      `Transcricao simulada de "${file.originalname}". Para transcrever de verdade, ponha TRANSCRIPTION_PROVIDER=groq e a GROQ_API_KEY no .env.`,
    );

    // Um atraso curto para que a tela exerca de verdade o estado de carregamento.
    await new Promise((resolve) => setTimeout(resolve, 900));

    const kb = (file.size / 1024).toFixed(1);

    return {
      text:
        `[transcricao simulada] Este texto nao veio de um servico de transcricao: ` +
        `o provedor configurado e o "mock". O arquivo recebido foi ` +
        `"${file.originalname}" (${file.mimetype}, ${kb} KB), com o idioma "${language}". ` +
        `Para obter a transcricao real, configure TRANSCRIPTION_PROVIDER=groq e a ` +
        `GROQ_API_KEY no arquivo backend/.env e reinicie a API.`,
      model: 'mock',
      durationSeconds: undefined,
    };
  }
}
