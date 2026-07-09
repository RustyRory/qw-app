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

  @Post()
  calculate(@Body() dto: CreateScoreDto, @Req() req: RequestWithUser) {
    return this.scoringService.calculate(dto, req.user.id);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.scoringService.findByClient(clientId);
  }

  @Get('client/:clientId/courant')
  findCurrent(@Param('clientId') clientId: string) {
    return this.scoringService.findCurrent(clientId);
  }
}
