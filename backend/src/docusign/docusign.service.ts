import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as docusign from 'docusign-esign';
import { DocusignStatutEnvelope } from '../common/enums';

interface DocusignConfig {
  integrationKey: string;
  userId: string;
  accountId: string;
  privateKey: Buffer;
  oAuthBasePath: string;
}

interface CachedToken {
  accessToken: string;
  basePath: string;
  expiresAt: number;
}

// Réponse de l'endpoint OAuth userinfo de DocuSign : snake_case, contrairement au
// reste de l'API REST (camelCase). Ne pas aligner sur les autres interfaces du SDK.
interface DocusignUserInfo {
  accounts?: Array<{
    account_id: string;
    base_uri: string;
    is_default: boolean;
  }>;
}

const JWT_SCOPES = ['signature', 'impersonation'];
const JWT_EXPIRES_IN_SECONDS = 3600;
const TOKEN_REFRESH_MARGIN_SECONDS = 300;

function unescapeNewlines(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function mapEnvelopeStatus(
  status: string | undefined,
): DocusignStatutEnvelope | null {
  switch (status) {
    case 'sent':
      return DocusignStatutEnvelope.ENVOYE;
    case 'delivered':
      return DocusignStatutEnvelope.LIVRE;
    case 'completed':
      return DocusignStatutEnvelope.SIGNE;
    case 'declined':
      return DocusignStatutEnvelope.REFUSE;
    case 'voided':
      return DocusignStatutEnvelope.ANNULE;
    default:
      return null;
  }
}

@Injectable()
export class DocusignService {
  private readonly logger = new Logger(DocusignService.name);
  private cachedToken: CachedToken | null = null;

  private getConfig(): DocusignConfig | null {
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    const userId = process.env.DOCUSIGN_USER_ID;
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
    const rawPrivateKey = process.env.DOCUSIGN_PRIVATE_KEY;
    if (!integrationKey || !userId || !accountId || !rawPrivateKey) {
      return null;
    }
    return {
      integrationKey,
      userId,
      accountId,
      privateKey: Buffer.from(unescapeNewlines(rawPrivateKey)),
      oAuthBasePath:
        process.env.DOCUSIGN_OAUTH_BASE_PATH ?? 'account-d.docusign.com',
    };
  }

  isConfigured(): boolean {
    return this.getConfig() !== null;
  }

  private async getAuthenticatedClient(): Promise<{
    apiClient: docusign.ApiClient;
    accountId: string;
  }> {
    const config = this.getConfig();
    if (!config) {
      throw new ServiceUnavailableException(
        'Intégration DocuSign non configurée côté serveur.',
      );
    }

    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now) {
      const apiClient = new docusign.ApiClient();
      apiClient.setOAuthBasePath(config.oAuthBasePath);
      apiClient.setBasePath(this.cachedToken.basePath);
      apiClient.addDefaultHeader(
        'Authorization',
        `Bearer ${this.cachedToken.accessToken}`,
      );
      return { apiClient, accountId: config.accountId };
    }

    const apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath(config.oAuthBasePath);

    let tokenResult: { body: { access_token: string } };
    try {
      const rawResult: unknown = await apiClient.requestJWTUserToken(
        config.integrationKey,
        config.userId,
        JWT_SCOPES,
        config.privateKey,
        JWT_EXPIRES_IN_SECONDS,
      );
      tokenResult = rawResult as { body: { access_token: string } };
    } catch (err) {
      this.logger.error(
        "Échec de l'authentification DocuSign (JWT) — vérifiez l'Integration Key, " +
          "l'User ID, la clé privée et le consentement one-time.",
        err instanceof Error ? err.message : String(err),
      );
      throw new ServiceUnavailableException(
        "Impossible de s'authentifier auprès de DocuSign.",
      );
    }

    const accessToken = tokenResult.body.access_token;
    apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

    let userInfo: DocusignUserInfo;
    try {
      userInfo = (await apiClient.getUserInfo(accessToken)) as DocusignUserInfo;
    } catch (err) {
      this.logger.error(
        'Échec de récupération des informations de compte DocuSign',
        err instanceof Error ? err.message : String(err),
      );
      throw new ServiceUnavailableException(
        'Impossible de récupérer les informations du compte DocuSign.',
      );
    }

    const account = userInfo.accounts?.find(
      (a) => a.account_id === config.accountId,
    );
    if (!account) {
      throw new ServiceUnavailableException(
        'Le compte DocuSign configuré (DOCUSIGN_ACCOUNT_ID) est introuvable pour cet utilisateur.',
      );
    }

    const basePath = `${account.base_uri}/restapi`;
    apiClient.setBasePath(basePath);

    this.cachedToken = {
      accessToken,
      basePath,
      expiresAt:
        now + (JWT_EXPIRES_IN_SECONDS - TOKEN_REFRESH_MARGIN_SECONDS) * 1000,
    };

    return { apiClient, accountId: config.accountId };
  }

  async envoyerPourSignature(params: {
    pdfBuffer: Buffer;
    nomFichier: string;
    destinataireEmail: string;
    destinataireNom: string;
    emailSubject: string;
    anchorString: string;
    // Ancre répétée dans le pied de page de chaque page (voir
    // buildFooterTemplate dans lettres-mission.service.ts) : DocuSign place un
    // tab "Initial Here" à chaque occurrence trouvée, donc une par page.
    initialAnchorString?: string;
    webhookUrl?: string;
  }): Promise<{ envelopeId: string }> {
    const { apiClient, accountId } = await this.getAuthenticatedClient();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    const document: docusign.Document = {
      documentBase64: params.pdfBuffer.toString('base64'),
      name: params.nomFichier,
      fileExtension: 'pdf',
      documentId: '1',
    };

    const signHere: docusign.SignHere = {
      anchorString: params.anchorString,
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '-10',
    };

    const initialHere: docusign.InitialHere | undefined =
      params.initialAnchorString
        ? {
            anchorString: params.initialAnchorString,
            anchorUnits: 'pixels',
            anchorXOffset: '0',
            anchorYOffset: '-4',
          }
        : undefined;

    const signer: docusign.Signer = {
      email: params.destinataireEmail,
      name: params.destinataireNom,
      recipientId: '1',
      routingOrder: '1',
      tabs: {
        signHereTabs: [signHere],
        ...(initialHere ? { initialHereTabs: [initialHere] } : {}),
      },
    };

    const envelopeDefinition: docusign.EnvelopeDefinition = {
      emailSubject: params.emailSubject,
      documents: [document],
      recipients: { signers: [signer] },
      status: 'sent',
    };

    if (params.webhookUrl) {
      envelopeDefinition.eventNotifications = [
        {
          url: params.webhookUrl,
          includeHMAC: process.env.DOCUSIGN_WEBHOOK_HMAC_KEY ? 'true' : 'false',
          envelopeEvents: [
            'sent',
            'delivered',
            'completed',
            'declined',
            'voided',
          ].map((code) => ({ envelopeEventStatusCode: code })),
        },
      ];
    }

    let summary: docusign.EnvelopeSummary;
    try {
      summary = await envelopesApi.createEnvelope(accountId, {
        envelopeDefinition,
      });
    } catch (err) {
      this.logger.error(
        "Échec de création de l'enveloppe DocuSign",
        err instanceof Error ? err.message : String(err),
      );
      throw new ServiceUnavailableException(
        "Impossible d'envoyer l'enveloppe DocuSign.",
      );
    }

    if (!summary.envelopeId) {
      throw new ServiceUnavailableException(
        "DocuSign n'a pas renvoyé d'identifiant d'enveloppe.",
      );
    }

    return { envelopeId: summary.envelopeId };
  }

  async getStatut(envelopeId: string): Promise<DocusignStatutEnvelope | null> {
    const { apiClient, accountId } = await this.getAuthenticatedClient();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const envelope = await envelopesApi.getEnvelope(accountId, envelopeId);
    return mapEnvelopeStatus(envelope.status);
  }

  async telechargerDocumentSigne(envelopeId: string): Promise<Buffer> {
    const { apiClient, accountId } = await this.getAuthenticatedClient();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    // documentId '1' = le document envoyé, pas 'combined' (qui ajoute le
    // certificat de complétion DocuSign en pages supplémentaires).
    const result = await envelopesApi.getDocument(
      accountId,
      envelopeId,
      '1',
      {},
    );
    return Buffer.isBuffer(result) ? result : Buffer.from(result, 'binary');
  }

  async annulerEnveloppe(envelopeId: string, raison: string): Promise<void> {
    const { apiClient, accountId } = await this.getAuthenticatedClient();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    try {
      await envelopesApi.update(accountId, envelopeId, {
        envelopeDefinition: { status: 'voided', voidedReason: raison },
      });
    } catch (err) {
      // Best-effort : on ne bloque jamais un renvoi si l'annulation échoue
      // (enveloppe déjà expirée/annulée côté DocuSign, etc.).
      this.logger.warn(
        `Échec de l'annulation de l'enveloppe DocuSign ${envelopeId}`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
