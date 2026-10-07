import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

/**
 * O que PODE ENTRAR num cadastro publico.
 *
 * Note o que NAO esta aqui: role. Com whitelist + forbidNonWhitelisted no
 * ValidationPipe global, um corpo com "role":"admin" nao e ignorado em
 * silencio - ele recebe 400. Toda conta nasce com Role.User.
 */
export class RegisterDto {
  @IsString()
  @Length(2, 120, { message: 'O nome precisa ter de 2 a 120 caracteres' })
  name: string;

  @IsEmail({}, { message: 'Informe um e-mail valido' })
  @MaxLength(180)
  email: string;

  @IsString()
  @Length(8, 72, { message: 'A senha precisa ter de 8 a 72 caracteres' })
  password: string;
}
