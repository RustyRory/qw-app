import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ClientsService } from './clients.service';
import { ChangerStatutClientDto } from './dto/changer-statut-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ScreeningDto } from './dto/screening.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
@Controller('api/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // Pas de création directe : un client naît de la conversion d'un prospect.
  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id/conditions-kyc')
  conditionsKyc(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.conditionsKyc(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: RequestWithUser,
  ) {
    return this.clientsService.update(id, dto, req.user);
  }

  @Patch(':id/validate')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  validate(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.clientsService.validate(id, req.user);
  }

  @Patch(':id/statut')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  changerStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangerStatutClientDto,
    @Req() req: RequestWithUser,
  ) {
    return this.clientsService.changerStatut(id, dto.statut, req.user);
  }

  @Patch(':id/screening')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  updateScreening(
    @Param('id') id: string,
    @Body() dto: ScreeningDto,
    @Req() req: RequestWithUser,
  ) {
    return this.clientsService.updateScreening(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.clientsService.remove(id, req.user);
  }
}
