import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Exige um token valido. Sem token, ou com token invalido ou expirado,
 * responde 401 e a requisicao termina aqui.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
