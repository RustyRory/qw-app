import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { DocumentsService, FichierRecu } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

const ROLES_METIER = [
  Role.COLLABORATEUR,
  Role.RESPONSABLE,
  Role.EXPERT_COMPTABLE,
  Role.ADMIN,
];

// Fichier gardé en mémoire (20 Mo max) : le service choisit lui-même son
// nom et son emplacement définitifs une fois les contrôles passés.
const fichierInterceptor = FileInterceptor('file', {
  limits: { fileSize: TAILLE_MAX_DOCUMENT },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('client/:clientId')
  @Roles(...ROLES_METIER)
  @UseInterceptors(fichierInterceptor)
  uploadClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @UploadedFile() file: FichierRecu | undefined,
    @Body() dto: UploadDocumentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.documentsService.upload(
      'client',
      clientId,
      file,
      req.user,
      dto,
    );
  }

  @Post('prospect/:prospectId')
  @Roles(...ROLES_METIER)
  @UseInterceptors(fichierInterceptor)
  uploadProspect(
    @Param('prospectId', ParseUUIDPipe) prospectId: string,
    @UploadedFile() file: FichierRecu | undefined,
    @Body() dto: UploadDocumentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.documentsService.upload(
      'prospect',
      prospectId,
      file,
      req.user,
      dto,
    );
  }

  // Liste légère de tous les documents actifs, pour la synchronisation du
  // dossier local (Mon profil › Synchroniser).
  @Get()
  findAllForSync() {
    return this.documentsService.findAllForSync();
  }

  @Get(':id/download')
  streamFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.documentsService.streamFile(id, req.user);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.documentsService.findByClient(clientId);
  }

  @Get('prospect/:prospectId')
  findByProspect(@Param('prospectId', ParseUUIDPipe) prospectId: string) {
    return this.documentsService.findByProspect(prospectId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...ROLES_METIER)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.documentsService.remove(id, req.user);
  }
}
