import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { StatutCorrespondance } from '../entities/screening-correspondance.entity';

export class DeciderCorrespondanceDto {
  @IsEnum(StatutCorrespondance)
  statut: StatutCorrespondance;

  @IsString()
  @IsNotEmpty({ message: 'Un commentaire est obligatoire' })
  @MaxLength(2000)
  commentaire: string;
}
