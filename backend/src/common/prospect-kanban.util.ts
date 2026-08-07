import { Prospect } from '../prospects/entities/prospect.entity';
import { StatutKanban } from './enums';

// Ordre des étapes actives du pipeline — sert uniquement à empêcher les
// automatisations de faire régresser un prospect déjà plus avancé (ex : ne
// pas repasser en LM_A_FAIRE un prospect déjà en LM_ENVOYEE si son
// questionnaire est revalidé après une réouverture). REFUSE n'y figure pas :
// il est géré à part, un prospect refusé peut toujours reprendre sa
// progression.
const KANBAN_ORDER: StatutKanban[] = [
  StatutKanban.PRISE_CONTACT,
  StatutKanban.PREPARATION_LAB,
  StatutKanban.VALIDATION_LAB,
  StatutKanban.LM_A_FAIRE,
  StatutKanban.LM_ENVOYEE,
  StatutKanban.CONVERTI,
];

// Fait avancer automatiquement le statut kanban d'un prospect vers `cible`,
// sans jamais le faire régresser ni toucher un prospect déjà converti.
// Renvoie true si une modification a été appliquée (à sauvegarder par
// l'appelant).
export function avancerStatutKanban(
  prospect: Prospect,
  cible: StatutKanban,
): boolean {
  if (prospect.statutKanban === StatutKanban.CONVERTI) return false;

  const idxCourant = KANBAN_ORDER.indexOf(prospect.statutKanban);
  const idxCible = KANBAN_ORDER.indexOf(cible);
  if (idxCourant >= idxCible) return false;

  const etaitRefuse = prospect.statutKanban === StatutKanban.REFUSE;
  prospect.statutKanban = cible;
  if (etaitRefuse) prospect.refusedAt = null;
  return true;
}

// Bascule automatiquement un prospect en REFUSE (ex : suite au refus de son
// questionnaire d'acceptation). N'a aucun effet sur un prospect déjà
// converti ou déjà refusé.
export function refuserProspectAuto(prospect: Prospect): boolean {
  if (
    prospect.statutKanban === StatutKanban.CONVERTI ||
    prospect.statutKanban === StatutKanban.REFUSE
  ) {
    return false;
  }
  prospect.statutKanban = StatutKanban.REFUSE;
  prospect.refusedAt = new Date();
  return true;
}
