import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MotDePasseRobuste } from '../../common/validators/mot-de-passe';
import { Role } from '../../common/enums';

export class UpdateUserDto {
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

  // Réinitialisation par un admin : nouveau mot de passe provisoire.
  @IsOptional()
  @MotDePasseRobuste()
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
