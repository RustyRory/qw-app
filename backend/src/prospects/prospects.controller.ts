import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, StatutKanban } from '../common/enums';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Post()
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
  create(@Body() dto: CreateProspectDto, @Req() req: RequestWithUser) {
    return this.prospectsService.create(dto, req.user);
  }

  @Get()
  findAll() {
    return this.prospectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prospectsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProspectDto,
    @Req() req: RequestWithUser,
  ) {
    return this.prospectsService.update(id, dto, req.user);
  }

  // Convertit le prospect en client et retourne le Client créé — réservé à
  // l'expert-comptable, seul habilité à valider un prospect en client.
  @Post(':id/convert')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  convertToClient(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.prospectsService.convertToClient(id, req.user);
  }

  // Refus direct, sans passer par le PATCH générique. Réservé à
  // responsable/expert-comptable/admin : refuser un prospect est une
  // décision métier, pas au collaborateur de la prendre (contrairement à la
  // suppression pour fausse manip, cf. remove() plus bas).
  @Patch(':id/refuser')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  refuser(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.prospectsService.update(
      id,
      { statutKanban: StatutKanban.REFUSE },
      req.user,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.prospectsService.remove(id, req.user);
  }
}
