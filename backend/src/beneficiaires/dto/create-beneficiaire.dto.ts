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
  @IsUUID()
  clientId: string;

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
