import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TypeContact } from '../../common/enums';

export class CreateContactDto {
  @IsUUID()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsEnum(TypeContact)
  type: TypeContact;

  @IsOptional()
  @IsString()
  roleDetail?: string;
}
