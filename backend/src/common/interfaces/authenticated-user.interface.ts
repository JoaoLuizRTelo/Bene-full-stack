import { Role } from '../enums/role.enum';

/**
 * O usuario descrito pelo token, montado pela JwtStrategy e disponivel nos
 * controladores pelo decorator @CurrentUser(). Nao e a entidade do banco:
 * autenticar nao consulta o banco.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
