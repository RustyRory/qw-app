import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { ScoringService } from './scoring.service';
import { CreateScoreDto } from './dto/create-score.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post(':clientId')
  calculate(
    @Param('clientId') clientId: string,
    @Body() dto: CreateScoreDto,
    @Req() req: RequestWithUser,
  ) {
    return this.scoringService.calculate(clientId, dto, req.user);
  }

  @Get(':clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.scoringService.findByClient(clientId);
  }
}
