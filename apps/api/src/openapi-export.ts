import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { AppModule } from './app.module';
import { buildOpenApi } from './common/openapi';

/** Writes openapi.json so client SDKs (TypeScript, Dart) can be generated without running the server. */
async function main() {
  process.env.DATABASE_URL ??= 'postgres://unused';
  process.env.JWT_SECRET ??= 'unused';
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  app.setGlobalPrefix('v1');
  const out = path.resolve(__dirname, '../openapi.json');
  writeFileSync(out, JSON.stringify(buildOpenApi(app), null, 2) + '\n');
  await app.close();
  console.log(`Wrote ${out}`);
}
main();
