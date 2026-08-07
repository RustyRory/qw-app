import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TypeObligation } from '../../common/enums';

export class CreateObligationDto {
  // Exactement un des deux doit être renseigné (jamais les deux, ni aucun).
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  prospectId?: string;

  @IsEnum(TypeObligation)
  type: TypeObligation;

  @IsOptional()
  @IsDateString()
  dateEcheance?: string;
}
