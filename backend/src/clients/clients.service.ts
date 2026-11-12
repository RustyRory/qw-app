import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import {
  Role,
  ScreeningStatut,
  StatutClient,
  StatutKyc,
  TypeEntite,
} from '../common/enums';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { UpdateClientDto } from './dto/update-client.dto';
import { ScreeningDto } from './dto/screening.dto';
import { ScoringService } from '../scoring/scoring.service';
import { ObligationsService } from '../obligations/obligations.service';
import { LettresMissionService } from '../lettres-mission/lettres-mission.service';

type AuthUser = { id: string; role: Role };

// Conservation obligatoire des dossiers après la fin de la relation
// d'affaires (LCB-FT).
const DUREE_CONSERVATION_ANS = 5;

const LIBELLES_PIECES: Record<string, string> = {
  PIECE_IDENTITE: 'pièce d’identité',
  PIECE_IDENTITE_DIRIGEANT: 'pièce d’identité du dirigeant',
  PIECE_IDENTITE_BENEFICIAIRE: 'pièce d’identité des bénéficiaires',
  JUSTIFICATIF_DOMICILE: 'justificatif de domicile',
  KBIS: 'Kbis',
  STATUTS: 'statuts',
  LISTE_UBO: 'liste des bénéficiaires effectifs',
  ATTESTATION_PPE: 'attestation PPE',
  JUSTIFICATIF_FONDS: 'justificatif d’origine des fonds',
};

// Les clients sont créés exclusivement par conversion d'un prospect (cf.
// ProspectsService.convertToClient) : aucune création directe ici.
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(BeneficiaireEffectif)
    private readonly beneficiaireRepo: Repository<BeneficiaireEffectif>,
    private readonly scoringService: ScoringService,
    private readonly obligationsService: ObligationsService,
    private readonly lettresMissionService: LettresMissionService,
  ) {}

  private audit(
    action: AuditAction,
    id: string,
    details: Record<string, unknown> | null,
    userId: string,
  ) {
    return this.auditRepo.save(
      this.auditRepo.create({
        action,
        ressource: 'Client',
        ressourceId: id,
        details,
        utilisateur: { id: userId } as User,
      }),
    );
  }

  // Tous les rôles voient tous les clients.
  findAll(): Promise<Client[]> {
    return this.clientsRepo.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepo.findOne({
      where: { id },
      relations: [
        'documents',
        'scores',
        'createdBy',
        'kycValidatedBy',
        'prospect',
      ],
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  private async getOrFail(id: string): Promise<Client> {
    const client = await this.clientsRepo.findOneBy({ id });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  private assertModifiable(client: Client): void {
    if (client.statut === StatutClient.RESILIE) {
      throw new BadRequestException(
        'Client résilié : le dossier est en lecture seule',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    authUser: AuthUser,
  ): Promise<Client> {
    const client = await this.getOrFail(id);
    this.assertModifiable(client);
    Object.assign(client, dto);
    const saved = await this.clientsRepo.save(client);

    await this.audit(
      AuditAction.UPDATE,
      id,
      dto as Record<string, unknown>,
      authUser.id,
    );
    await this.scoringService.recalculateForClient(id, authUser.id);
    await this.obligationsService.synchroniserPourClient(id);
    // Les lettres de mission non signées reprennent les nouvelles données.
    await this.lettresMissionService.apresModificationDossier({ clientId: id });
    return saved;
  }

  // Conditions de validation du KYC (vide = validable) : pièces
  // obligatoires présentes et non expirées, screening effectué,
  // bénéficiaires effectifs saisis pour une personne morale.
  async conditionsKyc(id: string): Promise<string[]> {
    const client = await this.getOrFail(id);
    const manquants: string[] = [];

    const pieces = await this.obligationsService.piecesManquantes(client);
    if (pieces.length > 0) {
      manquants.push(
        `Pièces manquantes ou expirées : ${pieces
          .map((p) => LIBELLES_PIECES[p] ?? p)
          .join(', ')}`,
      );
    }
    if (client.screeningStatut === ScreeningStatut.NON_EFFECTUE) {
      manquants.push('Le screening (listes de sanctions) n’a pas été effectué');
    }
    if (client.typeEntite === TypeEntite.PERSONNE_MORALE) {
      const ubos = await this.beneficiaireRepo.count({
        where: { client: { id } },
      });
      if (ubos === 0) {
        manquants.push('Aucun bénéficiaire effectif saisi');
      }
    }
    return manquants;
  }

  async validate(id: string, authUser: AuthUser): Promise<Client> {
    const client = await this.getOrFail(id);
    this.assertModifiable(client);
    const manquants = await this.conditionsKyc(id);
    if (manquants.length > 0) {
      throw new BadRequestException(
        `Validation KYC impossible : ${manquants.join(' · ')}`,
      );
    }
    client.kycStatut = StatutKyc.VALIDE;
    client.kycCompletedAt = new Date();
    client.kycValidatedBy = { id: authUser.id } as User;
    const saved = await this.clientsRepo.save(client);

    await this.audit(AuditAction.VALIDATE, id, null, authUser.id);
    await this.obligationsService.synchroniserPourClient(id);
    return saved;
  }

  // Résultat d'un screening (listes de sanctions / PPE) : saisie manuelle,
  // faute d'API de listes de sanctions intégrée.
  async updateScreening(
    id: string,
    dto: ScreeningDto,
    authUser: AuthUser,
  ): Promise<Client> {
    const client = await this.getOrFail(id);
    this.assertModifiable(client);
    client.screeningStatut = dto.statut;
    client.screeningDate = new Date();
    const saved = await this.clientsRepo.save(client);

    await this.audit(
      AuditAction.VALIDATE,
      id,
      { screeningStatut: dto.statut },
      authUser.id,
    );
    await this.scoringService.recalculateForClient(id, authUser.id);
    await this.obligationsService.synchroniserPourClient(id);
    return saved;
  }

  // ACTIF / INACTIF / RÉSILIÉ. La résiliation fige le dossier (lecture
  // seule) et date la fin de la relation (conservation 5 ans).
  async changerStatut(
    id: string,
    statut: StatutClient,
    authUser: AuthUser,
  ): Promise<Client> {
    const client = await this.getOrFail(id);
    if (client.statut === statut) return client;
    if (client.statut === StatutClient.RESILIE) {
      throw new BadRequestException(
        'Un client résilié ne peut pas être réactivé',
      );
    }
    client.statut = statut;
    if (statut === StatutClient.RESILIE) client.dateFinRelation = new Date();
    const saved = await this.clientsRepo.save(client);
    await this.audit(AuditAction.UPDATE, id, { statut }, authUser.id);
    return saved;
  }

  // Archivage (suppression douce), EC / admin. Un client résilié reste
  // conservé 5 ans après la fin de la relation.
  async remove(id: string, authUser: AuthUser): Promise<void> {
    const client = await this.getOrFail(id);
    if (client.statut === StatutClient.RESILIE && client.dateFinRelation) {
      const limite = new Date(client.dateFinRelation);
      limite.setFullYear(limite.getFullYear() + DUREE_CONSERVATION_ANS);
      if (limite > new Date()) {
        throw new ConflictException(
          `Conservation obligatoire jusqu’au ${limite.toLocaleDateString('fr-FR')} (5 ans après la fin de la relation)`,
        );
      }
    }
    await this.clientsRepo.softDelete(id);
    await this.audit(AuditAction.DELETE, id, null, authUser.id);
  }
}
