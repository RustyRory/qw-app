import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { CartographieService } from './cartographie.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
@Controller('api/cartographie')
export class CartographieController {
  constructor(private readonly svc: CartographieService) {}

  @Get()
  calculer() {
    return this.svc.calculer();
  }
}
