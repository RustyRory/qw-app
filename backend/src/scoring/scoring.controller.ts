import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ScoringService } from './scoring.service';

// Le score de risque (client comme prospect) est désormais calculé
// automatiquement — voir ClientsService, BeneficiairesService,
// QuestionnairesService et ProspectsService.convertToClient, qui appellent
// ScoringService.recalculateForClient/recalculateForProspect. Il n'y a plus
// de saisie manuelle ni de route POST ici.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.scoringService.findByClient(clientId);
  }

  @Get('client/:clientId/courant')
  findCurrent(@Param('clientId') clientId: string) {
    return this.scoringService.findCurrent(clientId);
  }

  @Get('prospect/:prospectId')
  findByProspect(@Param('prospectId') prospectId: string) {
    return this.scoringService.findByProspect(prospectId);
  }

  @Get('prospect/:prospectId/courant')
  findCurrentByProspect(@Param('prospectId') prospectId: string) {
    return this.scoringService.findCurrentByProspect(prospectId);
  }
}
