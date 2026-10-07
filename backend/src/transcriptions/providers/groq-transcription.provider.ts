import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { toFile } from 'groq-sdk/uploads';
import { TranscriptionProvider, TranscriptionResult } from './transcription-provider';

/**
 * Transcricao pelo modelo Whisper na Groq.
 *
 * A chave vive no .env e e lida aqui, no backend. O frontend nunca a ve: tudo
 * o que o frontend usa e entregue ao navegador de quem acessa a pagina.
 */
@Injectable()
export class GroqTranscriptionProvider extends TranscriptionProvider {
  private readonly logger = new Logger(GroqTranscriptionProvider.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(config: ConfigService) {
    super();
    this.client = new Groq({ apiKey: config.getOrThrow<string>('GROQ_API_KEY') });
    this.model = config.get<string>('GROQ_MODEL') ?? 'whisper-large-v3-turbo';
  }

  async transcribe(
    file: Express.Multer.File,
    language: string,
  ): Promise<TranscriptionResult> {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: await toFile(file.buffer, file.originalname, { type: file.mimetype }),
        model: this.model,
        language,
        // verbose_json traz a duracao do audio junto com o texto.
        response_format: 'verbose_json',
      });

      const payload = response as unknown as { text?: string; duration?: number };
      const text = payload.text?.trim();

      if (!text) {
        throw new Error('A Groq respondeu sem texto');
      }

      return {
        text,
        model: this.model,
        durationSeconds: typeof payload.duration === 'number' ? payload.duration : undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha na Groq: ${message}`);

      // Falha de servico externo e 502, nao 500: o erro nao e da nossa API.
      throw new BadGatewayException(
        'O servico de transcricao nao respondeu. Tente de novo em instantes.',
      );
    }
  }
}
