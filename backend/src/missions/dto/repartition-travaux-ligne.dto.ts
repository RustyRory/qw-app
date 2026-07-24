import { IsIn, IsString } from 'class-validator';
import type { AssignationTache } from '../../common/repartition-travaux';

export class RepartitionTravauxLigneDto {
  @IsString()
  id: string;

  @IsIn(['CABINET', 'CLIENT', 'NA'])
  assignation: AssignationTache;
}
