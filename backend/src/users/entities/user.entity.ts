import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Transcription } from '../../transcriptions/entities/transcription.entity';

/**
 * O que e GRAVADO sobre um usuario. Nao e o que entra (DTO) nem o que sai
 * (UserResponse): passwordHash existe aqui e nao pode existir em nenhuma
 * resposta da API.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  // O e-mail e gravado sempre em minusculas, para que Ana@teste.dev e
  // ana@teste.dev sejam a mesma conta.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 180, unique: true })
  email: string;

  // 60 caracteres e o tamanho exato de um hash bcrypt.
  @Column({ type: 'varchar', length: 60, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Transcription, (transcription) => transcription.user)
  transcriptions: Transcription[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
