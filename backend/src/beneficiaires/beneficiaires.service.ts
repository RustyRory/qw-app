import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BeneficiaireEffectif } from './entities/beneficiaire-effectif.entity';
import { Client } from '../clients/entities/client.entity';
import { ScoringService } from '../scoring/scoring.service';
import { CreateBeneficiaireDto } from './dto/create-beneficiaire.dto';
import { UpdateBeneficiaireDto } from './dto/update-beneficiaire.dto';

type Proprietaire = { clientId: string | null; prospectId: string | null };

function proprietaireDe(b: BeneficiaireEffectif): Proprietaire {
  return { clientId: b.client?.id ?? null, prospectId: b.prospect?.id ?? null };
}

@Injectable()
export class BeneficiairesService {
  constructor(
    @InjectRepository(BeneficiaireEffectif)
    private readonly repo: Repository<BeneficiaireEffectif>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    private readonly scoringService: ScoringService,
  ) {}

  private filtre(p: Proprietaire) {
    return p.clientId
      ? { client: { id: p.clientId } }
      : { prospect: { id: p.prospectId! } };
  }

  // La somme des pourcentages de détention d'un même dossier ne peut pas
  // dépasser 100 %.
  private async assertTotalDetention(
    p: Proprietaire,
    pourcentage: number,
    exceptId?: string,
  ): Promise<void> {
    const autres = await this.repo.find({
      where: {
        ...this.filtre(p),
        ...(exceptId ? { id: Not(exceptId) } : {}),
      },
      select: { id: true, pourcentageDetention: true },
    });
    const total =
      autres.reduce((s, b) => s + Number(b.pourcentageDetention), 0) +
      pourcentage;
    if (total > 100.0001) {
      throw new BadRequestException(
        `Le total des pourcentages de détention dépasserait 100 % (${Math.round(total * 100) / 100} %)`,
      );
    }
  }

  // Effets de bord d'une modification : indicateur « UBO saisi » et score
  // du client (un prospect n'a pas de score dépendant de ses UBO).
  private async apresModification(p: Proprietaire, userId: string) {
    if (!p.clientId) return;
    const count = await this.repo.count({
      where: { client: { id: p.clientId } },
    });
    await this.clientRepo.update({ id: p.clientId }, { uboSaisi: count > 0 });
    await this.scoringService.recalculateForClient(p.clientId, userId);
  }

  async create(
    dto: CreateBeneficiaireDto,
    userId: string,
  ): Promise<BeneficiaireEffectif> {
    if (!dto.clientId === !dto.prospectId) {
      throw new BadRequestException(
        'Renseignez soit clientId, soit prospectId',
      );
    }
    const p: Proprietaire = {
      clientId: dto.clientId ?? null,
      prospectId: dto.prospectId ?? null,
    };
    await this.assertTotalDetention(p, dto.pourcentageDetention);

    const saved = await this.repo.save(
      this.repo.create({
        nom: dto.nom,
        prenom: dto.prenom ?? null,
        dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : null,
        nationalite: dto.nationalite ?? null,
        adresse: dto.adresse ?? null,
        pourcentageDetention: dto.pourcentageDetention,
        ppe: dto.ppe ?? false,
        client: p.clientId ? { id: p.clientId } : null,
        prospect: p.prospectId ? { id: p.prospectId } : null,
      }),
    );

    await this.apresModification(p, userId);
    return saved;
  }

  findByClient(clientId: string): Promise<BeneficiaireEffectif[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  findByProspect(prospectId: string): Promise<BeneficiaireEffectif[]> {
    return this.repo.find({
      where: { prospect: { id: prospectId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BeneficiaireEffectif> {
    const b = await this.repo.findOne({
      where: { id },
      relations: ['client', 'prospect'],
    });
    if (!b) throw new NotFoundException('Bénéficiaire effectif introuvable');
    return b;
  }

  async update(
    id: string,
    dto: UpdateBeneficiaireDto,
    userId: string,
  ): Promise<BeneficiaireEffectif> {
    const b = await this.findOne(id);
    const p = proprietaireDe(b);
    if (dto.pourcentageDetention !== undefined) {
      await this.assertTotalDetention(p, dto.pourcentageDetention, id);
      b.pourcentageDetention = dto.pourcentageDetention;
    }
    if (dto.nom !== undefined) b.nom = dto.nom;
    if (dto.prenom !== undefined) b.prenom = dto.prenom ?? null;
    if (dto.dateNaissance !== undefined)
      b.dateNaissance = dto.dateNaissance ? new Date(dto.dateNaissance) : null;
    if (dto.nationalite !== undefined) b.nationalite = dto.nationalite ?? null;
    if (dto.adresse !== undefined) b.adresse = dto.adresse ?? null;
    if (dto.ppe !== undefined) b.ppe = dto.ppe;
    const saved = await this.repo.save(b);

    await this.apresModification(p, userId);
    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const b = await this.findOne(id);
    const p = proprietaireDe(b);
    await this.repo.remove(b);
    await this.apresModification(p, userId);
  }
}
