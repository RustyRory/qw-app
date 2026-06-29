import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateKycDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationalite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paysResidence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  secteurActivite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  formeJuridique?: string;

  @IsOptional()
  @IsBoolean()
  estPep?: boolean;

  @IsOptional()
  @IsBoolean()
  paysHautRisque?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  chiffreAffaires?: number;
}
