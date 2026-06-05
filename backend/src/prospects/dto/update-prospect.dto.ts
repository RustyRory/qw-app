import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProspectDto } from './create-prospect.dto';
import { ProspectStatut } from '../entities/prospect.entity';

export class UpdateProspectDto extends PartialType(CreateProspectDto) {
  @IsOptional()
  @IsEnum(ProspectStatut)
  statut?: ProspectStatut;
}
