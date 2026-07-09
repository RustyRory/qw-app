import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoreRisque, ArpecReponses } from './entities/score-risque.entity';
import { NiveauRisque } from '../common/enums';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateScoreDto } from './dto/create-score.dto';

export function computeNiveau(score: number): NiveauRisque {
  if (score <= 40) return NiveauRisque.FAIBLE;
  if (score <= 80) return NiveauRisque.MOYEN;
  return NiveauRisque.ELEVE;
}

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(ScoreRisque)
    private readonly repo: Repository<ScoreRisque>,
  ) {}

  async calculate(dto: CreateScoreDto, userId: string): Promise<ScoreRisque> {
    const reponses: ArpecReponses = {
      clientCaracteristiques: dto.clientCaracteristiques,
      activiteSecteur: dto.activiteSecteur,
      zoneGeographique: dto.zoneGeographique,
      typeMission: dto.typeMission,
    };
    const score =
      dto.clientCaracteristiques +
      dto.activiteSecteur +
      dto.zoneGeographique +
      dto.typeMission;
    const niveau = computeNiveau(score);

    return this.repo.save(
      this.repo.create({
        score,
        niveau,
        reponses,
        client: { id: dto.clientId } as Client,
        calculatedBy: { id: userId } as User,
      }),
    );
  }

  findByClient(clientId: string): Promise<ScoreRisque[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findCurrent(clientId: string): Promise<ScoreRisque | null> {
    return this.repo.findOne({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }
}
