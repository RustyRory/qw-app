import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaireEffectif } from './entities/beneficiaire-effectif.entity';
import { Client } from '../clients/entities/client.entity';
import { ScoringService } from '../scoring/scoring.service';
import { CreateBeneficiaireDto } from './dto/create-beneficiaire.dto';
import { UpdateBeneficiaireDto } from './dto/update-beneficiaire.dto';

@Injectable()
export class BeneficiairesService {
  constructor(
    @InjectRepository(BeneficiaireEffectif)
    private readonly repo: Repository<BeneficiaireEffectif>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    private readonly scoringService: ScoringService,
  ) {}

  // Maintient `client.uboSaisi` synchronisé avec la présence réelle d'au moins
  // un bénéficiaire effectif (rien ne le mettait à jour auparavant : la
  // checklist KYC restait bloquée sur ❌ même après saisie).
  private async syncUboSaisi(clientId: string): Promise<void> {
    const count = await this.repo.count({
      where: { client: { id: clientId } },
    });
    await this.clientRepo.update({ id: clientId }, { uboSaisi: count > 0 });
  }

  async create(
    dto: CreateBeneficiaireDto,
    userId: string,
  ): Promise<BeneficiaireEffectif> {
    const b = this.repo.create({
      nom: dto.nom,
      prenom: dto.prenom ?? null,
      dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : null,
      nationalite: dto.nationalite ?? null,
      adresse: dto.adresse ?? null,
      pourcentageDetention: dto.pourcentageDetention,
      ppe: dto.ppe ?? false,
      client: { id: dto.clientId } as Client,
    });
    const saved = await this.repo.save(b);

    await this.syncUboSaisi(dto.clientId);
    await this.scoringService.recalculateForClient(dto.clientId, userId);

    return saved;
  }

  findByClient(clientId: string): Promise<BeneficiaireEffectif[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BeneficiaireEffectif> {
    const b = await this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!b) throw new NotFoundException('Bénéficiaire effectif introuvable');
    return b;
  }

  async update(
    id: string,
    dto: UpdateBeneficiaireDto,
    userId: string,
  ): Promise<BeneficiaireEffectif> {
    const b = await this.repo.findOne({ where: { id }, relations: ['client'] });
    if (!b) throw new NotFoundException('Bénéficiaire effectif introuvable');
    if (dto.nom !== undefined) b.nom = dto.nom;
    if (dto.prenom !== undefined) b.prenom = dto.prenom ?? null;
    if (dto.dateNaissance !== undefined)
      b.dateNaissance = dto.dateNaissance ? new Date(dto.dateNaissance) : null;
    if (dto.nationalite !== undefined) b.nationalite = dto.nationalite ?? null;
    if (dto.adresse !== undefined) b.adresse = dto.adresse ?? null;
    if (dto.pourcentageDetention !== undefined)
      b.pourcentageDetention = dto.pourcentageDetention;
    if (dto.ppe !== undefined) b.ppe = dto.ppe;
    const saved = await this.repo.save(b);

    await this.scoringService.recalculateForClient(b.client.id, userId);

    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const b = await this.repo.findOne({ where: { id }, relations: ['client'] });
    if (!b) throw new NotFoundException('Bénéficiaire effectif introuvable');
    const clientId = b.client.id;
    await this.repo.remove(b);

    await this.syncUboSaisi(clientId);
    await this.scoringService.recalculateForClient(clientId, userId);
  }
}
