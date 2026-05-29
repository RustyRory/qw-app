import 'reflect-metadata';
import { config } from 'dotenv';
import { hash } from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../users/entities/user.entity';
import { Client, ClientStatut } from '../clients/entities/client.entity';
import { Kyc } from '../kyc/entities/kyc.entity';

config();

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const clientRepo = AppDataSource.getRepository(Client);
  const kycRepo = AppDataSource.getRepository(Kyc);

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
    role: UserRole.ADMIN,
    prenom: 'Alice',
    nom: 'Martin',
    isActive: true,
  });

  const collaborateur = userRepo.create({
    email: 'collab@qwconseil.fr',
    passwordHash: await hash('Collab1234!', 12),
    role: UserRole.COLLABORATEUR,
    prenom: 'Bob',
    nom: 'Dupont',
    isActive: true,
  });

  await userRepo.save([admin, collaborateur]);
  console.log('✓ Utilisateurs créés');

  // ── Clients + KYC ─────────────────────────────────────────────
  const clientsData = [
    {
      client: {
        reference: 'QW-2024-001',
        prenom: 'Jean',
        nom: 'Durand',
        email: 'jean.durand@example.com',
        telephone: '0601020304',
        statut: ClientStatut.VALIDE,
        createur: admin,
        validateur: admin,
      },
      kyc: {
        nationalite: 'Française',
        paysResidence: 'France',
        secteurActivite: 'Commerce de détail',
        formeJuridique: 'SARL',
        estPep: false,
        paysHautRisque: false,
        chiffreAffaires: 250000,
      },
    },
    {
      client: {
        reference: 'QW-2024-002',
        prenom: 'Sophie',
        nom: 'Bernard',
        email: 'sophie.bernard@example.com',
        telephone: '0607080910',
        statut: ClientStatut.EN_COURS,
        createur: collaborateur,
        validateur: null,
      },
      kyc: {
        nationalite: 'Française',
        paysResidence: 'France',
        secteurActivite: 'Conseil en management',
        formeJuridique: 'SAS',
        estPep: false,
        paysHautRisque: false,
        chiffreAffaires: 180000,
      },
    },
    {
      client: {
        reference: 'QW-2024-003',
        prenom: 'Carlos',
        nom: 'Mendes',
        email: 'carlos.mendes@example.com',
        telephone: '0611121314',
        statut: ClientStatut.EN_COURS,
        createur: collaborateur,
        validateur: null,
      },
      kyc: {
        nationalite: 'Portugaise',
        paysResidence: 'Portugal',
        secteurActivite: 'Import / Export',
        formeJuridique: 'auto-entrepreneur',
        estPep: false,
        paysHautRisque: false,
        chiffreAffaires: 95000,
      },
    },
    {
      client: {
        reference: 'QW-2024-004',
        prenom: 'Laure',
        nom: 'Petit',
        raisonSociale: 'LP Holding',
        email: 'laure.petit@lpholding.fr',
        telephone: '0615161718',
        statut: ClientStatut.REJETE,
        createur: admin,
        validateur: admin,
      },
      kyc: {
        nationalite: 'Française',
        paysResidence: 'Suisse',
        secteurActivite: 'Finance',
        formeJuridique: 'SA',
        estPep: true,
        paysHautRisque: true,
        chiffreAffaires: 1200000,
      },
    },
  ];

  for (const { client: clientData, kyc: kycData } of clientsData) {
    const client = clientRepo.create(clientData);
    await clientRepo.save(client);

    const kyc = kycRepo.create({ ...kycData, client });
    await kycRepo.save(kyc);
  }

  console.log('✓ Clients et KYC créés');
  console.log('\nComptes de test :');
  console.log('  admin@qwconseil.fr       / Admin1234!');
  console.log('  collab@qwconseil.fr      / Collab1234!');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erreur seed :', err);
  process.exit(1);
});
