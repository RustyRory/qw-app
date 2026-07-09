import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateQuestionnaireDto {
  @IsUUID()
  prospectId: string;

  @IsOptional()
  @IsObject()
  reponses?: Record<string, unknown>;
}
