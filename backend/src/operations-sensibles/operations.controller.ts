import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { OperationsService } from './operations.service';
import { CreateOperationDto } from './dto/create-operation.dto';
import { ClasserOperationDto } from './dto/classer-operation.dto';
import { DeclareTracfinDto } from './dto/declare-tracfin.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
@Controller('api/operations-sensibles')
export class OperationsController {
  constructor(private readonly svc: OperationsService) {}

  @Post()
  create(@Body() dto: CreateOperationDto, @Req() req: RequestWithUser) {
    return this.svc.create(dto, req.user);
  }

  // Un collaborateur ne voit que les opérations qu'il a signalées.
  @Get('client/:clientId')
  findByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.findByClient(clientId, req.user);
  }

  @Patch(':id/analyser')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  prendreEnAnalyse(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.prendreEnAnalyse(id, req.user);
  }

  // Décisions : expert-comptable (déclarant TRACFIN) ou admin.
  @Patch(':id/tracfin')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  declareTracfin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclareTracfinDto,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.declareTracfin(id, dto.date, req.user);
  }

  @Patch(':id/classer')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  classer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClasserOperationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.classer(id, dto.motif, req.user);
  }
}
