import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ScreeningService } from './screening.service';
import { RegistreGelsService } from './registre-gels.service';
import { DeciderCorrespondanceDto } from './dto/decider-correspondance.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

const cible = (c: string) => (c === 'client' ? 'client' : 'prospect');

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
@Controller('api/screening')
export class ScreeningController {
  constructor(
    private readonly svc: ScreeningService,
    private readonly registre: RegistreGelsService,
  ) {}

  @Get('registre')
  registreInfo() {
    const r = this.registre.obtenir();
    return r ? { publieLe: r.publieLe, entrees: r.entrees.length } : null;
  }

  @Get(':cible/:id')
  findPour(@Param('cible') c: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findPour(cible(c), id);
  }

  @Post(':cible/:id/controler')
  async controler(
    @Param('cible') c: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const effectue = await this.svc.controler(cible(c), id, req.user.id);
    if (!effectue) {
      throw new ServiceUnavailableException(
        'Registre des gels indisponible pour le moment : réessayez plus tard.',
      );
    }
    return this.svc.findPour(cible(c), id);
  }

  @Patch('correspondances/:id')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  decider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeciderCorrespondanceDto,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.decider(id, dto.statut, dto.commentaire, req.user.id);
  }
}
