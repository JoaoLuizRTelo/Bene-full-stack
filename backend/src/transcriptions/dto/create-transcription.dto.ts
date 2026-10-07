import { IsOptional, IsString, Length } from 'class-validator';

/**
 * As partes de texto do multipart. O arquivo em si nao passa por DTO: ele e
 * validado pelo multer (tamanho e tipo) no controlador.
 */
export class CreateTranscriptionDto {
  @IsString()
  @Length(2, 5, { message: 'O idioma e um codigo de 2 a 5 caracteres, como "pt"' })
  @IsOptional()
  language?: string;
}
