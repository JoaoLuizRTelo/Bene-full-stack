import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Role } from '../common/enums/role.enum';
import { UserResponse, toUserResponse } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponse, JwtPayload } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Mensagem unica para qualquer falha de credencial: nao revela quais e-mails existem. */
const CREDENCIAL_INVALIDA = 'E-mail ou senha incorretos';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private sign(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Cadastro publico. O papel e sempre Role.User: o RegisterDto nao aceita
   * role, e aqui ele tambem nao e lido de lugar nenhum.
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create({ ...dto, role: Role.User });

    return { user: toUserResponse(user), accessToken: this.sign(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // Conta inexistente, senha errada e conta inativa dao a mesma resposta.
    if (!user || !user.isActive) {
      throw new UnauthorizedException(CREDENCIAL_INVALIDA);
    }

    // A senha em texto nunca e comparada diretamente.
    if (!(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(CREDENCIAL_INVALIDA);
    }

    return { user: toUserResponse(user), accessToken: this.sign(user) };
  }

  /**
   * Dados da sessao atual. Consulta o banco de proposito: o token pode ter
   * sido emitido antes de o administrador desativar ou alterar a conta.
   */
  async me(userId: string): Promise<UserResponse> {
    const user = await this.usersService.findEntityById(userId);

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    return toUserResponse(user);
  }
}
