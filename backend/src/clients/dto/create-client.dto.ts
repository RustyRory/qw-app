import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TypeEntite } from '../../common/enums';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  raisonSociale: string;

  @IsEnum(TypeEntite)
  typeEntite: TypeEntite;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  siret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  siren?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  formeJuridique?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  representantLegal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  codeNaf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  activitePrincipale?: string;

  @IsOptional()
  @IsDateString()
  dateCreationEntreprise?: string;

  @IsOptional()
  @IsString()
  adresseSiege?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  codePostal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pays?: string;

  @IsOptional()
  @IsNumber()
  chiffreAffaires?: number;

  @IsOptional()
  @IsNumber()
  effectif?: number;

  @IsOptional()
  @IsString()
  natureMission?: string;
}
