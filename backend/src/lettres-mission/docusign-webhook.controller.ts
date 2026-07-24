import { Controller, Logger, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import * as crypto from 'crypto';
import { LettresMissionService } from './lettres-mission.service';

// Volontairement SANS @UseGuards : DocuSign appelle cet endpoint côté serveur,
// sans JWT applicatif. Vit dans ce module (et non dans DocusignModule) car il a
// besoin de LettresMissionService, ce qui évite tout cycle d'imports entre
// LettresMissionModule et DocusignModule.
//
// Le body est typé en `object` brut (pas une classe DTO) : le ValidationPipe
// global (whitelist + forbidNonWhitelisted) ne s'applique qu'aux paramètres dont
// le metatype est une classe personnalisée, donc un objet brut le contourne
// proprement sans qu'on ait à modeler tout le payload DocuSign (large, imbriqué,
// et qui varie selon la configuration du compte).
@Controller('api/docusign')
export class DocusignWebhookController {
  private readonly logger = new Logger(DocusignWebhookController.name);

  constructor(private readonly lettresMissionService: LettresMissionService) {}

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: true }> {
    if (!this.verifierSignatureHmac(req)) {
      this.logger.warn('Webhook DocuSign rejeté : signature HMAC invalide');
      return { received: true };
    }

    const body = req.body as Record<string, unknown> | undefined;
    const envelopeId = extractEnvelopeId(body);

    if (!envelopeId) {
      this.logger.warn('Webhook DocuSign reçu sans envelopeId exploitable');
      return { received: true };
    }

    try {
      await this.lettresMissionService.traiterEvenementWebhookDocusign(
        envelopeId,
      );
    } catch (err) {
      // On répond toujours 200 à DocuSign (sinon il retente en boucle) ; on
      // logue simplement l'échec pour investigation.
      this.logger.error(
        `Échec de traitement du webhook DocuSign pour l'enveloppe ${envelopeId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return { received: true };
  }

  // Best-effort : ne vérifie la signature que si DOCUSIGN_WEBHOOK_HMAC_KEY est
  // configurée (auto-testable dès maintenant sans compte DocuSign réel : sans
  // la variable d'env, la vérification est simplement sautée, comme aujourd'hui).
  private verifierSignatureHmac(req: RawBodyRequest<Request>): boolean {
    const key = process.env.DOCUSIGN_WEBHOOK_HMAC_KEY;
    if (!key) return true;

    const signature = req.headers['x-docusign-signature-1'];
    if (!signature || typeof signature !== 'string' || !req.rawBody) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', key)
      .update(req.rawBody)
      .digest('base64');

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== signatureBuffer.length) return false;

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }
}

function extractEnvelopeId(
  body: Record<string, unknown> | undefined,
): string | null {
  if (!body) return null;
  const direct = body['envelopeId'];
  if (typeof direct === 'string') return direct;

  const envelopeStatus = body['envelopeStatus'];
  if (
    envelopeStatus &&
    typeof envelopeStatus === 'object' &&
    typeof (envelopeStatus as Record<string, unknown>)['envelopeId'] ===
      'string'
  ) {
    return (envelopeStatus as Record<string, unknown>)['envelopeId'] as string;
  }

  const data = body['data'];
  if (
    data &&
    typeof data === 'object' &&
    typeof (data as Record<string, unknown>)['envelopeId'] === 'string'
  ) {
    return (data as Record<string, unknown>)['envelopeId'] as string;
  }

  return null;
}
