import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TypeEntite } from '../../common/enums';

export class CreateProspectDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsEnum(TypeEntite)
  typeEntite: TypeEntite;

  @IsOptional()
  @IsString()
  siret?: string;

  @IsOptional()
  @IsString()
  activite?: string;

  @IsOptional()
  @IsString()
  codeNaf?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
