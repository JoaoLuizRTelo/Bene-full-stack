import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * O que e GRAVADO sobre uma transcricao.
 *
 * O arquivo de audio NAO entra aqui: ele vive em memoria durante a requisicao
 * e e descartado. So o texto e os metadados ficam.
 */
@Entity('transcriptions')
export class Transcription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Indexado porque toda consulta a esta tabela filtra pelo dono.
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.transcriptions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  originalFilename: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'integer' })
  sizeBytes: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  durationSeconds: string | null;

  @Column({ type: 'varchar', length: 10, default: 'pt' })
  language: string;

  @Column({ type: 'varchar', length: 80 })
  model: string;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
