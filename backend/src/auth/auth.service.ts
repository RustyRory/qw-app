import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; mustChangePassword: boolean }> {
    const invalid = new UnauthorizedException('Identifiants incorrects');

    const user = await this.usersRepo.findOneBy({ email: dto.email });
    if (!user) throw invalid;

    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    const match = await compare(dto.password, user.passwordHash);
    if (!match) throw invalid;

    await this.usersRepo.update(user.id, { lastLoginAt: new Date() });

    // `mcp` (must change password) permet au frontend de rediriger vers le
    // changement de mot de passe ; le backend, lui, relit la valeur en base
    // à chaque requête (cf. JwtStrategy / JwtAuthGuard).
    const payload = {
      sub: user.id,
      role: user.role,
      ...(user.mustChangePassword ? { mcp: true } : {}),
    };
    return {
      access_token: this.jwtService.sign(payload),
      mustChangePassword: user.mustChangePassword,
    };
  }
}
