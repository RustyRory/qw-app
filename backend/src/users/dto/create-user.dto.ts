import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MotDePasseRobuste } from '../../common/validators/mot-de-passe';
import { Role } from '../../common/enums';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  prenom: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nom: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  // Mot de passe provisoire : l'utilisateur devra le changer à sa première
  // connexion.
  @MotDePasseRobuste()
  password: string;

  @IsEnum(Role)
  role: Role;
}
