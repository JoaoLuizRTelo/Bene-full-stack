import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';

/**
 * O multer lanca MulterError, que o Nest nao conhece e transformaria em 500.
 * Aqui cada codigo vira o status que o contrato da API promete:
 *   LIMIT_FILE_SIZE -> 413     outros problemas de upload -> 400
 */
@Catch(MulterError)
export class UploadExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UploadExceptionFilter.name);

  catch(error: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const exception =
      error.code === 'LIMIT_FILE_SIZE'
        ? new HttpException(
            'O arquivo passa do limite de tamanho permitido',
            HttpStatus.PAYLOAD_TOO_LARGE,
          )
        : new BadRequestException(`Falha no envio do arquivo: ${error.message}`);

    this.logger.warn(`MulterError ${error.code}: ${error.message}`);

    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
