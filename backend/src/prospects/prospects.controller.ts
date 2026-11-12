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
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { RefuserProspectDto } from './dto/refuser-prospect.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

const ROLES_METIER = [
  Role.COLLABORATEUR,
  Role.RESPONSABLE,
  Role.EXPERT_COMPTABLE,
  Role.ADMIN,
];
// Décisions (refus, conversion, réactivation).
const ROLES_DECISION = [Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ROLES_METIER)
@Controller('api/prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Post()
  create(@Body() dto: CreateProspectDto, @Req() req: RequestWithUser) {
    return this.prospectsService.create(dto, req.user);
  }

  @Get()
  findAll() {
    return this.prospectsService.findAll();
  }

  @Get('archives')
  findArchives() {
    return this.prospectsService.findArchives();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prospectsService.findOne(id);
  }

  // Liste des conditions de conversion non remplies (vide = convertible) :
  // sert à griser le bouton « Convertir » en expliquant pourquoi.
  @Get(':id/conditions-conversion')
  conditionsConversion(@Param('id', ParseUUIDPipe) id: string) {
    return this.prospectsService.conditionsConversion(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProspectDto,
    @Req() req: RequestWithUser,
  ) {
    return this.prospectsService.update(id, dto, req.user);
  }

  // Convertit le prospect en client (création du client + transfert de tout
  // le dossier) et retourne le client créé.
  @Post(':id/convert')
  @Roles(...ROLES_DECISION)
  convertToClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.prospectsService.convertToClient(id, req.user);
  }

  // Refus : décision métier, motif obligatoire (conservé pour le contrôle
  // LCB-FT).
  @Patch(':id/refuser')
  @Roles(...ROLES_DECISION)
  refuser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefuserProspectDto,
    @Req() req: RequestWithUser,
  ) {
    return this.prospectsService.refuser(id, dto.motif, req.user);
  }

  @Post(':id/reactiver')
  @Roles(...ROLES_DECISION)
  reactiver(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.prospectsService.reactiver(id, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.prospectsService.remove(id, req.user);
  }
}
