import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { User } from '../users/entities/user.entity';
import {
  Role,
  ScreeningStatut,
  StatutClient,
  TypeEntite,
} from '../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ScoringService } from '../scoring/scoring.service';
import { RegistreGelsService } from './registre-gels.service';
import { TypeRecherche, normaliser, rechercher } from './correspondance-noms';
import {
  ScreeningCorrespondance,
  StatutCorrespondance,
} from './entities/screening-correspondance.entity';

export type CibleScreening = 'prospect' | 'client';

interface PersonneControlee {
  libelle: string;
  nom: string;
  type: TypeRecherche;
}

@Injectable()
export class ScreeningService {
  private readonly logger = new Logger(ScreeningService.name);

  constructor(
    @InjectRepository(ScreeningCorrespondance)
    private readonly repo: Repository<ScreeningCorrespondance>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    @InjectRepository(BeneficiaireEffectif)
    private readonly uboRepo: Repository<BeneficiaireEffectif>,
    private readonly registre: RegistreGelsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly scoringService: ScoringService,
  ) {}

  private async personnes(
    cible: CibleScreening,
    id: string,
  ): Promise<{ nomDossier: string; personnes: PersonneControlee[] } | null> {
    const dossier =
      cible === 'client'
        ? await this.clientRepo.findOneBy({ id })
        : await this.prospectRepo.findOneBy({ id });
    if (!dossier) return null;
    const nom =
      cible === 'client'
        ? (dossier as Client).raisonSociale
        : (dossier as Prospect).nom;
    const personnes: PersonneControlee[] = [
      {
        libelle:
          dossier.typeEntite === TypeEntite.PERSONNE_MORALE
            ? `Entité : ${nom}`
            : `Client : ${nom}`,
        nom,
        type:
          dossier.typeEntite === TypeEntite.PERSONNE_MORALE
            ? 'ENTITE'
            : 'PERSONNE',
      },
    ];
    if (dossier.representantLegal) {
      personnes.push({
        libelle: `Représentant légal : ${dossier.representantLegal}`,
        nom: dossier.representantLegal,
        type: 'PERSONNE',
      });
    }
    const ubos = await this.uboRepo.find({
      where: cible === 'client' ? { client: { id } } : { prospect: { id } },
    });
    for (const u of ubos) {
      const n = `${u.prenom ?? ''} ${u.nom}`.trim();
      personnes.push({
        libelle: `Bénéficiaire effectif : ${n}`,
        nom: n,
        type: 'PERSONNE',
      });
    }
    return { nomDossier: nom, personnes };
  }

  private filtre(cible: CibleScreening, id: string) {
    return cible === 'client' ? { client: { id } } : { prospect: { id } };
  }

