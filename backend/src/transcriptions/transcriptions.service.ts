import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, paginate } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { detectAudioFormat } from './audio-signature';
import {
  TranscriptionResponse,
  toTranscriptionResponse,
} from './dto/transcription-response.dto';
import { Transcription } from './entities/transcription.entity';
import { TranscriptionProvider } from './providers/transcription-provider';
import { ACCEPTED_EXTENSIONS } from './transcriptions.constants';

@Injectable()
export class TranscriptionsService {
  private readonly logger = new Logger(TranscriptionsService.name);

  constructor(
    @InjectRepository(Transcription)
    private readonly transcriptionsRepository: Repository<Transcription>,
    private readonly provider: TranscriptionProvider,
  ) {}

  async create(
    userId: string,
    file: Express.Multer.File,
    language: string,
  ): Promise<TranscriptionResponse> {
    // O Content-Type e escolhido por quem envia: o navegador o deduz da
    // extensao, entao um .txt renomeado para .mp3 chega como audio/mpeg. A
    // assinatura nos primeiros bytes e que decide - e antes de qualquer
    // chamada ao provedor, que e paga.
    const format = detectAudioFormat(file.buffer);

    if (format === null) {
      this.logger.warn(
        `Upload recusado: "${file.originalname}" chegou como ${file.mimetype} mas nao tem assinatura de audio`,
      );

      throw new BadRequestException(
        `Esse arquivo nao parece ser um audio. Formatos aceitos: ${ACCEPTED_EXTENSIONS}.`,
      );
    }

    // Falha do provedor sobe como 502 e nada e gravado.
    const result = await this.provider.transcribe(file, language);

    const transcription = this.transcriptionsRepository.create({
      userId,
      originalFilename: file.originalname.slice(0, 255),
      mimeType: file.mimetype,
      sizeBytes: file.size,
      durationSeconds:
        result.durationSeconds === undefined ? null : result.durationSeconds.toFixed(2),
      language,
      model: result.model,
      text: result.text,
    });

    const saved = await this.transcriptionsRepository.save(transcription);
    this.logger.log(`Transcricao ${saved.id} gravada para o usuario ${userId}`);

    return toTranscriptionResponse(saved);
  }

  /** O historico de um usuario. A consulta SEMPRE filtra pelo dono. */
  async findAllForUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<TranscriptionResponse>> {
    const { page, limit } = query;

    const [items, total] = await this.transcriptionsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(
      items.map((item) => toTranscriptionResponse(item, { truncate: true })),
      total,
      page,
      limit,
    );
  }

  /**
   * Uma transcricao, do dono. O filtro por userId faz parte da consulta: uma
   * transcricao de outro usuario simplesmente nao e encontrada, e a resposta e
   * 404 - nao 403, que confirmaria que o recurso existe.
   */
  async findOneForUser(id: string, userId: string): Promise<TranscriptionResponse> {
    const transcription = await this.transcriptionsRepository.findOneBy({ id, userId });

    if (!transcription) {
      throw new NotFoundException('Transcricao nao encontrada');
    }

    return toTranscriptionResponse(transcription);
  }

  async removeForUser(id: string, userId: string): Promise<void> {
    const result = await this.transcriptionsRepository.delete({ id, userId });

    if (!result.affected) {
      throw new NotFoundException('Transcricao nao encontrada');
    }
  }
}
