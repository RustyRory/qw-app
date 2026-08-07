import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { Role } from '../common/enums';

interface RequestWithUser {
  user: { id: string; role: Role };
}

// Chaque utilisateur ne voit et ne peut marquer comme lues que ses propres
// notifications (scoping par req.user.id dans le service) — pas de
// restriction par rôle nécessaire ici.
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findMine(@Req() req: RequestWithUser) {
    return this.svc.findForUser(req.user.id);
  }

  @Get('non-lues/count')
  countUnread(@Req() req: RequestWithUser) {
    return this.svc.countUnread(req.user.id);
  }

  @Patch(':id/lue')
  marquerLue(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.svc.marquerLue(id, req.user.id);
  }

  @Patch('lues')
  marquerToutesLues(@Req() req: RequestWithUser) {
    return this.svc.marquerToutesLues(req.user.id);
  }
}
