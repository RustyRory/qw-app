import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './app.module';

function messagesValidation(errors: ValidationError[]): string[] {
  const messages = errors.flatMap((e) => [
    ...Object.values(e.constraints ?? {}),
    ...messagesValidation(e.children ?? []),
  ]);
  return [...new Set(messages)];
}

async function bootstrap() {
  // rawBody: true expose req.rawBody, nécessaire pour vérifier la signature
  // HMAC du webhook DocuSign (DOCUSIGN_WEBHOOK_HMAC_KEY) sans perturber le
  // parsing JSON normal des autres routes.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Un seul message lisible (sans doublon) au lieu d'une liste : le
      // frontend l'affiche tel quel.
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException(messagesValidation(errors).join(' · ')),
    }),
  );
  app.enableCors({ origin: process.env.FRONTEND_URL });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
