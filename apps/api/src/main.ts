import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupOpenApi } from './common/openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') ?? true });
  app.enableShutdownHooks();
  if (process.env.API_DOCS !== 'false') setupOpenApi(app);
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
