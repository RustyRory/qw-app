import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateProspectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  prenom: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  raisonSociale?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  secteurActivite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paysResidence?: string;

  @IsOptional()
  @IsBoolean()
  estPep?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
