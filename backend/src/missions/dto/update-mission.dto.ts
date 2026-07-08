import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

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
}
