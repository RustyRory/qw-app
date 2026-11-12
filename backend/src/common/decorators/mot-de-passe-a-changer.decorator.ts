import { SetMetadata } from '@nestjs/common';

export const AUTORISE_MDP_A_CHANGER_KEY = 'autoriseMotDePasseAChanger';

// Route accessible même quand l'utilisateur doit encore changer son mot de
// passe provisoire (lecture du profil, changement du mot de passe). Toutes
// les autres routes authentifiées répondent 403 tant qu'il ne l'a pas fait.
export const AutoriseMotDePasseAChanger = () =>
  SetMetadata(AUTORISE_MDP_A_CHANGER_KEY, true);
