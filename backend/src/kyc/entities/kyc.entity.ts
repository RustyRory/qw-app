import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

@Entity('kyc')
export class Kyc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationalite: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paysResidence: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  secteurActivite: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  formeJuridique: string | null;

  @Column({ type: 'boolean', default: false })
  estPep: boolean;

  @Column({ type: 'boolean', default: false })
  paysHautRisque: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  chiffreAffaires: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Client, (client) => client.kyc, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;
}
