import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';
import { User } from '../../users/entities/user.entity';

export enum StatutCorrespondance {
  A_VERIFIER = 'A_VERIFIER',
  HOMONYME = 'HOMONYME',
  CONFIRMEE = 'CONFIRMEE',
}

// Nom d'un dossier (entité, représentant légal ou bénéficiaire effectif)
// proche d'une entrée du registre national des gels : à vérifier par un
// responsable / EC, qui conclut à un homonyme ou à une correspondance.
@Entity('screening_correspondance')
@Index(['client'])
@Index(['prospect'])
export class ScreeningCorrespondance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @ManyToOne(() => Prospect, { nullable: true })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect | null;

  // Ex. « Bénéficiaire effectif : Jean Dupont ».
  @Column({ type: 'varchar', length: 300 })
  personneControlee: string;

  @Column({ type: 'integer' })
  idRegistre: number;

  @Column({ type: 'varchar', length: 300 })
  nomRegistre: string;

  @Column({ type: 'varchar', length: 30 })
  natureRegistre: string;

  @Column({ type: 'text', nullable: true })
  motifs: string | null;

  // Date de publication du registre dans lequel la correspondance a été vue.
  @Column({ type: 'timestamptz' })
  registreDu: Date;

  @Column({
    type: 'enum',
    enum: StatutCorrespondance,
    default: StatutCorrespondance.A_VERIFIER,
  })
  statut: StatutCorrespondance;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_decide_par' })
  decidePar: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  decideAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
