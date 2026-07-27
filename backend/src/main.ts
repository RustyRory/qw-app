import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

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
    }),
  );
  app.enableCors({ origin: process.env.FRONTEND_URL });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
