import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AUTORISE_MDP_A_CHANGER_KEY } from '../decorators/mot-de-passe-a-changer.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = (await super.canActivate(context)) as boolean;
    if (!ok) return false;

    const user = context
      .switchToHttp()
      .getRequest<{ user?: { mustChangePassword?: boolean } }>().user;
    if (user?.mustChangePassword) {
      const autorise = this.reflector.getAllAndOverride<boolean>(
        AUTORISE_MDP_A_CHANGER_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!autorise) {
        throw new ForbiddenException(
          'Vous devez changer votre mot de passe provisoire avant de continuer',
        );
      }
    }
    return true;
  }
}