  // Contrôle un dossier sur le registre du jour, enregistre les nouvelles
  // correspondances et met à jour le statut du dossier.
  async controler(
    cible: CibleScreening,
    id: string,
    userId?: string,
  ): Promise<boolean> {
    const registre = await this.registre.obtenirAJour();
    if (!registre) {
      this.logger.warn('Registre des gels indisponible : contrôle reporté');
      return false;
    }
    const info = await this.personnes(cible, id);
    if (!info) throw new NotFoundException('Dossier introuvable');

    const existantes = await this.repo.find({ where: this.filtre(cible, id) });
    const cle = (personne: string, idRegistre: number) =>
      `${normaliser(personne)}#${idRegistre}`;
    const connues = new Set(
      existantes.map((c) => cle(c.personneControlee, c.idRegistre)),
    );
    const nouvelles: ScreeningCorrespondance[] = [];
    for (const p of info.personnes) {
      for (const e of rechercher(p.nom, p.type, registre.entrees)) {
        if (connues.has(cle(p.libelle, e.id))) continue;
        connues.add(cle(p.libelle, e.id));
        nouvelles.push(
          this.repo.create({
            ...(cible === 'client'
              ? { client: { id } as Client }
              : { prospect: { id } as Prospect }),
            personneControlee: p.libelle,
            idRegistre: e.id,
            nomRegistre: e.nom.slice(0, 300),
            natureRegistre: e.nature,
            motifs: e.motifs || null,
            registreDu: registre.publieLe,
          }),
        );
      }
    }
    if (nouvelles.length > 0) {
      await this.repo.save(nouvelles);
      await this.notificationsService.creerPourRoles(
        [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
        'Registre des gels : correspondance à vérifier',
        info.nomDossier,
        cible === 'client'
          ? `/dashboard/clients/${id}?tab=kyc`
          : `/dashboard/prospects/${id}`,
      );
    }
    await this.majStatut(cible, id, registre.publieLe, userId);
    return true;
  }

  private async majStatut(
    cible: CibleScreening,
    id: string,
    registreDu: Date | null,
    userId?: string,
  ): Promise<void> {
    const enAlerte = await this.repo.exist({
      where: [
        { ...this.filtre(cible, id), statut: StatutCorrespondance.A_VERIFIER },
        { ...this.filtre(cible, id), statut: StatutCorrespondance.CONFIRMEE },
      ],
    });
    const statut = enAlerte ? ScreeningStatut.ALERTE : ScreeningStatut.OK;
    const maj = {
      screeningStatut: statut,
      screeningDate: new Date(),
      ...(registreDu ? { screeningRegistreDu: registreDu } : {}),
    };
    const repo = cible === 'client' ? this.clientRepo : this.prospectRepo;
    const avant = await repo.findOne({
      where: { id },
      select: { id: true, screeningStatut: true },
    });
    await repo.update(id, maj);
    if (avant?.screeningStatut !== statut) {
      const auteur = userId ?? null;
      if (auteur) {
        await (cible === 'client'
          ? this.scoringService.recalculateForClient(id, auteur)
          : this.scoringService.recalculateForProspect(id, auteur));
      }
    }
  }

  findPour(cible: CibleScreening, id: string) {
    return this.repo.find({
      where: this.filtre(cible, id),
      relations: ['decidePar'],
      order: { createdAt: 'DESC' },
    });
  }

  // Décision humaine sur une correspondance : homonyme ou confirmée.
  async decider(
    id: string,
    statut: StatutCorrespondance,
    commentaire: string,
    userId: string,
  ): Promise<ScreeningCorrespondance> {
    if (statut === StatutCorrespondance.A_VERIFIER) {
      throw new BadRequestException('Choisissez « Homonyme » ou « Confirmée »');
    }
    if (!commentaire?.trim()) {
      throw new BadRequestException('Un commentaire est obligatoire');
    }
    const c = await this.repo.findOne({
      where: { id },
      relations: ['client', 'prospect'],
    });
    if (!c) throw new NotFoundException('Correspondance introuvable');
    c.statut = statut;
    c.commentaire = commentaire.trim();
    c.decidePar = { id: userId } as User;
    c.decideAt = new Date();
    const saved = await this.repo.save(c);
    const cible: CibleScreening = c.client ? 'client' : 'prospect';
    const dossierId = c.client?.id ?? c.prospect!.id;
    await this.auditService.log(
      userId,
      AuditAction.VALIDATE,
      'ScreeningCorrespondance',
      id,
      {
        statut,
        commentaire: c.commentaire,
        personne: c.personneControlee,
        idRegistre: c.idRegistre,
      },
    );
    await this.majStatut(cible, dossierId, null, userId);
    if (statut === StatutCorrespondance.CONFIRMEE) {
      await this.notificationsService.creerPourRoles(
        [Role.EXPERT_COMPTABLE],
        'Registre des gels : correspondance CONFIRMÉE',
        'Gel des avoirs : ne pas exécuter d’opération, contacter la DG Trésor.',
        cible === 'client'
          ? `/dashboard/clients/${dossierId}?tab=kyc`
          : `/dashboard/prospects/${dossierId}`,
      );
    }
    return saved;
  }

  // Chaque nuit : registre du jour, puis contrôle de tous les dossiers
  // actifs (prospects non convertis, clients non résiliés).
  @Cron('0 5 * * *')
  async controlerTous(): Promise<void> {
    const registre = await this.registre.actualiser();
    if (!registre) return;
    const [prospects, clients] = await Promise.all([
      this.prospectRepo.find({
        where: { client: IsNull() },
        select: { id: true },
      }),
      this.clientRepo.find({ select: { id: true, statut: true } }),
    ]);
    const cibles: [CibleScreening, string][] = [
      ...prospects.map((p): [CibleScreening, string] => ['prospect', p.id]),
      ...clients
        .filter((c) => c.statut !== StatutClient.RESILIE)
        .map((c): [CibleScreening, string] => ['client', c.id]),
    ];
    let erreurs = 0;
    // Un dossier en erreur ne bloque pas le contrôle des suivants.
    for (const [cible, id] of cibles) {
      await this.controler(cible, id).catch((e: Error) => {
        erreurs++;
        this.logger.error(`Screening ${cible} ${id} : ${e.message}`);
      });
    }
    this.logger.log(
      `Screening de nuit : ${cibles.length} dossiers contrôlés, ${erreurs} en erreur`,
    );
  }
}
