import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { ILike, Not, Repository } from 'typeorm';
import { Paginated, paginate } from '../common/dto/paginated-response.dto';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse, toUserResponse } from './dto/user-response.dto';
import { User } from './entities/user.entity';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /** Normaliza o e-mail antes de gravar e antes de consultar. */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const email = this.normalizeEmail(dto.email);

    if (await this.usersRepository.existsBy({ email })) {
      throw new ConflictException('E-mail ja cadastrado');
    }

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email,
      passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
      role: dto.role ?? Role.User,
      isActive: true,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Busca com o passwordHash, que a entidade marca como select: false.
   * Usado somente pelo login - nenhuma outra chamada precisa do hash.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: this.normalizeEmail(email) },
      select: ['id', 'name', 'email', 'passwordHash', 'role', 'isActive', 'createdAt'],
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email: this.normalizeEmail(email) });
  }

  async findEntityById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return user;
  }

  async findOne(id: string): Promise<UserResponse> {
    return toUserResponse(await this.findEntityById(id));
  }

  async findAll(query: ListUsersQueryDto): Promise<Paginated<UserResponse>> {
    const { page, limit, search } = query;

    const where = search?.trim()
      ? [{ name: ILike(`%${search.trim()}%`) }, { email: ILike(`%${search.trim()}%`) }]
      : undefined;

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(users.map(toUserResponse), total, page, limit);
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string): Promise<UserResponse> {
    const user = await this.findEntityById(id);

    // Um administrador nao pode se rebaixar nem se desativar: isso deixaria o
    // sistema sem nenhum administrador capaz de desfazer a acao.
    if (user.id === requesterId) {
      if (dto.role !== undefined && dto.role !== Role.Admin) {
        throw new BadRequestException('Um administrador nao pode remover o proprio papel');
      }
      if (dto.isActive === false) {
        throw new BadRequestException('Um administrador nao pode desativar a propria conta');
      }
    }

    if (dto.email !== undefined) {
      const email = this.normalizeEmail(dto.email);

      if (await this.usersRepository.existsBy({ email, id: Not(id) })) {
        throw new ConflictException('E-mail ja cadastrado');
      }

      user.email = email;
    }

    if (dto.name !== undefined) {
      user.name = dto.name.trim();
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    return toUserResponse(await this.usersRepository.save(user));
  }

  async remove(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) {
      throw new BadRequestException('Um administrador nao pode excluir a propria conta');
    }

    const user = await this.findEntityById(id);

    // As transcricoes do usuario saem com ele, pelo ON DELETE CASCADE.
    await this.usersRepository.remove(user);
  }

  count(): Promise<number> {
    return this.usersRepository.count();
  }
}
