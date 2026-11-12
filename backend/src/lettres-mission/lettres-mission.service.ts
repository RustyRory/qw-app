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
import { Prospect } from '../prospects/entities/prospect.entity';
import { User } from '../users/entities/user.entity';
import { Document } from '../documents/entities/document.entity';
import {
  buildLettreMissionContenu,
  LettreMissionContenu,
} from './lettre-mission-data.util';
import { renderLettreMissionHtml } from './templates/lettre-mission.template';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { ObligationsService } from '../obligations/obligations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CabinetService } from '../cabinet/cabinet.service';
import { DocumentsService, FichierRecu } from '../documents/documents.service';
import {
  Role,
  StatutKanban,
  TypeDocument,
  TypeObligation,
} from '../common/enums';
import { avancerStatutKanban } from '../common/prospect-kanban.util';
import { LETTRES_MISSION_ROOT, cheminRelatifDocument } from '../common/storage';
import { TYPES_MISSION } from '../common/types-mission';

type AuthUser = { id: string; role: Role };

const LOGO_PATH = path.join(__dirname, 'assets', 'logo.jpg');
let cachedLogoDataUri: string | null | undefined;

function logoParDefaut(): string | null {
  if (cachedLogoDataUri !== undefined) return cachedLogoDataUri;
  try {
    const buffer = fs.readFileSync(LOGO_PATH);
    cachedLogoDataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    cachedLogoDataUri = null;
  }
  return cachedLogoDataUri;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Pied de page de chaque page : mentions du cabinet + deux cases de
// paraphe visibles (cabinet, rempli à la signature de l'EC ; client, vide).
function buildFooterTemplate(
  contenu: LettreMissionContenu,
  parapheCabinet: string | null,
): string {
  const c = contenu.cabinet;
  const adresse = [c.adresse, [c.codePostal, c.ville].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(' – ');
  const caseParaphe = (titre: string, contenuCase: string) => `
    <div style="width:30mm;border:0.6px solid #1e3a8a;border-radius:2px;">
      <div style="font-size:5.5px;color:#1e3a8a;padding:1px 3px;border-bottom:0.4px solid #cbd5e1;">${titre}</div>
      <div style="height:9mm;display:flex;align-items:center;justify-content:center;">${contenuCase}</div>
    </div>`;
  return `
  <div style="font-size:6.5px;width:100%;color:#555;padding:0 15mm;line-height:1.4;display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;">
    <div>
      <div>${escapeHtml(c.raisonSociale)} – ${escapeHtml(adresse)}</div>
      <div>${escapeHtml(c.formeJuridique)} au capital de ${escapeHtml(c.capitalSocial)} – SIRET : ${escapeHtml(c.siret)} – Code APE : ${escapeHtml(c.codeApe)}</div>
      <div>N° TVA intracommunautaire : ${escapeHtml(c.tvaIntracommunautaire)} – Page <span class="pageNumber"></span>/<span class="totalPages"></span></div>
    </div>
    <div style="display:flex;gap:3mm;">
      ${caseParaphe(
        'Paraphe cabinet',
        parapheCabinet
          ? `<img src="${parapheCabinet}" style="max-height:8mm;max-width:27mm;object-fit:contain;" />`
          : '',
      )}
      ${caseParaphe('Paraphe client', '')}
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
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    private readonly auditService: AuditService,
    private readonly obligationsService: ObligationsService,
    private readonly notificationsService: NotificationsService,
    private readonly cabinetService: CabinetService,
    private readonly documentsService: DocumentsService,
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
        margin: { top: '15mm', bottom: '30mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private cheminPdf(missionId: string, version: number): string {
    const dir = path.join(LETTRES_MISSION_ROOT, missionId);
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `v${version}.pdf`);
  }

  private async missionComplete(missionId: string): Promise<Mission> {
    const mission = await this.missionRepo.findOne({
      where: { id: missionId },
      relations: ['client', 'prospect'],
    });
    if (!mission) throw new NotFoundException('Mission introuvable');
    return mission;
  }

  // Produit le PDF d'une version à partir de son contenu (instantané) et de
  // l'éventuelle signature de l'expert-comptable.
  private async ecrirePdf(l: LettreMission): Promise<void> {
    const contenu = l.contenu as unknown as LettreMissionContenu;
    const cabinet = await this.cabinetService.get();
    const signatureImage = l.signataire?.signatureDataUri ?? null;
    const html = renderLettreMissionHtml(
      contenu,
      {
        signee: l.signeeParExpert,
        nom: l.signataire
          ? `${l.signataire.prenom} ${l.signataire.nom}`
          : undefined,
        date: l.signeeAt ? l.signeeAt.toLocaleDateString('fr-FR') : undefined,
        imageDataUri: signatureImage ?? undefined,
      },
      cabinet.logoDataUri ?? logoParDefaut(),
    );
    const buffer = await this.renderPdf(
      html,
      buildFooterTemplate(contenu, l.signeeParExpert ? signatureImage : null),
    );
    const chemin = l.cheminStockage ?? this.cheminPdf(l.mission.id, l.version);
    fs.writeFileSync(chemin, buffer);
    l.cheminStockage = chemin;
  }

  private async notifierValidationAttendue(mission: Mission): Promise<void> {
    const nom = mission.prospect?.nom ?? mission.client?.raisonSociale ?? '';
    const lien = mission.prospect
      ? `/dashboard/prospects/${mission.prospect.id}`
      : `/dashboard/clients/${mission.client?.id}?tab=missions`;
    if (mission.prospect) {
      await this.obligationsService.cloturerPourProspect(
        mission.prospect.id,
        TypeObligation.LETTRE_MISSION,
      );
      await this.obligationsService.cloturerPourProspect(
        mission.prospect.id,
        TypeObligation.SIGNATURE_LETTRE_MISSION,
      );
      await this.obligationsService.ouvrirPourProspect(
        mission.prospect.id,
        TypeObligation.VALIDATION_LETTRE_MISSION,
      );
    }
    await this.notificationsService.creerPourRoles(
      [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
      'Lettre de mission à valider',
      nom,
      lien,
    );
  }

  // Crée une nouvelle version (v1 à la création de la mission, v2+ pour un
  // avenant après signature), à valider puis signer.
  async genererVersion(missionId: string): Promise<LettreMission> {
    const mission = await this.missionComplete(missionId);
    const derniere = await this.repo.findOne({
      where: { mission: { id: missionId } },
      order: { version: 'DESC' },
    });
    const cabinet = await this.cabinetService.get();
    const l = this.repo.create({
      mission,
      version: (derniere?.version ?? 0) + 1,
      contenu: buildLettreMissionContenu(mission, cabinet) as unknown as Record<
        string,
        unknown
      >,
    });
    await this.ecrirePdf(l);
    const saved = await this.repo.save(l);
    await this.notifierValidationAttendue(mission);
    return saved;
  }

  // Compatibilité : appelé à la création d'une mission.
  generateForMission(missionId: string): Promise<LettreMission> {
    return this.genererVersion(missionId);
  }

  // Remet à jour une version non signée (contenu + PDF) et annule sa
  // validation : le contenu validé n'est plus celui de la lettre.
  private async regenerer(l: LettreMission): Promise<void> {
    const mission = await this.missionComplete(l.mission.id);
    const cabinet = await this.cabinetService.get();
    const etaitValidee = l.valideeParResponsable;
    l.mission = mission;
    l.contenu = buildLettreMissionContenu(
      mission,
      cabinet,
    ) as unknown as Record<string, unknown>;
    l.valideeParResponsable = false;
    l.valideeAt = null;
    l.valideePar = null;
    await this.ecrirePdf(l);
    await this.repo.save(l);
    if (etaitValidee) await this.notifierValidationAttendue(mission);
  }

  private derniereVersion(missionId: string): Promise<LettreMission | null> {
    return this.repo.findOne({
      where: { mission: { id: missionId } },
      relations: ['mission', 'signataire'],
      order: { version: 'DESC' },
    });
  }

  // Après modification d'une mission (honoraires, répartition, dates…) :
  // version non signée → régénérée et à revalider ; version signée →
  // nouvelle version (avenant) à valider et signer.
  async apresModificationMission(missionId: string): Promise<void> {
    const derniere = await this.derniereVersion(missionId);
    if (!derniere) {
      await this.genererVersion(missionId);
      return;
    }
    if (derniere.signeeParExpert) {
      await this.genererVersion(missionId);
    } else {
      await this.regenerer(derniere);
    }
  }

  // Après modification de la fiche prospect / client (capital, régime
  // fiscal…) : seules les lettres NON signées sont mises à jour.
  async apresModificationDossier(cible: {
    prospectId?: string;
    clientId?: string;
  }): Promise<void> {
    const missions = await this.missionRepo.find({
      where: cible.prospectId
        ? { prospect: { id: cible.prospectId } }
        : { client: { id: cible.clientId } },
      select: { id: true },
    });
    for (const m of missions) {
      const derniere = await this.derniereVersion(m.id);
      if (derniere && !derniere.signeeParExpert) {
        try {
          await this.regenerer(derniere);
        } catch (err) {
          this.logger.error(
            `Régénération impossible pour la lettre ${derniere.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    }
  }

  findByMission(missionId: string): Promise<LettreMission[]> {
    return this.repo.find({
      where: { mission: { id: missionId } },
      relations: ['signataire', 'valideePar', 'documentSigneClient'],
      order: { version: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LettreMission> {
    const l = await this.repo.findOne({
      where: { id },
      relations: ['mission', 'signataire', 'valideePar', 'documentSigneClient'],
    });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    return l;
  }

  private async avecMission(id: string): Promise<LettreMission> {
    const l = await this.repo.findOne({
      where: { id },
      relations: [
        'mission',
        'mission.prospect',
        'mission.client',
        'signataire',
      ],
    });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    return l;
  }

  // Validation du contenu (responsable, expert-comptable ou admin) :
  // débloque la signature de l'expert-comptable.
  async valider(id: string, userId: string): Promise<LettreMission> {
    const l = await this.avecMission(id);
    if (l.valideeParResponsable) {
      throw new BadRequestException('Cette lettre de mission est déjà validée');
    }
    l.valideeParResponsable = true;
    l.valideeAt = new Date();
    l.valideePar = { id: userId } as User;
    await this.repo.save(l);

    const m = l.mission;
    if (m.prospect) {
      await this.obligationsService.cloturerPourProspect(
        m.prospect.id,
        TypeObligation.VALIDATION_LETTRE_MISSION,
      );
      await this.obligationsService.ouvrirPourProspect(
        m.prospect.id,
        TypeObligation.SIGNATURE_LETTRE_MISSION,
      );
    }
    await this.notificationsService.creerPourRoles(
      [Role.EXPERT_COMPTABLE],
      'Lettre de mission à signer',
      m.prospect?.nom ?? m.client?.raisonSociale ?? '',
      m.prospect
        ? `/dashboard/prospects/${m.prospect.id}`
        : `/dashboard/clients/${m.client?.id}?tab=missions`,
    );
    await this.auditService.log(
      userId,
      AuditAction.VALIDATE,
      'lettre_mission',
      id,
      {
        version: l.version,
      },
    );
    return this.findOne(id);
  }

  // Signature de l'expert-comptable (ou admin) avec la signature de ses
  // paramètres. La lettre est ensuite téléchargée et envoyée au client.
  async signer(id: string, userId: string): Promise<LettreMission> {
    const l = await this.avecMission(id);
    if (!l.valideeParResponsable) {
      throw new BadRequestException(
        "Cette lettre de mission doit d'abord être validée",
      );
    }
    if (l.signeeParExpert) {
      throw new BadRequestException('Cette lettre de mission est déjà signée');
    }
    l.signeeParExpert = true;
    l.signeeAt = new Date();
    l.signataire = await this.repo.manager.findOneByOrFail(User, {
      id: userId,
    });

    const m = l.mission;
    const proprietaire = m.client
      ? {
          cible: 'client' as const,
          ref: m.client.ref,
          nom: m.client.raisonSociale,
        }
      : {
          cible: 'prospect' as const,
          ref: m.prospect!.ref,
          nom: m.prospect!.nom,
        };
    const versionSuffixe = l.version > 1 ? `-v${l.version}` : '';
    l.cheminRelatif = cheminRelatifDocument({
      ...proprietaire,
      libelleType: `LettreMission-${TYPES_MISSION[m.type].fichier}${versionSuffixe}`,
      extension: '.pdf',
    });
    await this.ecrirePdf(l);
    await this.repo.save(l);

    if (m.prospect) {
      if (avancerStatutKanban(m.prospect, StatutKanban.LM_ENVOYEE)) {
        await this.prospectRepo.save(m.prospect);
      }
      await this.obligationsService.cloturerPourProspect(
        m.prospect.id,
        TypeObligation.SIGNATURE_LETTRE_MISSION,
      );
    }
    await this.auditService.log(
      userId,
      AuditAction.VALIDATE,
      'lettre_mission',
      id,
      {
        event: 'signature_expert',
        version: l.version,
      },
    );
    return this.findOne(id);
  }

  // Dépôt du PDF signé par le client (reçu par mail) : conservé comme
  // document du dossier et marque la lettre « signée par le client ».
  async enregistrerSignatureClient(
    id: string,
    file: FichierRecu | undefined,
    authUser: AuthUser,
  ): Promise<{ lettre: LettreMission; document: Document }> {
    const l = await this.avecMission(id);
    if (!l.signeeParExpert) {
      throw new BadRequestException(
        "La lettre doit d'abord être signée par l'expert-comptable",
      );
    }
    if (l.signeeParClientAt) {
      throw new BadRequestException(
        'La signature du client est déjà enregistrée pour cette version',
      );
    }
    if (!file || path.extname(file.originalname).toLowerCase() !== '.pdf') {
      throw new BadRequestException('Déposez le PDF signé par le client');
    }
    const m = l.mission;
    const versionSuffixe = l.version > 1 ? `-v${l.version}` : '';
    const document = await this.documentsService.upload(
      m.client ? 'client' : 'prospect',
      m.client?.id ?? m.prospect!.id,
      file,
      authUser,
      { type: TypeDocument.LETTRE_MISSION, missionId: m.id },
      {
        libelleType: `LettreMissionSigneeClient-${TYPES_MISSION[m.type].fichier}${versionSuffixe}`,
      },
    );
    l.signeeParClientAt = new Date();
    l.documentSigneClient = document;
    await this.repo.save(l);

    await this.auditService.log(
      authUser.id,
      AuditAction.VALIDATE,
      'lettre_mission',
      id,
      { event: 'signature_client_deposee', documentId: document.id },
    );
    if (m.prospect) {
      await this.notificationsService.creerPourRoles(
        [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
        'Prospect prêt à être converti en client',
        m.prospect.nom,
        `/dashboard/prospects/${m.prospect.id}`,
      );
    }
    return { lettre: await this.findOne(id), document };
  }

  // Préalable à la suppression d'une mission : impossible dès qu'une
  // version a été signée (engagement vis-à-vis du client).
  async removeByMission(missionId: string): Promise<void> {
    const lettres = await this.repo.find({
      where: { mission: { id: missionId } },
    });
    if (lettres.some((l) => l.signeeParExpert)) {
      throw new BadRequestException(
        'Impossible de supprimer cette mission : sa lettre de mission a été signée.',
      );
    }
    for (const lettre of lettres) {
      if (lettre.cheminStockage) {
        fs.rmSync(lettre.cheminStockage, { force: true });
      }
    }
    if (lettres.length > 0) await this.repo.remove(lettres);
  }

  async streamFile(id: string): Promise<StreamableFile> {
    const l = await this.repo.findOne({ where: { id } });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    if (!l.cheminStockage || !fs.existsSync(l.cheminStockage)) {
      throw new NotFoundException('Fichier introuvable sur le serveur');
    }
    const nom = l.cheminRelatif
      ? path.posix.basename(l.cheminRelatif)
      : `LettreMission-v${l.version}.pdf`;
    return new StreamableFile(fs.createReadStream(l.cheminStockage), {
      type: 'application/pdf',
      disposition: `attachment; filename="${nom.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(nom)}`,
    });
  }
}
