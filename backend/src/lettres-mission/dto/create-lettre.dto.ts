import { IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export class CreateLettreMissionDto {
  @IsUUID()
  missionId: string;

  @IsObject()
  @IsNotEmpty()
  contenu: Record<string, unknown>;
}
