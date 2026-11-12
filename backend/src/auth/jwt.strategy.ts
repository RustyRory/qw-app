import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  role: Role;
}

export interface AuthenticatedUser {
  id: string;
  role: Role;
  mustChangePassword: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  // Relit le compte à chaque requête : un compte désactivé (ou supprimé)
  // perd immédiatement l'accès, et un changement de rôle s'applique sans
  // attendre l'expiration du jeton.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepo.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }
    return {
      id: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }
}

// Sans secret, les jetons seraient signés avec une chaîne vide (donc
// falsifiables) : on refuse de démarrer.
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET doit être défini dans l’environnement');
  }
  return secret;
}
