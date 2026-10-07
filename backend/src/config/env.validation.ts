import { Type, plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum TranscriptionProviderName {
  Mock = 'mock',
  Groq = 'groq',
}

/**
 * As variaveis de ambiente sao validadas na inicializacao: e melhor quebrar ao
 * subir, com mensagem clara, do que na primeira requisicao que precisa delas.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  // process.env entrega tudo como string. @Type converte antes de validar -
  // sem isso, @IsInt() reprova "3000" por nao ser numero.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL e obrigatoria' })
  DATABASE_URL: string;

  @IsBooleanString()
  @IsOptional()
  DATABASE_SSL: string = 'false';

  @IsString()
  @MinLength(16, {
    message:
      'JWT_SECRET e obrigatoria e precisa ter ao menos 16 caracteres. Gere um valor aleatorio longo.',
  })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

  @IsIn(Object.values(TranscriptionProviderName))
  @IsOptional()
  TRANSCRIPTION_PROVIDER: TranscriptionProviderName = TranscriptionProviderName.Mock;

  @IsString()
  @IsOptional()
  GROQ_API_KEY: string = '';

  @IsString()
  @IsOptional()
  GROQ_MODEL: string = 'whisper-large-v3-turbo';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  MAX_UPLOAD_MB: number = 25;

  @IsString()
  @IsOptional()
  ADMIN_EMAIL: string = 'admin@ditado.dev';

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD: string = '';
}

export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const config = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    const detalhes = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join('; ')}`)
      .join('\n');
    throw new Error(
      `Configuracao invalida em backend/.env:\n${detalhes}\n\nCompare com backend/.env.example.`,
    );
  }

  // A chave da Groq so e exigida quando o provedor escolhido e o da Groq.
  if (
    config.TRANSCRIPTION_PROVIDER === TranscriptionProviderName.Groq &&
    !config.GROQ_API_KEY.trim()
  ) {
    throw new Error(
      'TRANSCRIPTION_PROVIDER=groq exige GROQ_API_KEY. Use TRANSCRIPTION_PROVIDER=mock enquanto nao tiver a chave.',
    );
  }

  return config;
}
