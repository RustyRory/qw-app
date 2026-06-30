import 'reflect-metadata';
import { config } from 'dotenv';
import { hash } from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import {
  Role,
  StatutClient,
  StatutKyc,
  ScreeningStatut,
  TypeEntite,
} from '../common/enums';

config();

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const clientRepo = AppDataSource.getRepository(Client);

  const existingAdmin = await userRepo.findOneBy({
    email: 'admin@qwconseil.fr',
  });
  if (existingAdmin) {
    console.log('Seed déjà effectué, abandon.');
    await AppDataSource.destroy();
    return;
  }

  // ── Utilisateurs ──────────────────────────────────────────────
  const admin = userRepo.create({
    email: 'admin@qwconseil.fr',
    passwordHash: await hash('Admin1234!', 12),
    role: Role.ADMIN,
    prenom: 'Alice',
    nom: 'Martin',
    isActive: true,
  });

  const responsable = userRepo.create({
    email: 'responsable@qwconseil.fr',
    passwordHash: await hash('Resp1234!', 12),
    role: Role.RESPONSABLE,
    prenom: 'Claire',
    nom: 'Leroy',
    isActive: true,
  });

  const collaborateur = userRepo.create({
    email: 'collab@qwconseil.fr',
    passwordHash: await hash('Collab1234!', 12),
    role: Role.COLLABORATEUR,
    prenom: 'Bob',
    nom: 'Dupont',
    isActive: true,
  });

  await userRepo.save([admin, responsable, collaborateur]);
  console.log('✓ Utilisateurs créés');

  // ── Clients (KYC fusionné) ──────────────────────────────────────
  const clientsData: Partial<Client>[] = [
    {
      ref: 'QW-2024-001',
      raisonSociale: 'Jean Durand',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      pays: 'France',
      activitePrincipale: 'Commerce de détail',
      formeJuridique: 'SARL',
      chiffreAffaires: 250000,
      statut: StatutClient.ACTIF,
      kycStatut: StatutKyc.VALIDE,
      ppe: false,
      screeningStatut: ScreeningStatut.OK,
      kycCompletedAt: new Date(),
      kycValidatedBy: admin,
      createdBy: admin,
    },
    {
      ref: 'QW-2024-002',
      raisonSociale: 'Sophie Bernard',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      pays: 'France',
      activitePrincipale: 'Conseil en management',
      formeJuridique: 'SAS',
      chiffreAffaires: 180000,
      statut: StatutClient.ACTIF,
      kycStatut: StatutKyc.INCOMPLET,
      ppe: false,
      screeningStatut: ScreeningStatut.NON_EFFECTUE,
      createdBy: collaborateur,
    },
    {
      ref: 'QW-2024-003',
      raisonSociale: 'Carlos Mendes',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      pays: 'Portugal',
      activitePrincipale: 'Import / Export',
      formeJuridique: 'auto-entrepreneur',
      chiffreAffaires: 95000,
      statut: StatutClient.ACTIF,
      kycStatut: StatutKyc.COMPLET,
      ppe: false,
      screeningStatut: ScreeningStatut.OK,
      createdBy: collaborateur,
    },
    {
      ref: 'QW-2024-004',
      raisonSociale: 'LP Holding',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      pays: 'Suisse',
      activitePrincipale: 'Finance',
      formeJuridique: 'SA',
      chiffreAffaires: 1200000,
      statut: StatutClient.RESILIE,
      kycStatut: StatutKyc.VALIDE,
      ppe: true,
      screeningStatut: ScreeningStatut.ALERTE,
      kycCompletedAt: new Date(),
      kycValidatedBy: admin,
      createdBy: admin,
    },
  ];

  for (const data of clientsData) {
    await clientRepo.save(clientRepo.create(data));
  }

  console.log('✓ Clients créés');
  console.log('\nComptes de test :');
  console.log('  admin@qwconseil.fr         / Admin1234!');
  console.log('  responsable@qwconseil.fr  / Resp1234!');
  console.log('  collab@qwconseil.fr       / Collab1234!');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erreur seed :', err);
  process.exit(1);
});
