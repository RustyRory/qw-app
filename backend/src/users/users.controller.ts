import {
  Body,
  Controller,
  Delete,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSignatureDto } from './dto/update-signature.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AutoriseMotDePasseAChanger } from '../common/decorators/mot-de-passe-a-changer.decorator';

interface RequestWithUser {
  user: { id: string; role: Role };
}

// Auto-gestion (fiche « Paramètres ») : tous les rôles.
const TOUS_LES_ROLES = [
  Role.COLLABORATEUR,
  Role.RESPONSABLE,
  Role.EXPERT_COMPTABLE,
  Role.ADMIN,
];

// Gestion des comptes : administrateur uniquement.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Liste accessible à tous les rôles : sert à choisir l'assigné d'un
  // prospect (tout le monde peut assigner).
  @Get()
  @Roles(...TOUS_LES_ROLES)
  findAll() {
    return this.usersService.findAll();
  }

  // Auto-gestion : tout utilisateur authentifié gère son propre profil/signature.
  @Get('me')
  @Roles(...TOUS_LES_ROLES)
  @AutoriseMotDePasseAChanger()
  getMe(@Req() req: RequestWithUser) {
    return this.usersService.findMe(req.user.id);
  }

  @Patch('me')
  @Roles(...TOUS_LES_ROLES)
  updateMe(@Req() req: RequestWithUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Patch('me/password')
  @Roles(...TOUS_LES_ROLES)
  @AutoriseMotDePasseAChanger()
  changeMyPassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changeMyPassword(req.user.id, dto);
  }

  // Seul l'expert-comptable signe réellement une lettre de mission (cf.
  // lettres-mission.service.ts::signer) — la validation du responsable
  // reste une case interne, jamais une signature apposée sur le document.
  // Inutile donc de laisser collab/responsable enregistrer une signature.
  @Patch('me/signature')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  updateMySignature(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateSignatureDto,
  ) {
    return this.usersService.updateMySignature(req.user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // Désactive le compte (aucune suppression : historique conservé).
  @Delete(':id')
  desactiver(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.usersService.desactiver(id, req.user.id);
  }
}
