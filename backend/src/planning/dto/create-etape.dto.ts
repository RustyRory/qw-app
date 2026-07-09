import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TypePlanningEtape } from '../../common/enums';

export class CreateEtapeDto {
  @IsUUID()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TypePlanningEtape)
  type: TypePlanningEtape;

  @IsOptional()
  @IsDateString()
  dateEcheance?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
