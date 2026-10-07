import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/** Marca a rota (ou o controlador inteiro) como exclusiva dos papeis informados. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
