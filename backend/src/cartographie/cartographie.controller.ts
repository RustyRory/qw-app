import {
  Controller,
  Get,
  Header,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { CartographieService } from './cartographie.service';
import { RapportCartographieService } from './rapport.service';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
@Controller('api/cartographie')
export class CartographieController {
  constructor(
    private readonly svc: CartographieService,
    private readonly rapport: RapportCartographieService,
  ) {}

  @Get()
  calculer() {
    return this.svc.calculer();
  }

  // Rapport PDF détaillé : synthèse, matrice des 13 risques, liste des
  // dossiers et une fiche par client actif / prospect en cours.
  @Get('rapport')
  @Header('Content-Type', 'application/pdf')
  async rapportPdf(@Req() req: RequestWithUser): Promise<StreamableFile> {
    const pdf = await this.rapport.genererPdf(req.user.id);
    const jour = new Date().toISOString().slice(0, 10);
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="Cartographie-risques-${jour}.pdf"`,
    });
  }
}
