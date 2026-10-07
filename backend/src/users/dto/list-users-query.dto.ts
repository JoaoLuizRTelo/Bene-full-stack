import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  /** Busca por parte do nome ou do e-mail. */
  @IsString()
  @MaxLength(180)
  @IsOptional()
  search?: string;
}
