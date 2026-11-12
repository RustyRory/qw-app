import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Coordonnées du cabinet (une seule ligne, id = 1) : en-tête et pied de
// page des lettres de mission. Modifiables par un administrateur.
@Entity('parametres_cabinet')
export class ParametresCabinet {
  @PrimaryColumn({ type: 'integer', default: 1 })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 255 })
  raisonSociale: string;

  @Column({ type: 'varchar', length: 255 })
  formeJuridique: string;

  @Column({ type: 'varchar', length: 255 })
  adresse: string;

  @Column({ type: 'varchar', length: 10 })
  codePostal: string;

  @Column({ type: 'varchar', length: 100 })
  ville: string;

  @Column({ type: 'varchar', length: 50 })
  capitalSocial: string;

  @Column({ type: 'varchar', length: 20 })
  siret: string;

  @Column({ type: 'varchar', length: 10 })
  codeApe: string;

  @Column({ type: 'varchar', length: 50 })
  tvaIntracommunautaire: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telephone: string | null;

  // Logo en data URI (image/png ou image/jpeg) ; null = logo par défaut.
  @Column({ type: 'text', nullable: true })
  logoDataUri: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
