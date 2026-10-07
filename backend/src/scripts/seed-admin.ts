/**
 * Cria (ou promove) a conta de administrador a partir de ADMIN_EMAIL e
 * ADMIN_PASSWORD do .env.
 *
 *   npm run seed:admin
 *
 * E um script avulso de proposito: nao roda na inicializacao da API, para que
 * subir o backend nunca crie uma conta privilegiada sem alguem ter pedido.
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { hash } from 'bcryptjs';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../config/database.config';
import { Role } from '../common/enums/role.enum';
import { Transcription } from '../transcriptions/entities/transcription.entity';
import { User } from '../users/entities/user.entity';

loadEnv();

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';

  if (!email || !password) {
    throw new Error(
      'Defina ADMIN_EMAIL e ADMIN_PASSWORD no backend/.env antes de rodar o seed.',
    );
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD precisa ter ao menos 8 caracteres.');
  }

  const dataSource = new DataSource(
    buildDatabaseOptions(
      {
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        DATABASE_SSL: process.env.DATABASE_SSL ?? 'false',
        NODE_ENV: process.env.NODE_ENV ?? 'development',
      },
      [User, Transcription],
    ),
  );

  await dataSource.initialize();

  try {
    const users = dataSource.getRepository(User);
    const existente = await users.findOneBy({ email });

    if (existente) {
      existente.role = Role.Admin;
      existente.isActive = true;
      existente.passwordHash = await hash(password, 10);
      await users.save(existente);
      console.log(`Conta ${email} promovida a administrador e senha redefinida.`);
      return;
    }

    await users.save(
      users.create({
        name: 'Administrador',
        email,
        passwordHash: await hash(password, 10),
        role: Role.Admin,
        isActive: true,
      }),
    );

    console.log(`Administrador criado: ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(`\nFalha no seed do administrador:\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
