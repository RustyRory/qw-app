import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { AcceptationsService } from './acceptations.service';
import { EnregistrerAcceptationDto } from './dto/enregistrer-acceptation.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

function cible(valeur: string): 'prospect' | 'client' {
  return valeur === 'client' ? 'client' : 'prospect';
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
@Controller('api/acceptations')
export class AcceptationsController {
  constructor(private readonly svc: AcceptationsService) {}

  @Get('catalogue')
  catalogue() {
    return this.svc.catalogue();
  }

  @Get(':cible/:id')
  findPour(@Param('cible') c: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findPour(cible(c), id);
  }

  @Put(':cible/:id')
  enregistrer(
    @Param('cible') c: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnregistrerAcceptationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.enregistrer(cible(c), id, dto.reponses, req.user.id);
  }

  // L'acceptation de la mission ne se délègue pas : expert-comptable.
  @Patch(':id/accepter')
  @Roles(Role.EXPERT_COMPTABLE, Role.ADMIN)
  accepter(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.accepter(id, req.user.id);
  }

  @Patch(':id/rouvrir')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  rouvrir(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.svc.rouvrir(id, req.user.id);
  }
}
