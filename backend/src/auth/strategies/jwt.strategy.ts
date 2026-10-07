import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JwtPayload } from '../dto/auth-response.dto';

/**
 * Valida a assinatura e a validade do token. O banco NAO e consultado aqui:
 * autenticar e conferir a assinatura, e e isso que torna a API stateless.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload?.sub || !Object.values(Role).includes(payload.role as Role)) {
      throw new UnauthorizedException('Token invalido');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as Role,
    };
  }
}
