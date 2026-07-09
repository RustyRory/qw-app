import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { TypeContact } from '../../common/enums';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEnum(TypeContact)
  type?: TypeContact;

  @IsOptional()
  @IsString()
  roleDetail?: string;
}
