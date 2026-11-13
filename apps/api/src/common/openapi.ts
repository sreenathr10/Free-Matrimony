import { applyDecorators, INestApplication } from '@nestjs/common';
import { ApiBody, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/** Documents a request body from the same Zod schema that validates it. */
export const ApiZodBody = (schema: ZodSchema, description?: string) =>
  applyDecorators(
    ApiBody({
      description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: (zodToJsonSchema as (s: unknown, o: unknown) => any)(schema, { target: 'openApi3', $refStrategy: 'none' }),
    }),
  );

export function buildOpenApi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Free Matrimony API')
    .setDescription(
      'One API for the member apps (web, iOS, Android) and the staff portals (admin, customer service, verification).\n\n' +
        'Log in with `POST /v1/auth/otp/request` then `POST /v1/auth/otp/verify`, and send the returned token as ' +
        '`Authorization: Bearer <token>`. In development the OTP code is included in the response.',
    )
    .setVersion('1')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Interactive docs at /docs and the raw spec at /docs/openapi.json. */
export function setupOpenApi(app: INestApplication) {
  SwaggerModule.setup('docs', app, buildOpenApi(app), {
    jsonDocumentUrl: 'docs/openapi.json',
    swaggerOptions: { persistAuthorization: true },
  });
}
