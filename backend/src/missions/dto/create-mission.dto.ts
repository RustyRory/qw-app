import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TypeMission } from '../../common/enums';
import { RepartitionTravauxLigneDto } from './repartition-travaux-ligne.dto';

export class CreateMissionDto {
  @IsUUID()
  clientId: string;

  @IsEnum(TypeMission)
  type: TypeMission;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dateDebut: string;

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
