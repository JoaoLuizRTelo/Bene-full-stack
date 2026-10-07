import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail valido' })
  @MaxLength(180)
  email: string;

  @IsString()
  @Length(1, 72)
  password: string;
}
