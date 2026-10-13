import { BadRequestException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { TranscriptionProviderName } from '../config/env.validation';
import { Transcription } from './entities/transcription.entity';
import { GroqTranscriptionProvider } from './providers/groq-transcription.provider';
import { MockTranscriptionProvider } from './providers/mock-transcription.provider';
import { TranscriptionProvider } from './providers/transcription-provider';
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  AMBIGUOUS_MIME_TYPES,
} from './transcriptions.constants';
import { TranscriptionsController } from './transcriptions.controller';
import { TranscriptionsService } from './transcriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transcription]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // O audio fica em memoria e e descartado no fim da requisicao: nada
        // e gravado em disco, e so o texto vai para o banco.
        storage: memoryStorage(),
        limits: {
          fileSize: (config.get<number>('MAX_UPLOAD_MB') ?? 25) * 1024 * 1024,
          files: 1,
        },
        // Primeira peneira, pelo cabecalho que o cliente declara: barra o que
        // se anuncia como outra coisa (text/plain, application/pdf) antes de
        // ler o corpo. Quem passa aqui ainda sera conferido pela assinatura
        // dos bytes, no servico - o cabecalho e escolhido por quem envia.
        fileFilter: (
          _req: unknown,
          file: Express.Multer.File,
          callback: (error: Error | null, accept: boolean) => void,
        ) => {
          const declared = file.mimetype ?? '';
          const accepted =
            (ACCEPTED_MIME_TYPES as readonly string[]).includes(declared) ||
            (AMBIGUOUS_MIME_TYPES as readonly string[]).includes(declared);

          callback(
            accepted
              ? null
              : new BadRequestException(
                  `Esse arquivo nao parece ser um audio (${declared}). Formatos aceitos: ${ACCEPTED_EXTENSIONS}.`,
                ),
            accepted,
          );
        },
      }),
    }),
  ],
  controllers: [TranscriptionsController],
  providers: [
    TranscriptionsService,
    {
      // O provedor e escolhido na inicializacao, por variavel de ambiente.
      // Trocar mock por groq nao altera nenhuma linha do servico.
      provide: TranscriptionProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService): TranscriptionProvider =>
        config.get<string>('TRANSCRIPTION_PROVIDER') === TranscriptionProviderName.Groq
          ? new GroqTranscriptionProvider(config)
          : new MockTranscriptionProvider(),
    },
  ],
})
export class TranscriptionsModule {}
