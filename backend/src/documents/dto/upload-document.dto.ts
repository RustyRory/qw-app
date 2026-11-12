import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TypeDocument } from '../../common/enums';

// Champs texte du formulaire multipart accompagnant le fichier.
export class UploadDocumentDto {
  @IsOptional()
  @IsEnum(TypeDocument)
  type?: TypeDocument;

  // AAAA-MM-JJ
  @IsOptional()
  @IsDateString({}, { message: "La date d'expiration n'est pas valide" })
  dateExpiration?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  missionId?: string;

  @IsOptional()
  @IsUUID()
  planningEtapeId?: string;

  @IsOptional()
  @IsUUID()
  operationSensibleId?: string;
}
