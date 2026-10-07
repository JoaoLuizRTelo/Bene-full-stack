import { Role } from '../../common/enums/role.enum';
import { User } from '../entities/user.entity';

/**
 * O que PODE SAIR sobre um usuario. Note o que nao esta aqui: passwordHash.
 * Esta e a unica forma de um usuario atravessar a fronteira da API.
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

/**
 * Mapeador explicito. E deliberadamente a unica porta de saida de um usuario:
 * um controlador que devolvesse a entidade direto levaria o passwordHash com
 * ela, que e a falha mais comum nesta camada.
 */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}
