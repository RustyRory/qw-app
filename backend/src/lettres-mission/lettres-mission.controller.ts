import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { TAILLE_MAX_DOCUMENT } from '../common/storage';
import { LettresMissionService } from './lettres-mission.service';
import type { FichierRecu } from '../documents/documents.service';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
@Controller('api/lettres-mission')
export class LettresMissionController {
  constructor(private readonly svc: LettresMissionService) {}

  @Get('mission/:missionId')
  findByMission(@Param('missionId', ParseUUIDPipe) missionId: string) {
    return this.svc.findByMission(missionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/download')
  download(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.streamFile(id);
  }

  @Patch(':id/valider')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  valider(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.svc.valider(id, req.user.id);
  }

  @Patch(':id/signer')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  signer(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.svc.signer(id, req.user.id);
  }

  // Dépôt du PDF signé par le client (reçu par mail).
  @Post(':id/signature-client')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_DOCUMENT } }),
  )
  signatureClient(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: FichierRecu | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.enregistrerSignatureClient(id, file, req.user);
  }
}
