import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { TypeEntite } from '../../common/enums';

// Les longueurs maximales reprennent celles des colonnes de l'entité
// Prospect : sans elles, une saisie trop longue passe la validation et
// provoque une erreur SQL (500) au lieu d'un message clair (400).
// `@IsOptional()` laisse passer `null`, ce qui permet d'effacer un champ
// lors d'une modification.
export class CreateProspectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email n'est pas valide" })
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string | null;

  @IsEnum(TypeEntite)
  typeEntite: TypeEntite;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  formeJuridique?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  representantLegal?: string | null;

  @IsOptional()
  @Matches(/^\d{14}$/, {
    message: 'Le SIRET doit comporter exactement 14 chiffres',
  })
  siret?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  activite?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  codeNaf?: string | null;

  @IsOptional()
  @IsString()
  adresse?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  codePostal?: string | null;

  // Colonne NOT NULL (défaut 'France') : absent accepté, null refusé.
  @ValidateIf((o: CreateProspectDto) => o.pays !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pays?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chiffreAffaires?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  effectif?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capitalSocial?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regimeFiscal?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regimeTva?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tvaIntracommunautaire?: string | null;

  @IsOptional()
  @IsBoolean()
  existenceSalaries?: boolean | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conventionCollective?: string | null;

  // Collaborateur en charge, choisi dès la création (null / absent = non
  // assigné).
  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;
}
