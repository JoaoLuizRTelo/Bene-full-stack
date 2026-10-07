import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDatabaseOptions } from './config/database.config';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TranscriptionsModule } from './transcriptions/transcriptions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDatabaseOptions(
          {
            DATABASE_URL: config.getOrThrow<string>('DATABASE_URL'),
            DATABASE_SSL: config.get<string>('DATABASE_SSL') ?? 'false',
            NODE_ENV: config.get<string>('NODE_ENV') ?? 'development',
          },
          [],
        ),
        // As entidades de cada modulo entram por TypeOrmModule.forFeature().
        autoLoadEntities: true,
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    TranscriptionsModule,
  ],
})
export class AppModule {}
