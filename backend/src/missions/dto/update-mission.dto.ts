import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RepartitionTravauxLigneDto } from './repartition-travaux-ligne.dto';

export class UpdateMissionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @IsOptional()
  @IsNumber()
  honoraires?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepartitionTravauxLigneDto)
  repartitionTravaux?: RepartitionTravauxLigneDto[];
}
