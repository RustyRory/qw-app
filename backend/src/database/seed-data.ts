import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
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
import {
  computeAutoScore,
  flagsFromClient,
  flagsFromQuestionnaire,
} from '../scoring/auto-score.util';
import { PlanningEtape } from '../planning/entities/planning-etape.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { OperationSensible } from '../operations-sensibles/entities/operation-sensible.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import {
  StatutClient,
  StatutKyc,
  ScreeningStatut,
  TypeEntite,
  StatutKanban,
  TypeContact,
  TypeMission,
  StatutMission,
  TypePlanningEtape,
  StatutPlanningEtape,
  TypeObligation,
  StatutObligation,
  TypeOperationSensible,
  StatutOperationSensible,
} from '../common/enums';
import { seedUsers, SeededUsers } from './seed-users';

config();

export async function seedData(
  dataSource: DataSource,
  { admin, responsable, collaborateur }: SeededUsers,
): Promise<void> {
  const clientRepo = dataSource.getRepository(Client);
  const prospectRepo = dataSource.getRepository(Prospect);
  const questionnaireRepo = dataSource.getRepository(QuestionnaireAcceptation);
  const beneficiaireRepo = dataSource.getRepository(BeneficiaireEffectif);
  const contactRepo = dataSource.getRepository(Contact);
  const missionRepo = dataSource.getRepository(Mission);
  const documentRepo = dataSource.getRepository(Document);
  const lettreMissionRepo = dataSource.getRepository(LettreMission);
  const scoreRepo = dataSource.getRepository(ScoreRisque);
  const planningRepo = dataSource.getRepository(PlanningEtape);
  const obligationRepo = dataSource.getRepository(Obligation);
  const operationRepo = dataSource.getRepository(OperationSensible);
  const auditRepo = dataSource.getRepository(AuditLog);

  const existingClient = await clientRepo.findOneBy({ ref: 'QW-2024-001' });
  if (existingClient) {
    console.log('Seed de données déjà effectué, abandon.');
    return;
  }

  // ── Clients (KYC fusionné) ────────────────────────────────────────────
  // Couvre chaque valeur de StatutClient / StatutKyc / ScreeningStatut / TypeEntite au moins une fois.
  const clientDurand = await clientRepo.save(
    clientRepo.create({
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
    }),
  );

  const clientBernard = await clientRepo.save(
    clientRepo.create({
      ref: 'QW-2024-002',
      raisonSociale: 'Sophie Bernard',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      pays: 'France',
      activitePrincipale: 'Conseil en management',
      formeJuridique: 'SAS',
      // PPE + screening en alerte + CA > 500 k€ → score automatique MOYEN.
      chiffreAffaires: 600000,
      statut: StatutClient.ACTIF,
      kycStatut: StatutKyc.INCOMPLET,
      ppe: true,
      screeningStatut: ScreeningStatut.ALERTE,
      createdBy: collaborateur,
    }),
  );

  const clientMendes = await clientRepo.save(
    clientRepo.create({
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
    }),
  );

  const clientLpHolding = await clientRepo.save(
    clientRepo.create({
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
      uboSaisi: true, // bénéficiaire effectif seedé plus bas (Pierre Lambert)
      screeningStatut: ScreeningStatut.ALERTE,
      kycCompletedAt: new Date(),
      kycValidatedBy: admin,
      createdBy: admin,
    }),
  );

  const clientAtelierCreatif = await clientRepo.save(
    clientRepo.create({
      ref: 'QW-2024-005',
      raisonSociale: 'Atelier Créatif SARL',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      pays: 'France',
      activitePrincipale: 'Design graphique',
      formeJuridique: 'SARL',
      chiffreAffaires: 60000,
      statut: StatutClient.INACTIF,
      kycStatut: StatutKyc.COMPLET,
      ppe: false,
      screeningStatut: ScreeningStatut.OK,
      createdBy: collaborateur,
    }),
  );

  const clientJulienRoche = await clientRepo.save(
    clientRepo.create({
      ref: 'QW-2024-006',
      raisonSociale: 'Julien Roche',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      pays: 'France',
      activitePrincipale: 'Profession libérale',
      formeJuridique: 'EI',
      chiffreAffaires: 75000,
      statut: StatutClient.ACTIF,
      kycStatut: StatutKyc.EXPIRE,
      ppe: false,
      screeningStatut: ScreeningStatut.NON_EFFECTUE,
      createdBy: collaborateur,
    }),
  );

  // Client issu d'une conversion de prospect (cf. section Prospects ci-dessous).
  const clientConvergence = await clientRepo.save(
    clientRepo.create({
      ref: 'QW-2024-007',
      raisonSociale: 'Convergence Digitale',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      pays: 'France',
      activitePrincipale: 'Édition de logiciels',
      formeJuridique: 'SAS',
      chiffreAffaires: 320000,
      statut: StatutClient.ACTIF,
      kycStatut: StatutKyc.INCOMPLET,
      ppe: false,
      screeningStatut: ScreeningStatut.NON_EFFECTUE,
      createdBy: responsable,
    }),
  );

  console.log(
    '✓ Clients créés (tous les statuts KYC/screening/statut représentés)',
  );

  // ── Prospects ───────────────────────────────────────────────────────────
  // Couvre chaque étape du Kanban (StatutKanban) au moins une fois.
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

  const prospectTechnoInnov = await prospectRepo.save(
    prospectRepo.create({
      ref: 'PR-2024-003',
      nom: 'Techno Innov SAS',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      statutKanban: StatutKanban.OPPORTUNITE,
      activite: 'Édition de logiciels',
      chiffreAffaires: 210000,
      createdBy: collaborateur,
      assignedTo: collaborateur,
    }),
  );

  const prospectGlobalTrade = await prospectRepo.save(
    prospectRepo.create({
      ref: 'PR-2024-004',
      nom: 'Global Trade Ltd',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      pays: 'Îles Caïmans',
      statutKanban: StatutKanban.LAB,
      activite: 'Négoce international',
      chiffreAffaires: 2500000,
      createdBy: responsable,
      assignedTo: responsable,
    }),
  );

  const prospectCabinetFiscaliste = await prospectRepo.save(
    prospectRepo.create({
      ref: 'PR-2024-005',
      nom: 'Cabinet Fiscaliste Petit & Associés',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      statutKanban: StatutKanban.PREPARATION,
      activite: 'Conseil fiscal',
      chiffreAffaires: 340000,
      createdBy: collaborateur,
      assignedTo: collaborateur,
    }),
  );

  // Prospect historique déjà converti, lié au client `clientConvergence`.
  const prospectConvergence = await prospectRepo.save(
    prospectRepo.create({
      ref: 'PR-2024-006',
      nom: 'Convergence Digitale',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      statutKanban: StatutKanban.CONVERTI,
      activite: 'Édition de logiciels',
      chiffreAffaires: 320000,
      createdBy: responsable,
      assignedTo: responsable,
      client: clientConvergence,
    }),
  );

  const prospectSocieteDouteuse = await prospectRepo.save(
    prospectRepo.create({
      ref: 'PR-2024-007',
      nom: 'Société Douteuse Ltd',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      pays: 'Panama',
      statutKanban: StatutKanban.REFUSE,
      motifRefus: 'Bénéficiaire effectif non identifiable, refus LAB-FT',
      activite: 'Conseil offshore',
      createdBy: responsable,
      assignedTo: responsable,
    }),
  );

  console.log('✓ Prospects créés (tous les statuts Kanban représentés)');

  // ── Questionnaires d'acceptation ─────────────────────────────────────
  // Couvre chaque valeur de StatutQuestionnaire au moins une fois.
  await questionnaireRepo.save(
    questionnaireRepo.create({
      prospect: prospectAbc,
      statut: StatutQuestionnaire.EN_COURS,
      reponses: { activiteLicite: true, clientFinal: 'particuliers' },
      createdBy: collaborateur,
    }),
  );

  await questionnaireRepo.save(
    questionnaireRepo.create({
      prospect: prospectTechnoInnov,
      statut: StatutQuestionnaire.VALIDE,
      // Aucun facteur de risque D1-D5 déclenché → score automatique FAIBLE.
      reponses: { D1_11: 'non' },
      validatedAt: new Date(),
      validatedBy: responsable,
      createdBy: collaborateur,
    }),
  );

  await questionnaireRepo.save(
    questionnaireRepo.create({
      prospect: prospectGlobalTrade,
      statut: StatutQuestionnaire.VALIDE,
      // PPE + pays GAFI + secteur sensible (crypto) + espèces + structure
      // complexe → cumul de critères menant à un score automatique ELEVE.
      reponses: {
        D1_11: 'oui',
        D3_1_1: 'oui',
        D2_26: 'oui',
        D2_20: 'oui',
        D1_4: 'oui',
      },
      validatedAt: new Date(),
      validatedBy: admin,
      createdBy: responsable,
    }),
  );

  await questionnaireRepo.save(
    questionnaireRepo.create({
      prospect: prospectCabinetFiscaliste,
      statut: StatutQuestionnaire.VALIDE,
      // PPE + espèces + structure complexe + pays tiers → score automatique MOYEN.
      reponses: {
        D1_11: 'oui',
        D2_20: 'oui',
        D1_4: 'oui',
        D3_2_1: 'oui',
      },
      validatedAt: new Date(),
      validatedBy: responsable,
      createdBy: collaborateur,
    }),
  );

  await questionnaireRepo.save(
    questionnaireRepo.create({
      prospect: prospectConvergence,
      statut: StatutQuestionnaire.VALIDE,
      // Dossier propre, converti sans réserve → score automatique FAIBLE.
      reponses: { D1_11: 'non' },
      validatedAt: new Date('2024-09-15'),
      validatedBy: responsable,
      createdBy: responsable,
    }),
  );

  await questionnaireRepo.save(
    questionnaireRepo.create({
      prospect: prospectSocieteDouteuse,
      statut: StatutQuestionnaire.REFUSE,
      reponses: { activiteLicite: false },
      motifRefus: 'Bénéficiaire effectif non identifiable, refus LAB-FT',
      createdBy: responsable,
    }),
  );

  console.log(
    '✓ Questionnaires d’acceptation créés (tous les statuts représentés)',
  );

  // ── Bénéficiaires effectifs ──────────────────────────────────
  // Nationalité étrangère (personne morale) : contribue au critère "UBO à
  // l'étranger" du score automatique de clientLpHolding.
  await beneficiaireRepo.save(
    beneficiaireRepo.create({
      prenom: 'Pierre',
      nom: 'Lambert',
      nationalite: 'Suisse',
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

  // ── Scores de risque ────────────────────────────────────────────────────
  // Calculés via les mêmes fonctions pures que le calcul automatique réel
  // (auto-score.util.ts), pour rester cohérents avec les données ci-dessus —
  // le seed contourne la couche service (pas d'appel HTTP), donc le recalcul
  // automatique habituellement déclenché par ClientsService/QuestionnairesService
  // ne se produit pas ici et doit être simulé explicitement.
  // Couvre FAIBLE/MOYEN/ELEVE pour des clients ET des prospects, un historique
  // (plusieurs scores dans le temps) et le cas "aucun score calculé" (Mendes,
  // Atelier Créatif, Julien Roche côté clients ; Marie Petit, ABC, Société
  // Douteuse côté prospects — volontairement sans score).

  // Durand : aucun facteur de risque → FAIBLE.
  const scoreDurand = computeAutoScore({
    flags: flagsFromClient({
      ppe: clientDurand.ppe,
      typeEntite: clientDurand.typeEntite,
      screeningStatut: clientDurand.screeningStatut,
      beneficiaires: [],
    }),
    chiffreAffaires: clientDurand.chiffreAffaires,
  });
  await scoreRepo.save(
    scoreRepo.create({
      ...scoreDurand,
      client: clientDurand,
      calculatedBy: responsable,
    }),
  );

  // Bernard : PPE + screening en alerte + CA > 500 k€ → MOYEN.
  const scoreBernard = computeAutoScore({
    flags: flagsFromClient({
      ppe: clientBernard.ppe,
      typeEntite: clientBernard.typeEntite,
      screeningStatut: clientBernard.screeningStatut,
      beneficiaires: [],
    }),
    chiffreAffaires: clientBernard.chiffreAffaires,
  });
  await scoreRepo.save(
    scoreRepo.create({
      ...scoreBernard,
      client: clientBernard,
      calculatedBy: collaborateur,
    }),
  );

  // LP Holding : historique — évaluation initiale avant le screening et le
  // bénéficiaire effectif étranger (FAIBLE), puis recalcul avec les données
  // complètes (MOYEN).
  const scoreLpHoldingAncien = computeAutoScore({
    flags: flagsFromClient({
      ppe: clientLpHolding.ppe,
      typeEntite: clientLpHolding.typeEntite,
      screeningStatut: ScreeningStatut.NON_EFFECTUE,
      beneficiaires: [],
    }),
    chiffreAffaires: clientLpHolding.chiffreAffaires,
  });
  const scoreLpHoldingAncienEntity = scoreRepo.create({
    ...scoreLpHoldingAncien,
    client: clientLpHolding,
    calculatedBy: responsable,
  });
  scoreLpHoldingAncienEntity.createdAt = new Date('2024-06-01');
  await scoreRepo.save(scoreLpHoldingAncienEntity);

  const scoreLpHoldingActuel = computeAutoScore({
    flags: flagsFromClient({
      ppe: clientLpHolding.ppe,
      typeEntite: clientLpHolding.typeEntite,
      screeningStatut: clientLpHolding.screeningStatut,
      beneficiaires: [{ nationalite: 'Suisse' }],
    }),
    chiffreAffaires: clientLpHolding.chiffreAffaires,
  });
  await scoreRepo.save(
    scoreRepo.create({
      ...scoreLpHoldingActuel,
      client: clientLpHolding,
      calculatedBy: admin,
    }),
  );

  // Convergence : dossier propre, converti sans réserve → FAIBLE.
  const scoreConvergence = computeAutoScore({
    flags: flagsFromClient({
      ppe: clientConvergence.ppe,
      typeEntite: clientConvergence.typeEntite,
      screeningStatut: clientConvergence.screeningStatut,
      beneficiaires: [],
      questionnaireReponses: { D1_11: 'non' },
    }),
    chiffreAffaires: clientConvergence.chiffreAffaires,
  });
  await scoreRepo.save(
    scoreRepo.create({
      ...scoreConvergence,
      client: clientConvergence,
      calculatedBy: responsable,
    }),
  );

  // Prospects — calcul automatique depuis les réponses du questionnaire D1-D5
  // (voir la section Questionnaires ci-dessus pour le détail des réponses).
  const scoreTechnoInnov = computeAutoScore({
    flags: flagsFromQuestionnaire(
      { D1_11: 'non' },
      prospectTechnoInnov.typeEntite,
    ),
    chiffreAffaires: prospectTechnoInnov.chiffreAffaires,
  });
  await scoreRepo.save(
    scoreRepo.create({
      ...scoreTechnoInnov,
      prospect: prospectTechnoInnov,
      calculatedBy: collaborateur,
    }),
  );

  const scoreCabinetFiscaliste = computeAutoScore({
    flags: flagsFromQuestionnaire(
      { D1_11: 'oui', D2_20: 'oui', D1_4: 'oui', D3_2_1: 'oui' },
      prospectCabinetFiscaliste.typeEntite,
    ),
    chiffreAffaires: prospectCabinetFiscaliste.chiffreAffaires,
  });
  await scoreRepo.save(
    scoreRepo.create({
      ...scoreCabinetFiscaliste,
      prospect: prospectCabinetFiscaliste,
      calculatedBy: responsable,
    }),
  );

  const scoreGlobalTrade = computeAutoScore({
    flags: flagsFromQuestionnaire(
      {
        D1_11: 'oui',
        D3_1_1: 'oui',
        D2_26: 'oui',
        D2_20: 'oui',
        D1_4: 'oui',
      },
      prospectGlobalTrade.typeEntite,
    ),
    chiffreAffaires: prospectGlobalTrade.chiffreAffaires,
  });
  await scoreRepo.save(
    scoreRepo.create({
      ...scoreGlobalTrade,
      prospect: prospectGlobalTrade,
      calculatedBy: admin,
    }),
  );

  console.log(
    '✓ Scores de risque créés (FAIBLE/MOYEN/ELEVE + historique, clients et prospects)',
  );

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

  for (const client of [
    clientMendes,
    clientAtelierCreatif,
    clientJulienRoche,
  ]) {
    await auditRepo.save(
      auditRepo.create({
        action: AuditAction.CREATE,
        ressource: 'clients',
        ressourceId: client.id,
        details: { ref: client.ref },
        utilisateur: collaborateur,
      }),
    );
  }

  console.log('✓ Journal d’audit créé');
}

async function run() {
  await AppDataSource.initialize();

  const users = await seedUsers(AppDataSource);
  await seedData(AppDataSource, users);

  await AppDataSource.destroy();
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Erreur seed:data :', err);
    process.exit(1);
  });
}
