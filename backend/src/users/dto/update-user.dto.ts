import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

/**
 * Alteracao de conta, rota exclusiva de administrador. Aqui o role E aceito,
 * porque quem chama ja passou pela RolesGuard.
 */
export class UpdateUserDto {
  @IsString()
  @Length(2, 120)
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Informe um e-mail valido' })
  @MaxLength(180)
  @IsOptional()
  email?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
