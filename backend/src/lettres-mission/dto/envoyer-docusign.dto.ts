import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class EnvoyerDocusignDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nom: string;
}
