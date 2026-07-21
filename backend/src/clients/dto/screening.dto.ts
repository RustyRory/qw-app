import { IsEnum } from 'class-validator';
import { ScreeningStatut } from '../../common/enums';

export class ScreeningDto {
  @IsEnum(ScreeningStatut)
  statut: ScreeningStatut;
}
