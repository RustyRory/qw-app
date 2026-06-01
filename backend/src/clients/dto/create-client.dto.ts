import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  prenom: string;

  @IsString()
  @MinLength(1)
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
}
