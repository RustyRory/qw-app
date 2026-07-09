import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TypeObligation } from '../../common/enums';

export class CreateObligationDto {
  @IsUUID()
  clientId: string;

  @IsEnum(TypeObligation)
  type: TypeObligation;

  @IsOptional()
  @IsDateString()
  dateEcheance?: string;
}
