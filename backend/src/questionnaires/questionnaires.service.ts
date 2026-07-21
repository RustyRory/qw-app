import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from './entities/questionnaire-acceptation.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { User } from '../users/entities/user.entity';
import { ScoringService } from '../scoring/scoring.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(QuestionnaireAcceptation)
    private readonly repo: Repository<QuestionnaireAcceptation>,
    private readonly scoringService: ScoringService,
  ) {}

  async create(
    dto: CreateQuestionnaireDto,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    const existing = await this.repo.findOne({
      where: { prospect: { id: dto.prospectId } },
    });
    if (existing) {
      throw new BadRequestException(
        'Un questionnaire existe déjà pour ce prospect',
      );
    }
    const q = this.repo.create({
      prospect: { id: dto.prospectId } as Prospect,
      reponses: dto.reponses ?? null,
      createdBy: { id: userId } as User,
    });
    const saved = await this.repo.save(q);

    await this.scoringService.recalculateForProspect(dto.prospectId, userId);

    return saved;
  }

  findByProspect(prospectId: string): Promise<QuestionnaireAcceptation | null> {
    return this.repo.findOne({
      where: { prospect: { id: prospectId } },
      relations: ['prospect', 'createdBy', 'validatedBy'],
    });
  }

  async findOne(id: string): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect', 'createdBy', 'validatedBy'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    return q;
  }

  async updateReponses(
    id: string,
    dto: UpdateQuestionnaireDto,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut !== StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Seul un questionnaire en cours peut être modifié',
      );
    }
    if (dto.reponses !== undefined) q.reponses = dto.reponses;
    const saved = await this.repo.save(q);

    await this.scoringService.recalculateForProspect(q.prospect.id, userId);

    return saved;
  }

  async validate(
    id: string,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOneBy({ id });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut !== StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Seul un questionnaire en cours peut être validé',
      );
    }
    q.statut = StatutQuestionnaire.VALIDE;
    q.validatedAt = new Date();
    q.validatedBy = { id: userId } as User;
    return this.repo.save(q);
  }

  async refuse(
    id: string,
    motif: string,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    if (!motif?.trim()) {
      throw new BadRequestException('Le motif de refus est obligatoire');
    }
    const q = await this.repo.findOneBy({ id });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut !== StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Seul un questionnaire en cours peut être refusé',
      );
    }
    q.statut = StatutQuestionnaire.REFUSE;
    q.motifRefus = motif.trim();
    q.validatedAt = new Date();
    q.validatedBy = { id: userId } as User;
    return this.repo.save(q);
  }
}
