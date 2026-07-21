import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { CreateProspectDto } from './create-prospect.dto';
import { StatutKanban } from '../../common/enums';

export class UpdateProspectDto extends PartialType(CreateProspectDto) {
  @IsOptional()
  @IsEnum(StatutKanban)
  statutKanban?: StatutKanban;

  @IsOptional()
  @IsString()
  motifRefus?: string;

  // null accepté explicitement pour désassigner (distinct de undefined = "pas de changement").
  @IsOptional()
  @ValidateIf((o: UpdateProspectDto) => o.assignedToId !== null)
  @IsUUID()
  assignedToId?: string | null;
}
