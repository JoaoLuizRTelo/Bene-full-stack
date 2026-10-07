import { UserResponse } from '../../users/dto/user-response.dto';

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
}

/** Claims que o token carrega. Nada secreto: um JWT e assinado, nao cifrado. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
