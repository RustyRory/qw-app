import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { LettreMission } from './entities/lettre-mission.entity';
import { Mission } from '../missions/entities/mission.entity';
import { User } from '../users/entities/user.entity';
import { CreateLettreMissionDto } from './dto/create-lettre.dto';
import { EnvoyerDocusignDto } from './dto/envoyer-docusign.dto';
import {
  buildLettreMissionContenu,
  LettreMissionContenu,
} from './lettre-mission-data.util';
import { renderLettreMissionHtml } from './templates/lettre-mission.template';
import { DocusignService } from '../docusign/docusign.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { DocusignStatutEnvelope } from '../common/enums';

const DOCUSIGN_ANCHOR_STRING = '/sig-client/';
const DOCUSIGN_INITIALES_ANCHOR_STRING = '/init-client/';

const UPLOADS_ROOT = path.join(
  process.env.UPLOADS_ROOT ?? path.join(process.cwd(), 'uploads'),
  'lettres-mission',
);

const LOGO_PATH = path.join(__dirname, 'assets', 'logo.jpg');
let cachedLogoDataUri: string | null | undefined;

function getLogoDataUri(): string | null {
  if (cachedLogoDataUri === undefined) {
    try {
      const buffer = fs.readFileSync(LOGO_PATH);
      cachedLogoDataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch {
      cachedLogoDataUri = null;
    }
  }
  return cachedLogoDataUri;
}
function buildFooterTemplate(
  expertSignatureImageDataUri?: string | null,
): string {
  const parapheExpert = expertSignatureImageDataUri
    ? `<img src="${expertSignatureImageDataUri}" style="height:9px;max-width:36px;object-fit:contain;vertical-align:middle;" />`
    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

  return `
  <div style="font-size:7px;width:100%;color:#555;padding:0 15mm;line-height:1.4;">
    <div>QW CONSEILS - 29 Rue du Colisée – 75008 PARIS</div>
    <div>SAS d'expertise-comptable au capital de 10 000 € - Siret : 952 244 887 00016 – Code APE : 6920 Z</div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span>N° Tva intracommunautaire : FR89 952 244 887</span>
      <span>
        Page <span class="pageNumber"></span>/<span class="totalPages"></span>
        &nbsp;–&nbsp;Initiales expert-comptable : ${parapheExpert}
        &nbsp;–&nbsp;Initiales client :
        <span style="font-size:1px;color:#ffffff;">${DOCUSIGN_INITIALES_ANCHOR_STRING}</span>
      </span>
    </div>
  </div>`;
}

@Injectable()
export class LettresMissionService {
  private readonly logger = new Logger(LettresMissionService.name);

  constructor(
    @InjectRepository(LettreMission)
    private readonly repo: Repository<LettreMission>,
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,
    private readonly docusignService: DocusignService,
    private readonly auditService: AuditService,
  ) {}

  private async renderPdf(
    html: string,
    footerTemplate: string,
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate,
        margin: { top: '15mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private writePdfFile(missionId: string, buffer: Buffer): string {
    const dir = path.join(UPLOADS_ROOT, missionId);
    fs.mkdirSync(dir, { recursive: true });
    const cheminStockage = path.join(dir, 'v1.pdf');
    fs.writeFileSync(cheminStockage, buffer);
    return cheminStockage;
  }

  async generateForMission(missionId: string): Promise<LettreMission> {
    const mission = await this.missionRepo.findOne({
      where: { id: missionId },
      relations: ['client'],
    });
    if (!mission) throw new NotFoundException('Mission introuvable');

    const contenu = buildLettreMissionContenu(mission);
    const html = renderLettreMissionHtml(
      contenu,
      { signee: false },
      getLogoDataUri(),
    );
    const buffer = await this.renderPdf(html, buildFooterTemplate(null));
    const cheminStockage = this.writePdfFile(mission.id, buffer);

    return this.repo.save(
      this.repo.create({
        mission: { id: mission.id } as Mission,
        contenu: contenu as unknown as Record<string, unknown>,
        cheminStockage,
        version: 1,
      }),
    );
  }

  async regenerateLatestForMission(missionId: string): Promise<void> {
    const latest = await this.repo.findOne({
      where: { mission: { id: missionId } },
      order: { version: 'DESC' },
    });
    if (!latest || !latest.cheminStockage || latest.signeeParExpert) return;

    const mission = await this.missionRepo.findOne({
      where: { id: missionId },
      relations: ['client'],
    });
    if (!mission) return;

    const contenu = buildLettreMissionContenu(mission);
    const html = renderLettreMissionHtml(
      contenu,
      { signee: false },
      getLogoDataUri(),
    );
    const buffer = await this.renderPdf(html, buildFooterTemplate(null));
    fs.writeFileSync(latest.cheminStockage, buffer);

    latest.contenu = contenu as unknown as Record<string, unknown>;
    await this.repo.save(latest);
  }

  async create(dto: CreateLettreMissionDto): Promise<LettreMission> {
    const derniere = await this.repo.findOne({
      where: { mission: { id: dto.missionId } },
      order: { version: 'DESC' },
    });
    const l = this.repo.create({
      mission: { id: dto.missionId } as Mission,
      contenu: dto.contenu,
      version: derniere ? derniere.version + 1 : 1,
    });
    return this.repo.save(l);
  }

  findByMission(missionId: string): Promise<LettreMission[]> {
    return this.repo.find({
      where: { mission: { id: missionId } },
      order: { version: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LettreMission> {
    const l = await this.repo.findOne({
      where: { id },
      relations: ['mission', 'signataire'],
    });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    return l;
  }

  async signer(id: string, userId: string): Promise<LettreMission> {
    const l = await this.repo.findOneBy({ id });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    if (l.signeeParExpert) {
      throw new BadRequestException('Cette lettre de mission est déjà signée');
    }
    l.signeeParExpert = true;
    l.signeeAt = new Date();
    l.signataire = { id: userId } as User;
    const saved = await this.repo.save(l);

    await this.regeneratePdf(saved.id);

    return this.findOne(saved.id);
  }

  private async regeneratePdf(id: string): Promise<void> {
    const l = await this.repo.findOne({
      where: { id },
      relations: ['signataire'],
    });
    if (!l || !l.cheminStockage) return;

    try {
      const contenu = l.contenu as unknown as LettreMissionContenu;
      const html = renderLettreMissionHtml(
        contenu,
        {
          signee: l.signeeParExpert,
          nom: l.signataire
            ? `${l.signataire.prenom} ${l.signataire.nom}`
            : undefined,
          date: l.signeeAt ? l.signeeAt.toLocaleDateString('fr-FR') : undefined,
          imageDataUri: l.signataire?.signatureDataUri ?? undefined,
        },
        getLogoDataUri(),
      );
      const buffer = await this.renderPdf(
        html,
        buildFooterTemplate(l.signataire?.signatureDataUri ?? null),
      );
      fs.writeFileSync(l.cheminStockage, buffer);
    } catch (err) {
      this.logger.error(
        `Échec de régénération du PDF pour la lettre de mission ${id}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async envoyerPourSignatureClient(
    id: string,
    dto: EnvoyerDocusignDto,
    userId: string,
  ): Promise<LettreMission> {
    const l = await this.repo.findOneBy({ id });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    if (!l.signeeParExpert || !l.cheminStockage) {
      throw new BadRequestException(
        "La lettre de mission doit d'abord être signée par l'expert-comptable.",
      );
    }
    if (l.docusignStatut === DocusignStatutEnvelope.SIGNE) {
      throw new BadRequestException(
        'Cette lettre de mission a déjà été signée par le client.',
      );
    }
    if (
      l.docusignStatut === DocusignStatutEnvelope.ENVOYE ||
      l.docusignStatut === DocusignStatutEnvelope.LIVRE
    ) {
      throw new BadRequestException(
        'Une signature est déjà en cours pour cette lettre de mission.',
      );
    }

    if (
      l.docusignEnvelopeId &&
      (l.docusignStatut === DocusignStatutEnvelope.REFUSE ||
        l.docusignStatut === DocusignStatutEnvelope.ANNULE)
    ) {
      await this.docusignService.annulerEnveloppe(
        l.docusignEnvelopeId,
        'Nouvelle enveloppe envoyée depuis QW Conseils',
      );
    }

    const pdfBuffer = fs.readFileSync(l.cheminStockage);
    const webhookUrl = process.env.DOCUSIGN_WEBHOOK_URL || undefined;

    const { envelopeId } = await this.docusignService.envoyerPourSignature({
      pdfBuffer,
      nomFichier: `lettre-mission-${l.id}.pdf`,
      destinataireEmail: dto.email,
      destinataireNom: dto.nom,
      emailSubject: 'Lettre de mission à signer',
      anchorString: DOCUSIGN_ANCHOR_STRING,
      initialAnchorString: DOCUSIGN_INITIALES_ANCHOR_STRING,
      webhookUrl,
    });

    l.docusignEnvelopeId = envelopeId;
    l.docusignStatut = DocusignStatutEnvelope.ENVOYE;
    l.docusignDestinataireEmail = dto.email;
    l.docusignDestinataireNom = dto.nom;
    l.docusignEnvoyeAt = new Date();
    const saved = await this.repo.save(l);

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'lettre_mission',
      l.id,
      {
        event: 'docusign_envoye',
        envelopeId,
      },
    );

    return this.findOne(saved.id);
  }

  async rafraichirStatutDocusign(id: string): Promise<LettreMission> {
    const l = await this.repo.findOneBy({ id });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    if (!l.docusignEnvelopeId) return this.findOne(id);
    if (
      l.docusignStatut === DocusignStatutEnvelope.SIGNE ||
      l.docusignStatut === DocusignStatutEnvelope.REFUSE ||
      l.docusignStatut === DocusignStatutEnvelope.ANNULE
    ) {
      return this.findOne(id);
    }

    const statut = await this.docusignService.getStatut(l.docusignEnvelopeId);
    if (statut && statut !== l.docusignStatut) {
      l.docusignStatut = statut;
      if (statut === DocusignStatutEnvelope.SIGNE) {
        l.signeeParClientAt = new Date();
        if (l.cheminStockage) {
          try {
            const buffer = await this.docusignService.telechargerDocumentSigne(
              l.docusignEnvelopeId,
            );
            fs.writeFileSync(l.cheminStockage, buffer);
          } catch (err) {
            this.logger.error(
              `Échec de téléchargement du document signé DocuSign pour la lettre ${id}`,
              err instanceof Error ? err.stack : String(err),
            );
          }
        }
      }
      await this.repo.save(l);
    }

    return this.findOne(id);
  }

  // Appelé par le webhook DocuSign (non authentifié) : ne fait jamais d'appel
  // sortant vers DocuSign pour un envelopeId inconnu ou déjà dans un état
  // terminal, afin d'éviter qu'un identifiant deviné/énuméré ne déclenche du
  // trafic sortant inutile.
  async traiterEvenementWebhookDocusign(envelopeId: string): Promise<void> {
    const l = await this.repo.findOneBy({ docusignEnvelopeId: envelopeId });
    if (!l) return;
    if (
      l.docusignStatut === DocusignStatutEnvelope.SIGNE ||
      l.docusignStatut === DocusignStatutEnvelope.REFUSE ||
      l.docusignStatut === DocusignStatutEnvelope.ANNULE
    ) {
      return;
    }
    await this.rafraichirStatutDocusign(l.id);
  }

  async streamFile(id: string): Promise<StreamableFile> {
    const l = await this.repo.findOne({ where: { id } });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    if (!l.cheminStockage || !fs.existsSync(l.cheminStockage)) {
      throw new NotFoundException('Fichier introuvable sur le serveur');
    }

    return new StreamableFile(fs.createReadStream(l.cheminStockage), {
      type: 'application/pdf',
      disposition: `attachment; filename="lettre-mission-${l.id}.pdf"`,
    });
  }
}
