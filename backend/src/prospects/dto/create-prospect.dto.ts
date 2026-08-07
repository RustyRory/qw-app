import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
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
  formeJuridique?: string;

  @IsOptional()
  @IsString()
  representantLegal?: string;

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

  @IsOptional()
  @IsNumber()
  capitalSocial?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regimeFiscal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regimeTva?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tvaIntracommunautaire?: string;

  @IsOptional()
  @IsBoolean()
  existenceSalaries?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conventionCollective?: string;
}
