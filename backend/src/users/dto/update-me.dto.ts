import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Auto-gestion : volontairement sans `role` ni `isActive` — un utilisateur ne
// peut modifier que son identité, jamais ses propres droits (voir UpdateUserDto
// pour la version admin).
export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  prenom?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nom?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
