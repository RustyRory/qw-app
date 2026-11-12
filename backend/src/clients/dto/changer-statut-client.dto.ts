import { IsEnum } from 'class-validator';
import { StatutClient } from '../../common/enums';

export class ChangerStatutClientDto {
  @IsEnum(StatutClient)
  statut: StatutClient;
}
