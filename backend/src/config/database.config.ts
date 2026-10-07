import { DataSourceOptions } from 'typeorm';

export interface DatabaseEnv {
  DATABASE_URL: string;
  DATABASE_SSL: string;
  NODE_ENV: string;
}

/**
 * Opcoes de conexao compartilhadas entre a aplicacao e os scripts (seed).
 *
 * synchronize: true e opcao DE DESENVOLVIMENTO. A cada inicializacao o TypeORM
 * compara as entidades com as tabelas e ajusta o que for diferente - o que
 * significa que renomear ou remover um campo REMOVE a coluna e os dados dela,
 * sem aviso. Em producao o esquema muda por migracoes versionadas.
 */
export function buildDatabaseOptions(
  env: DatabaseEnv,
  entities: DataSourceOptions['entities'],
): DataSourceOptions {
  const useSsl = String(env.DATABASE_SSL).toLowerCase() === 'true';

  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    entities,
    synchronize: env.NODE_ENV !== 'production',
    logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Bancos gerenciados (Neon) exigem TLS; o certificado deles nao esta na
    // cadeia local, por isso rejectUnauthorized: false.
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}
