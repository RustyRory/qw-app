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
import { OperationsService } from './operations.service';
import { CreateOperationDto } from './dto/create-operation.dto';
import { DeclareTracfinDto } from './dto/declare-tracfin.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/operations-sensibles')
export class OperationsController {
  constructor(private readonly svc: OperationsService) {}

  @Post()
  @Roles(
    Role.COLLABORATEUR,
    Role.RESPONSABLE,
    Role.EXPERT_COMPTABLE,
    Role.ADMIN,
  )
  create(@Body() dto: CreateOperationDto, @Req() req: RequestWithUser) {
    return this.svc.create(dto, req.user.id);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.svc.findByClient(clientId);
  }

  @Patch(':id/tracfin')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  declareTracfin(
    @Param('id') id: string,
    @Body() dto: DeclareTracfinDto,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.declareTracfin(id, dto.date, req.user.id);
  }

  @Patch(':id/classer')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  classer(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.svc.classer(id, req.user.id);
  }
}
