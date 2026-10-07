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
import { EXTENSOES_ACEITAS, MIME_TYPES_ACEITOS } from './transcriptions.constants';
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
        fileFilter: (
          _req: unknown,
          file: Express.Multer.File,
          callback: (error: Error | null, accept: boolean) => void,
        ) => {
          const aceito = (MIME_TYPES_ACEITOS as readonly string[]).includes(file.mimetype);

          callback(
            aceito
              ? null
              : new BadRequestException(
                  `Esse arquivo nao parece ser um audio (${file.mimetype}). Formatos aceitos: ${EXTENSOES_ACEITAS}.`,
                ),
            aceito,
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
