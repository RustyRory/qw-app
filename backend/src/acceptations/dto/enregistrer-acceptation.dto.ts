import { IsObject } from 'class-validator';
import type { ReponseAcceptation } from '../catalogue';

export class EnregistrerAcceptationDto {
  // { [idQuestion]: { reponse, niveau, observation } }
  @IsObject()
  reponses: Record<string, ReponseAcceptation>;
}
