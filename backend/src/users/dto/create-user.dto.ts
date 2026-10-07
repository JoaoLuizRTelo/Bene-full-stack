import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

/**
 * Criacao de usuario pelo servico interno (cadastro e seed). O cadastro publico
 * usa RegisterDto, que NAO declara role - e por isso que "role":"admin" num
 * cadastro recebe 400 em vez de criar um administrador.
 */
export class CreateUserDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsEmail({}, { message: 'Informe um e-mail valido' })
  @MaxLength(180)
  email: string;

  @IsString()
  @Length(8, 72, { message: 'A senha precisa ter de 8 a 72 caracteres' })
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
