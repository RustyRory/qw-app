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
  const app = await NestFactory.create(AppModule);
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
