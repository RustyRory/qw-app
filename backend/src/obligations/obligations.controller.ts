import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ObligationsService } from './obligations.service';
import { CreateObligationDto } from './dto/create-obligation.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/obligations')
export class ObligationsController {
  constructor(private readonly svc: ObligationsService) {}

  @Post()
  @Roles(
    Role.COLLABORATEUR,
    Role.RESPONSABLE,
    Role.EXPERT_COMPTABLE,
    Role.ADMIN,
  )
  create(@Body() dto: CreateObligationDto) {
    return this.svc.create(dto);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.svc.findByClient(clientId);
  }

  @Get('en-retard')
  findEnRetard() {
    return this.svc.findEnRetard();
  }

  @Patch(':id/fait')
  @Roles(
    Role.COLLABORATEUR,
    Role.RESPONSABLE,
    Role.EXPERT_COMPTABLE,
    Role.ADMIN,
  )
  marquerFait(@Param('id') id: string) {
    return this.svc.marquerFait(id);
  }
}
