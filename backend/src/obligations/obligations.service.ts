import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Obligation } from './entities/obligation.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { Document } from '../documents/entities/document.entity';
import { StatutObligation, StatutKyc, TypeObligation } from '../common/enums';
import { documentsManquants } from '../common/document-checklist';
import { CreateObligationDto } from './dto/create-obligation.dto';

const DELAI_ECHEANCE_AUTO_JOURS = 30;

@Injectable()
export class ObligationsService {
  constructor(
    @InjectRepository(Obligation)
    private readonly repo: Repository<Obligation>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  create(dto: CreateObligationDto): Promise<Obligation> {
    if (!dto.clientId === !dto.prospectId) {
      throw new BadRequestException(
        'Renseignez soit clientId, soit prospectId (jamais les deux, ni aucun des deux)',
      );
    }
    const o = this.repo.create({
      client: dto.clientId ? { id: dto.clientId } : null,
      prospect: dto.prospectId ? { id: dto.prospectId } : null,
      type: dto.type,
      dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : null,
    });
    return this.repo.save(o);
  }

  findByClient(clientId: string): Promise<Obligation[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { dateEcheance: 'ASC' },
    });
  }

  findByProspect(prospectId: string): Promise<Obligation[]> {
    return this.repo.find({
      where: { prospect: { id: prospectId } },
      order: { dateEcheance: 'ASC' },
    });
  }

  async marquerFait(id: string): Promise<Obligation> {
    const o = await this.repo.findOneBy({ id });
    if (!o) throw new NotFoundException('Obligation introuvable');
    if (
      o.statut === StatutObligation.FAIT ||
      o.statut === StatutObligation.EXPIRE
    ) {
      throw new BadRequestException(
        'Cette obligation est déjà clôturée et ne peut plus être marquée comme faite',
      );
    }
    o.statut = StatutObligation.FAIT;
    o.completedAt = new Date();
    return this.repo.save(o);
  }

  findEnRetard(): Promise<Obligation[]> {
    return this.repo.find({
      where: { statut: StatutObligation.EN_RETARD },
      order: { dateEcheance: 'ASC' },
      relations: ['client', 'prospect'],
    });
  }

  // Ouvre une obligation d'un type donné pour un prospect si aucune n'est
  // déjà ouverte (idempotent) — utilisé par le pipeline LAB → lettre de
  // mission (voir QuestionnairesService/LettresMissionService).
  async ouvrirPourProspect(
    prospectId: string,
    type: TypeObligation,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        prospect: { id: prospectId },
        type,
        statut: In([StatutObligation.A_FAIRE, StatutObligation.EN_RETARD]),
      },
    });
    if (ouverte) return;

    await this.repo.save(
      this.repo.create({
        prospect: { id: prospectId } as Prospect,
        type,
      }),
    );
  }

  // Clôture (FAIT) l'obligation ouverte d'un type donné pour un prospect,
  // si elle existe (idempotent, ne fait rien sinon).
  async cloturerPourProspect(
    prospectId: string,
    type: TypeObligation,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        prospect: { id: prospectId },
        type,
        statut: In([StatutObligation.A_FAIRE, StatutObligation.EN_RETARD]),
      },
    });
    if (!ouverte) return;

    ouverte.statut = StatutObligation.FAIT;
    ouverte.completedAt = new Date();
    await this.repo.save(ouverte);
  }

  // Détecte automatiquement, à partir de l'état courant du client, les
  // obligations qui doivent être ouvertes ou clôturées (documents
  // obligatoires manquants, KYC non validé). Appelé après upload/suppression
  // de document, mise à jour du client, et par le job quotidien.
  async synchroniserPourClient(clientId: string): Promise<void> {
    const client = await this.clientRepo.findOneBy({ id: clientId });
    if (!client) return;

    const documents = await this.documentRepo.find({
      where: { client: { id: clientId } },
    });
    const manquants = documentsManquants(
      client.typeEntite,
      client.ppe,
      documents.map((d) => d.type),
    );

    await this.syncType(
      clientId,
      TypeObligation.MISE_A_JOUR_DOCS,
      manquants.length > 0,
    );
    await this.syncType(
      clientId,
      TypeObligation.KYC_VERIFICATION,
      client.kycStatut !== StatutKyc.VALIDE,
    );
  }

  private async syncType(
    clientId: string,
    type: TypeObligation,
    doitEtreOuverte: boolean,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        client: { id: clientId },
        type,
        statut: In([StatutObligation.A_FAIRE, StatutObligation.EN_RETARD]),
      },
    });

    if (doitEtreOuverte && !ouverte) {
      const dateEcheance = new Date();
      dateEcheance.setDate(dateEcheance.getDate() + DELAI_ECHEANCE_AUTO_JOURS);

      await this.repo.save(
        this.repo.create({
          client: { id: clientId } as Client,
          type,
          dateEcheance,
        }),
      );
    } else if (!doitEtreOuverte && ouverte) {
      ouverte.statut = StatutObligation.FAIT;
      ouverte.completedAt = new Date();
      await this.repo.save(ouverte);
    }
  }

  // Job quotidien : fait passer en retard les obligations dont l'échéance
  // est dépassée sans avoir été traitées.
  async marquerEnRetard(): Promise<void> {
    await this.repo.update(
      { statut: StatutObligation.A_FAIRE, dateEcheance: LessThan(new Date()) },
      { statut: StatutObligation.EN_RETARD },
    );
  }
}
