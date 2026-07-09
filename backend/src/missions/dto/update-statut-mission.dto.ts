import { IsEnum } from 'class-validator';
import { StatutMission } from '../../common/enums';

export class UpdateStatutMissionDto {
  @IsEnum(StatutMission)
  statut: StatutMission;
}
