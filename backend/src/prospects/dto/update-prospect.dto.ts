import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateProspectDto } from './create-prospect.dto';
import { StatutKanban } from '../../common/enums';

export class UpdateProspectDto extends PartialType(CreateProspectDto) {
  @IsOptional()
  @IsEnum(StatutKanban)
  statutKanban?: StatutKanban;

  @IsOptional()
  @IsString()
  motifRefus?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
