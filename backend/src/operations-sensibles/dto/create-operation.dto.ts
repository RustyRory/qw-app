import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TypeOperationSensible } from '../../common/enums';

export class CreateOperationDto {
  @IsUUID()
  clientId: string;

  @IsEnum(TypeOperationSensible)
  type: TypeOperationSensible;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  montant?: number;

  @IsOptional()
  @IsString()
  devise?: string;
}
