import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCabinetDto {
  @IsString() @IsNotEmpty() @MaxLength(255) nom: string;
  @IsString() @IsNotEmpty() @MaxLength(255) raisonSociale: string;
  @IsString() @IsNotEmpty() @MaxLength(255) formeJuridique: string;
  @IsString() @IsNotEmpty() @MaxLength(255) adresse: string;
  @IsString() @IsNotEmpty() @MaxLength(10) codePostal: string;
  @IsString() @IsNotEmpty() @MaxLength(100) ville: string;
  @IsString() @IsNotEmpty() @MaxLength(50) capitalSocial: string;
  @IsString() @IsNotEmpty() @MaxLength(20) siret: string;
  @IsString() @IsNotEmpty() @MaxLength(10) codeApe: string;
  @IsString() @IsNotEmpty() @MaxLength(50) tvaIntracommunautaire: string;

  @IsOptional() @IsEmail() @MaxLength(255) email?: string | null;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string | null;

  // ~1,5 Mo max une fois encodé.
  @IsOptional()
  @Matches(/^data:image\/(png|jpeg);base64,/, {
    message: 'Le logo doit être une image PNG ou JPEG',
  })
  @MaxLength(2_000_000)
  logoDataUri?: string | null;
}
