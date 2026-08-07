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

interface RequestWithUser {
  user: { id: string; role: Role };
}

// Auto-gestion (fiche « Paramètres ») : tous les rôles, y compris MODERATEUR
// qui n'a par ailleurs accès à aucun dossier métier.
const TOUS_LES_ROLES = [
  Role.COLLABORATEUR,
  Role.RESPONSABLE,
  Role.EXPERT_COMPTABLE,
  Role.ADMIN,
  Role.MODERATEUR,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATEUR)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Liste accessible aux rôles pouvant assigner un prospect/dossier, et au modérateur pour la gestion des comptes.
  @Get()
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN, Role.MODERATEUR)
  findAll() {
    return this.usersService.findAll();
  }

  // Auto-gestion : tout utilisateur authentifié gère son propre profil/signature.
  @Get('me')
  @Roles(...TOUS_LES_ROLES)
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

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.usersService.remove(id, req.user.id);
  }
}
