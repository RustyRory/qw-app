import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateScoreDto {
  @IsUUID()
  clientId: string;

  @IsInt()
  @Min(0)
  @Max(50)
  clientCaracteristiques: number;

  @IsInt()
  @Min(0)
  @Max(40)
  activiteSecteur: number;

  @IsInt()
  @Min(0)
  @Max(30)
  zoneGeographique: number;

  @IsInt()
  @Min(0)
  @Max(30)
  typeMission: number;
}
