import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const REGLE_MOT_DE_PASSE =
  'Le mot de passe doit contenir au moins 12 caractères, dont une majuscule, une minuscule et un chiffre';

// Règle commune à la création d'un compte, à sa réinitialisation par un
// admin et au changement de mot de passe par l'utilisateur.
export function MotDePasseRobuste() {
  return applyDecorators(
    IsString(),
    MinLength(12, { message: REGLE_MOT_DE_PASSE }),
    MaxLength(128),
    Matches(/[a-z]/, { message: REGLE_MOT_DE_PASSE }),
    Matches(/[A-Z]/, { message: REGLE_MOT_DE_PASSE }),
    Matches(/\d/, { message: REGLE_MOT_DE_PASSE }),
  );
}
