import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UploadExceptionFilter } from './common/filters/upload-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Todas as rotas vivem sob /api, que e o caminho que o proxy do Vite repassa.
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist remove o que o DTO nao declara; forbidNonWhitelisted faz a
      // requisicao FALHAR com 400 em vez de ignorar o campo em silencio. E o
      // que impede um cadastro com "role":"admin" de criar um administrador.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Traduz os erros do multer (tamanho e tipo de arquivo) para 413 e 400.
  app.useGlobalFilters(new UploadExceptionFilter());

  // Em desenvolvimento o navegador fala com o Vite, nao com o backend, e o
  // proxy torna a origem unica. O CORS fica liberado apenas para o caso de
  // alguem chamar a API direto de uma ferramenta durante os testes.
  app.enableCors({ origin: true, credentials: true });

  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port, '127.0.0.1');

  logger.log(`API do Ditado ouvindo em http://127.0.0.1:${port}/api`);
  logger.log(`Transcricao pelo provedor: ${config.get<string>('TRANSCRIPTION_PROVIDER')}`);
}

void bootstrap().catch((error: unknown) => {
  // Falha de configuracao precisa ser legivel: e o erro mais comum ao subir.
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nFalha ao iniciar a API do Ditado:\n${message}\n`);
  process.exit(1);
});
