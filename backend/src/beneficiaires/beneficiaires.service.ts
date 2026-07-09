import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaireEffectif } from './entities/beneficiaire-effectif.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateBeneficiaireDto } from './dto/create-beneficiaire.dto';
import { UpdateBeneficiaireDto } from './dto/update-beneficiaire.dto';

@Injectable()
export class BeneficiairesService {
  constructor(
    @InjectRepository(BeneficiaireEffectif)
    private readonly repo: Repository<BeneficiaireEffectif>,
  ) {}

  create(dto: CreateBeneficiaireDto): Promise<BeneficiaireEffectif> {
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
    return this.repo.save(b);
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
  ): Promise<BeneficiaireEffectif> {
    const b = await this.repo.findOneBy({ id });
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
    return this.repo.save(b);
  }

  async remove(id: string): Promise<void> {
    const b = await this.repo.findOneBy({ id });
    if (!b) throw new NotFoundException('Bénéficiaire effectif introuvable');
    await this.repo.remove(b);
  }
}
