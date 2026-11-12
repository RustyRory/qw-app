import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParametresCabinet } from './cabinet.entity';
import { UpdateCabinetDto } from './dto/update-cabinet.dto';

// Valeurs initiales (reprises de l'ancien en-tête codé en dur).
export const CABINET_PAR_DEFAUT: Omit<ParametresCabinet, 'updatedAt'> = {
  id: 1,
  nom: 'QW CONSEILS',
  raisonSociale: 'SAS QW CONSEILS',
  formeJuridique: "SAS d'expertise-comptable",
  adresse: '29 Rue du Colisée',
  codePostal: '75008',
  ville: 'Paris',
  capitalSocial: '10 000 €',
  siret: '952 244 887 00016',
  codeApe: '6920 Z',
  tvaIntracommunautaire: 'FR89 952 244 887',
  email: null,
  telephone: null,
  logoDataUri: null,
};

@Injectable()
export class CabinetService {
  constructor(
    @InjectRepository(ParametresCabinet)
    private readonly repo: Repository<ParametresCabinet>,
  ) {}

  async get(): Promise<ParametresCabinet> {
    const existant = await this.repo.findOneBy({ id: 1 });
    if (existant) return existant;
    return this.repo.save(this.repo.create(CABINET_PAR_DEFAUT));
  }

  async update(dto: UpdateCabinetDto): Promise<ParametresCabinet> {
    const actuel = await this.get();
    Object.assign(actuel, dto, { id: 1 });
    return this.repo.save(actuel);
  }
}
