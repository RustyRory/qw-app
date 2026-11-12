import { IsBoolean, IsString } from 'class-validator';

// Tâche de la répartition des travaux : cochée côté cabinet, côté client,
// les deux (partagée) ou aucun (non applicable).
export class RepartitionTravauxLigneDto {
  @IsString()
  id: string;

  @IsBoolean()
  cabinet: boolean;

  @IsBoolean()
  client: boolean;
}
