import { EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';

// Dérive le prochain numéro de séquence à partir du MAX des refs existantes
// (et non d'un COUNT, qui se désynchronise dès qu'une ligne a été supprimée
// définitivement — ex: suppression manuelle en base — provoquant une
// collision de clé unique lors de la génération suivante).
export async function generateNextRef<T extends ObjectLiteral>(
  manager: EntityManager,
  entity: EntityTarget<T>,
  prefix: string,
): Promise<string> {
  const last = await manager
    .createQueryBuilder(entity, 'e')
    .select('e.ref', 'ref')
    .where('e.ref LIKE :pattern', { pattern: `${prefix}%` })
    .withDeleted()
    .orderBy('e.ref', 'DESC')
    .limit(1)
    .getRawOne<{ ref: string }>();

  const lastSeq = last ? parseInt(last.ref.slice(prefix.length), 10) : 0;
  const seq = String(lastSeq + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}
