import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
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

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}
