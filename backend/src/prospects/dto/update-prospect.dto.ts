import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProspectDto } from './create-prospect.dto';
import { StatutKanban } from '../../common/enums';

// Le refus (motif obligatoire) passe par PATCH /prospects/:id/refuser et la
// conversion par POST /prospects/:id/convert : ces deux statuts ne sont pas
// acceptés ici (contrôle dans le service).
export class UpdateProspectDto extends PartialType(CreateProspectDto) {
  @IsOptional()
  @IsEnum(StatutKanban)
  statutKanban?: StatutKanban;
}
