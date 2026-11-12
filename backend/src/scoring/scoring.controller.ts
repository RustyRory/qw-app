import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { AjusterNiveauDto } from './dto/ajuster-niveau.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ScoringService } from './scoring.service';

// Le score de risque est calculé automatiquement (voir ScoringService) ;
// seul l'ajustement manuel du niveau, justifié, est exposé ici (EC / admin).
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

  @Patch(':cible/:id/ajustement')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  ajuster(
    @Param('cible') cible: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AjusterNiveauDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.scoringService.ajuster(
      cible === 'client' ? 'client' : 'prospect',
      id,
      dto.niveau,
      dto.justification,
      req.user.id,
    );
  }
}
