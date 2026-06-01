import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ScoringService } from './scoring.service';

interface RequestWithUser {
  user: { id: string; role: UserRole };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post(':clientId')
  calculate(@Param('clientId') clientId: string, @Req() req: RequestWithUser) {
    return this.scoringService.calculate(clientId, req.user);
  }

  @Get(':clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.scoringService.findByClient(clientId);
  }
}
