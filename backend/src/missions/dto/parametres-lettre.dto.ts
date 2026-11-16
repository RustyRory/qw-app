import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const FORMULES_APPEL = [
  'Madame, Monsieur,',
  'Madame,',
  'Monsieur,',
] as const;

export class LigneCapitalDto {
  @IsString()
  @MaxLength(150)
  associe: string;

  // Parts ou pourcentage, saisi librement (« 500 parts », « 50 % »).
  @IsString()
  @MaxLength(50)
  detention: string;
}

// Paramètres propres à la lettre de mission, saisis sur la mission.
export class ParametresLettreDto {
  @IsOptional()
  @IsIn(FORMULES_APPEL)
  formuleAppel?: (typeof FORMULES_APPEL)[number];

  // Jusqu'à 3 lignes de répartition du capital social.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => LigneCapitalDto)
  repartitionCapital?: LigneCapitalDto[];

  @IsOptional()
  @IsDateString()
  dateClotureExercice?: string | null;

  // Date d'effet du contrat (par défaut, la date de début de mission).
  @IsOptional()
  @IsDateString()
  dateEffet?: string | null;

  // §4.1 — période couverte par les honoraires (texte libre, ex.
  // « l'exercice clos le 31/12/2026 »).
  @IsOptional()
  @IsString()
  @MaxLength(255)
  periodeHonoraires?: string | null;

  // §4.1 — frais de débours en % HT des honoraires.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fraisDeboursPct?: number;

  // §4.2 — rythmes de facturation et de paiement (texte libre).
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rythmeFacturation?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  rythmePaiement?: string | null;
}
