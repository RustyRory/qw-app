import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateQuestionnaireDto {
  @IsOptional()
  @IsObject()
  reponses?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  motifRefus?: string;
}
