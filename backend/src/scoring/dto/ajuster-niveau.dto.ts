import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { NiveauRisque } from '../../common/enums';

export class AjusterNiveauDto {
  // null = retirer l'ajustement manuel.
  @ValidateIf((o: AjusterNiveauDto) => o.niveau !== null)
  @IsEnum(NiveauRisque)
  niveau: NiveauRisque | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  justification?: string;
}
