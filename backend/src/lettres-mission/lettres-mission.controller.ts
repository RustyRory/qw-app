import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { LettresMissionService } from './lettres-mission.service';
import { CreateLettreMissionDto } from './dto/create-lettre.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/lettres-mission')
export class LettresMissionController {
  constructor(private readonly svc: LettresMissionService) {}

  @Post()
  @Roles(
    Role.COLLABORATEUR,
    Role.RESPONSABLE,
    Role.EXPERT_COMPTABLE,
    Role.ADMIN,
  )
  create(@Body() dto: CreateLettreMissionDto) {
    return this.svc.create(dto);
  }

  @Get('mission/:missionId')
  findByMission(@Param('missionId') missionId: string) {
    return this.svc.findByMission(missionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id/signer')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  signer(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.svc.signer(id, req.user.id);
  }
}
