import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TypeMission } from '../../common/enums';

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
}
