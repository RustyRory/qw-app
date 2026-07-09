import 'reflect-metadata';
import { config } from 'dotenv';
import { hash } from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import {
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from '../questionnaires/entities/questionnaire-acceptation.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Document } from '../documents/entities/document.entity';
import { LettreMission } from '../lettres-mission/entities/lettre-mission.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import { PlanningEtape } from '../planning/entities/planning-etape.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { OperationSensible } from '../operations-sensibles/entities/operation-sensible.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import {
  Role,
  StatutClient,
  StatutKyc,
  ScreeningStatut,
  TypeEntite,
  StatutKanban,
  TypeContact,
  TypeMission,
  StatutMission,
  NiveauRisque,
  TypePlanningEtape,
  StatutPlanningEtape,
  TypeObligation,
  StatutObligation,
  TypeOperationSensible,
  StatutOperationSensible,
} from '../common/enums';

config();

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const clientRepo = AppDataSource.getRepository(Client);
  const prospectRepo = AppDataSource.getRepository(Prospect);
  const questionnaireRepo = AppDataSource.getRepository(
    QuestionnaireAcceptation,
  );
  const beneficiaireRepo = AppDataSource.getRepository(BeneficiaireEffectif);
  const contactRepo = AppDataSource.getRepository(Contact);
  const missionRepo = AppDataSource.getRepository(Mission);
  const documentRepo = AppDataSource.getRepository(Document);
  const lettreMissionRepo = AppDataSource.getRepository(LettreMission);
  const scoreRepo = AppDataSource.getRepository(ScoreRisque);
  const planningRepo = AppDataSource.getRepository(PlanningEtape);
  const obligationRepo = AppDataSource.getRepository(Obligation);
  const operationRepo = AppDataSource.getRepository(OperationSensible);
  const auditRepo = AppDataSource.getRepository(AuditLog);

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

  const clients: Client[] = [];
  for (const data of clientsData) {
    clients.push(await clientRepo.save(clientRepo.create(data)));
  }
  const [clientDurand, clientBernard, , clientLpHolding] = clients;

  console.log('✓ Clients créés');

  // ── Prospects ────────────────────────────────────────────────
  const prospectAbc = await prospectRepo.save(
    prospectRepo.create({
      ref: 'PR-2024-001',
      nom: 'Nouvelle Société ABC',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      statutKanban: StatutKanban.DECOUVERTE,
      activite: 'Vente en ligne',
      chiffreAffaires: 60000,
      createdBy: collaborateur,
      assignedTo: responsable,
    }),
  );

  await prospectRepo.save(
    prospectRepo.create({
      ref: 'PR-2024-002',
      nom: 'Marie Petit',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      statutKanban: StatutKanban.PRISE_CONTACT,
      activite: 'Profession libérale',
      createdBy: collaborateur,
    }),
  );

  console.log('✓ Prospects créés');

  // ── Questionnaire d'acceptation ──────────────────────────────
  await questionnaireRepo.save(
    questionnaireRepo.create({
      prospect: prospectAbc,
      statut: StatutQuestionnaire.EN_COURS,
      reponses: { activiteLicite: true, clientFinal: 'particuliers' },
      createdBy: collaborateur,
    }),
  );

  console.log('✓ Questionnaire d’acceptation créé');

  // ── Bénéficiaires effectifs ──────────────────────────────────
  await beneficiaireRepo.save(
    beneficiaireRepo.create({
      prenom: 'Pierre',
      nom: 'Lambert',
      nationalite: 'Française',
      pourcentageDetention: 45.5,
      ppe: true,
      client: clientLpHolding,
    }),
  );

  console.log('✓ Bénéficiaires effectifs créés');

  // ── Contacts ─────────────────────────────────────────────────
  await contactRepo.save(
    contactRepo.create({
      prenom: 'Julie',
      nom: 'Rousseau',
      email: 'j.rousseau@avocats-example.fr',
      type: TypeContact.AVOCAT,
      client: clientLpHolding,
    }),
  );

  console.log('✓ Contacts créés');

  // ── Missions ─────────────────────────────────────────────────
  const missionDurand = await missionRepo.save(
    missionRepo.create({
      type: TypeMission.COMPTABILITE,
      description: 'Tenue de comptabilité annuelle',
      statut: StatutMission.EN_COURS,
      dateDebut: new Date('2024-01-01'),
      honoraires: 3500,
      client: clientDurand,
      createdBy: responsable,
    }),
  );

  await missionRepo.save(
    missionRepo.create({
      type: TypeMission.CONSEIL,
      description: 'Accompagnement à la création',
      statut: StatutMission.EN_COURS,
      dateDebut: new Date('2024-03-01'),
      honoraires: 1200,
      client: clientBernard,
      createdBy: collaborateur,
    }),
  );

  console.log('✓ Missions créées');

  // ── Documents ────────────────────────────────────────────────
  await documentRepo.save(
    documentRepo.create({
      nomFichier: 'kbis.pdf',
      cheminStockage: 'clients/QW-2024-001/kbis.pdf',
      typeMime: 'application/pdf',
      taille: 204800,
      client: clientDurand,
      utilisateur: collaborateur,
    }),
  );

  console.log('✓ Documents créés');

  // ── Lettre de mission ────────────────────────────────────────
  await lettreMissionRepo.save(
    lettreMissionRepo.create({
      version: 1,
      contenu: {
        objet: 'Tenue de comptabilité annuelle',
        honoraires: 3500,
      },
      signeeParExpert: true,
      signeeAt: new Date(),
      mission: missionDurand,
      signataire: admin,
    }),
  );

  console.log('✓ Lettre de mission créée');

  // ── Scores de risque ─────────────────────────────────────────
  await scoreRepo.save(
    scoreRepo.create({
      score: 25,
      niveau: NiveauRisque.FAIBLE,
      reponses: {
        clientCaracteristiques: 10,
        activiteSecteur: 5,
        zoneGeographique: 5,
        typeMission: 5,
      },
      client: clientDurand,
      calculatedBy: responsable,
    }),
  );

  await scoreRepo.save(
    scoreRepo.create({
      score: 85,
      niveau: NiveauRisque.ELEVE,
      reponses: {
        clientCaracteristiques: 40,
        activiteSecteur: 20,
        zoneGeographique: 20,
        typeMission: 5,
      },
      client: clientLpHolding,
      calculatedBy: admin,
    }),
  );

  console.log('✓ Scores de risque créés');

  // ── Planning des étapes ──────────────────────────────────────
  await planningRepo.save(
    planningRepo.create({
      titre: 'Renouvellement KYC annuel',
      type: TypePlanningEtape.REGLEMENTAIRE,
      statut: StatutPlanningEtape.A_FAIRE,
      dateEcheance: new Date('2025-06-01'),
      client: clientDurand,
      createdBy: responsable,
      assignedTo: collaborateur,
    }),
  );

  console.log('✓ Étapes de planning créées');

  // ── Obligations ──────────────────────────────────────────────
  await obligationRepo.save(
    obligationRepo.create({
      type: TypeObligation.KYC_VERIFICATION,
      statut: StatutObligation.EN_RETARD,
      dateEcheance: new Date('2024-12-01'),
      client: clientBernard,
    }),
  );

  await obligationRepo.save(
    obligationRepo.create({
      type: TypeObligation.EVALUATION_RISQUE,
      statut: StatutObligation.FAIT,
      completedAt: new Date(),
      client: clientLpHolding,
    }),
  );

  console.log('✓ Obligations créées');

  // ── Opérations sensibles ─────────────────────────────────────
  await operationRepo.save(
    operationRepo.create({
      type: TypeOperationSensible.INHABITUELLE,
      description: 'Virement important sans justification économique claire',
      montant: 500000,
      devise: 'EUR',
      statut: StatutOperationSensible.EN_ANALYSE,
      client: clientLpHolding,
      signaleBy: collaborateur,
    }),
  );

  console.log('✓ Opérations sensibles créées');

  // ── Journal d'audit ──────────────────────────────────────────
  await auditRepo.save(
    auditRepo.create({
      action: AuditAction.LOGIN,
      ressource: 'users',
      ressourceId: admin.id,
      utilisateur: admin,
    }),
  );

  await auditRepo.save(
    auditRepo.create({
      action: AuditAction.CREATE,
      ressource: 'clients',
      ressourceId: clientDurand.id,
      details: { ref: clientDurand.ref },
      utilisateur: collaborateur,
    }),
  );

  console.log('✓ Journal d’audit créé');

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
