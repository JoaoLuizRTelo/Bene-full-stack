import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Paginated } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import { TranscriptionResponse } from './dto/transcription-response.dto';
import { ACCEPTED_EXTENSIONS } from './transcriptions.constants';
import { TranscriptionsService } from './transcriptions.service';

/**
 * O controlador extrai parametros e devolve a resposta. O recorte por dono vem
 * do token, pelo @CurrentUser(), e o servico e que aplica o filtro no banco -
 * nenhuma consulta e montada aqui.
 */
@Controller('transcriptions')
@UseGuards(JwtAuthGuard)
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<TranscriptionResponse>> {
    return this.transcriptionsService.findAllForUser(user.id, query);
  }

  /**
   * O envio do audio. O corpo e multipart/form-data porque um arquivo binario
   * nao cabe em JSON. O limite de tamanho e o filtro de tipo ficam no
   * FileInterceptor, configurado no modulo: o que estoura o limite nem chega
   * ao servico, e vira 413 pelo UploadExceptionFilter.
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateTranscriptionDto,
  ): Promise<TranscriptionResponse> {
    if (!file) {
      throw new BadRequestException(
        `Envie um arquivo de audio no campo "file". Formatos aceitos: ${ACCEPTED_EXTENSIONS}.`,
      );
    }

    return this.transcriptionsService.create(user.id, file, dto.language ?? 'pt');
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TranscriptionResponse> {
    return this.transcriptionsService.findOneForUser(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.transcriptionsService.removeForUser(id, user.id);
  }
}
