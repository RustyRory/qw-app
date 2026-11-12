import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateBeneficiaireDto {
  // Exactement un des deux : bénéficiaire d'un client, ou d'un prospect
  // (transféré au client à la conversion).
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  prospectId?: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @IsString()
  nationalite?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  pourcentageDetention: number;

  @IsOptional()
  @IsBoolean()
  ppe?: boolean;
}
