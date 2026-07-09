import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2Schema1782000000000 implements MigrationInterface {
  name = 'V2Schema1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. users
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('COLLABORATEUR', 'RESPONSABLE', 'EXPERT_COMPTABLE', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'COLLABORATEUR', "prenom" character varying(100) NOT NULL, "nom" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );

    // 2. prospects
    await queryRunner.query(
      `CREATE TYPE "public"."prospects_typeentite_enum" AS ENUM('PERSONNE_PHYSIQUE', 'PERSONNE_MORALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."prospects_statutkanban_enum" AS ENUM('PRISE_CONTACT', 'DECOUVERTE', 'OPPORTUNITE', 'LAB', 'PREPARATION', 'CONVERTI', 'REFUSE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "prospects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ref" character varying(20) NOT NULL, "siret" character varying(14), "nom" character varying(255) NOT NULL, "email" character varying(255), "telephone" character varying(20), "typeEntite" "public"."prospects_typeentite_enum" NOT NULL DEFAULT 'PERSONNE_MORALE', "statutKanban" "public"."prospects_statutkanban_enum" NOT NULL DEFAULT 'PRISE_CONTACT', "motifRefus" text, "activite" character varying(255), "codeNaf" character varying(10), "adresse" text, "ville" character varying(100), "codePostal" character varying(10), "pays" character varying(100) NOT NULL DEFAULT 'France', "chiffreAffaires" numeric(15,2), "effectif" integer, "notes" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "id_createur" uuid NOT NULL, "id_assigned" uuid, "id_client" uuid, CONSTRAINT "UQ_427813f0c76a7939f1532b2ef37" UNIQUE ("ref"), CONSTRAINT "REL_4fd4295709e8a75d071b820d25" UNIQUE ("id_client"), CONSTRAINT "PK_9fc60d8f29db14b861e3c96568e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prospect_siret" ON "prospects" ("siret") WHERE "siret" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prospect_statut" ON "prospects" ("statutKanban") WHERE "deletedAt" IS NULL`,
    );

    // 3. questionnaire_acceptation
    await queryRunner.query(
      `CREATE TYPE "public"."questionnaire_acceptation_statut_enum" AS ENUM('EN_COURS', 'VALIDE', 'REFUSE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "questionnaire_acceptation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "statut" "public"."questionnaire_acceptation_statut_enum" NOT NULL DEFAULT 'EN_COURS', "reponses" jsonb, "motifRefus" text, "validatedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_prospect" uuid NOT NULL, "id_validated_by" uuid, "id_createur" uuid NOT NULL, CONSTRAINT "REL_18a24e09ca2e8f9c718dc0a7a9" UNIQUE ("id_prospect"), CONSTRAINT "PK_c410308018bf31928b4b1b88d74" PRIMARY KEY ("id"))`,
    );

    // 4. clients
    await queryRunner.query(
      `CREATE TYPE "public"."clients_typeentite_enum" AS ENUM('PERSONNE_PHYSIQUE', 'PERSONNE_MORALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clients_statut_enum" AS ENUM('ACTIF', 'INACTIF', 'RESILIE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clients_kycstatut_enum" AS ENUM('INCOMPLET', 'COMPLET', 'VALIDE', 'EXPIRE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clients_screeningstatut_enum" AS ENUM('NON_EFFECTUE', 'OK', 'ALERTE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ref" character varying(20) NOT NULL, "siret" character varying(14), "siren" character varying(9), "raisonSociale" character varying(255) NOT NULL, "typeEntite" "public"."clients_typeentite_enum" NOT NULL, "formeJuridique" character varying(100), "codeNaf" character varying(10), "activitePrincipale" character varying(255), "dateCreationEntreprise" date, "adresseSiege" text, "ville" character varying(100), "codePostal" character varying(10), "pays" character varying(100) NOT NULL DEFAULT 'France', "chiffreAffaires" numeric(15,2), "effectif" integer, "natureMission" text, "statut" "public"."clients_statut_enum" NOT NULL DEFAULT 'ACTIF', "sireneUpdatedAt" TIMESTAMP WITH TIME ZONE, "kycStatut" "public"."clients_kycstatut_enum" NOT NULL DEFAULT 'INCOMPLET', "ppe" boolean NOT NULL DEFAULT false, "ppeDetail" text, "uboSaisi" boolean NOT NULL DEFAULT false, "screeningStatut" "public"."clients_screeningstatut_enum" NOT NULL DEFAULT 'NON_EFFECTUE', "screeningDate" TIMESTAMP WITH TIME ZONE, "kycCompletedAt" TIMESTAMP WITH TIME ZONE, "deletedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_kyc_validator" uuid, "id_createur" uuid NOT NULL, CONSTRAINT "UQ_cb6f8ce5e3b9bb90ac4f9bc833e" UNIQUE ("ref"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_client_siret" ON "clients" ("siret") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_client_statut" ON "clients" ("statut") `,
    );

    // 5. beneficiaire_effectif
    await queryRunner.query(
      `CREATE TABLE "beneficiaire_effectif" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prenom" character varying(50), "nom" character varying(100) NOT NULL, "dateNaissance" date, "nationalite" character varying(100), "adresse" text, "pourcentageDetention" numeric(5,2) NOT NULL, "ppe" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, CONSTRAINT "PK_69f92e7e749bcadb17336676999" PRIMARY KEY ("id"))`,
    );

    // 6. contacts
    await queryRunner.query(
      `CREATE TYPE "public"."contacts_type_enum" AS ENUM('INTERVENANT', 'AVOCAT', 'COMMISSAIRE_COMPTES', 'NOTAIRE', 'AUTRE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prenom" character varying(50), "nom" character varying(100) NOT NULL, "email" character varying(255), "telephone" character varying(20), "type" "public"."contacts_type_enum" NOT NULL DEFAULT 'AUTRE', "roleDetail" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );

    // 7. missions
    await queryRunner.query(
      `CREATE TYPE "public"."missions_type_enum" AS ENUM('COMPTABILITE', 'AUDIT', 'CONSEIL', 'JURIDIQUE', 'AUTRE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missions_statut_enum" AS ENUM('EN_COURS', 'SUSPENDUE', 'TERMINEE', 'RESILIEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "missions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."missions_type_enum" NOT NULL, "description" text, "statut" "public"."missions_statut_enum" NOT NULL DEFAULT 'EN_COURS', "dateDebut" date NOT NULL, "dateFin" date, "honoraires" numeric(10,2), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, "id_createur" uuid NOT NULL, CONSTRAINT "PK_787aebb1ac5923c9904043c6309" PRIMARY KEY ("id"))`,
    );

    // 8. documents
    await queryRunner.query(
      `CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nomFichier" character varying(255) NOT NULL, "cheminStockage" character varying(500) NOT NULL, "typeMime" character varying(100) NOT NULL, "taille" bigint NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, "id_utilisateur" uuid NOT NULL, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_id_client" ON "documents" ("id_client") `,
    );

    // 9. lettre_mission
    await queryRunner.query(
      `CREATE TABLE "lettre_mission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL DEFAULT '1', "contenu" jsonb NOT NULL, "signeeParExpert" boolean NOT NULL DEFAULT false, "signeeAt" TIMESTAMP WITH TIME ZONE, "s3Key" character varying(500), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_mission" uuid NOT NULL, "id_signataire" uuid, CONSTRAINT "PK_7803c1843dadf98e3943d8d4aa2" PRIMARY KEY ("id"))`,
    );

    // 10. score_risque
    await queryRunner.query(
      `CREATE TYPE "public"."score_risque_niveau_enum" AS ENUM('FAIBLE', 'MOYEN', 'ELEVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "score_risque" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" integer NOT NULL, "niveau" "public"."score_risque_niveau_enum" NOT NULL, "reponses" jsonb NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, "id_calculated_by" uuid NOT NULL, CONSTRAINT "PK_d14767b930506c76182242dca44" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_score_client_date" ON "score_risque" ("id_client", "createdAt") `,
    );

    // 11. planning_etape
    await queryRunner.query(
      `CREATE TYPE "public"."planning_etape_type_enum" AS ENUM('REGLEMENTAIRE', 'MANUELLE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."planning_etape_statut_enum" AS ENUM('A_FAIRE', 'EN_COURS', 'FAIT', 'ANNULEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "planning_etape" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titre" character varying(255) NOT NULL, "description" text, "type" "public"."planning_etape_type_enum" NOT NULL, "statut" "public"."planning_etape_statut_enum" NOT NULL DEFAULT 'A_FAIRE', "dateEcheance" date, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, "id_completed_by" uuid, "id_assigned_to" uuid, "id_createur" uuid NOT NULL, CONSTRAINT "PK_e8f325d58670d83c435d605ba13" PRIMARY KEY ("id"))`,
    );

    // 12. obligations
    await queryRunner.query(
      `CREATE TYPE "public"."obligations_type_enum" AS ENUM('KYC_VERIFICATION', 'EVALUATION_RISQUE', 'MISE_A_JOUR_DOCS', 'VALIDATION_RELATION', 'LETTRE_MISSION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."obligations_statut_enum" AS ENUM('A_FAIRE', 'FAIT', 'EN_RETARD', 'EXPIRE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "obligations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."obligations_type_enum" NOT NULL, "statut" "public"."obligations_statut_enum" NOT NULL DEFAULT 'A_FAIRE', "dateEcheance" date, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, CONSTRAINT "PK_6e661b1b461253d2bf5d57e518d" PRIMARY KEY ("id"))`,
    );

    // 13. operation_sensible
    await queryRunner.query(
      `CREATE TYPE "public"."operation_sensible_type_enum" AS ENUM('SANS_JUSTIFICATION', 'COMPLEXE', 'SANS_OBJET_LICITE', 'INHABITUELLE', 'ECONOMIE_VIRTUELLE', 'ESPECES', 'AUTRE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operation_sensible_statut_enum" AS ENUM('SIGNALEE', 'EN_ANALYSE', 'CLASSEE', 'TRACFIN_DECLARE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "operation_sensible" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."operation_sensible_type_enum" NOT NULL, "description" text NOT NULL, "montant" numeric(15,2), "devise" character varying(3), "statut" "public"."operation_sensible_statut_enum" NOT NULL DEFAULT 'SIGNALEE', "tracfinDate" TIMESTAMP WITH TIME ZONE, "validatedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, "id_validated_by" uuid, "id_signale_by" uuid NOT NULL, CONSTRAINT "PK_d5d71604f012a53b0ffe104cabc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_operation_statut" ON "operation_sensible" ("id_client", "statut") `,
    );

    // 14. audit_logs
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'READ', 'VALIDATE', 'LOGIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."audit_logs_action_enum" NOT NULL, "ressource" character varying(50) NOT NULL, "ressourceId" uuid NOT NULL, "details" jsonb, "ipAddress" character varying(45), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_utilisateur" uuid NOT NULL, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_user" ON "audit_logs" ("id_utilisateur") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_ressource" ON "audit_logs" ("ressource", "ressourceId") `,
    );

    // Foreign keys (ajoutées après la création des 14 tables)
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD CONSTRAINT "FK_b64ba0db606523cf0d471830c2f" FOREIGN KEY ("id_createur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD CONSTRAINT "FK_45dbd1627714bf50c36f12de3ed" FOREIGN KEY ("id_assigned") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD CONSTRAINT "FK_4fd4295709e8a75d071b820d25a" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" ADD CONSTRAINT "FK_18a24e09ca2e8f9c718dc0a7a95" FOREIGN KEY ("id_prospect") REFERENCES "prospects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" ADD CONSTRAINT "FK_263bbf3b72b0ee778e81f651ef2" FOREIGN KEY ("id_validated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" ADD CONSTRAINT "FK_c808185b531b518faa39450315f" FOREIGN KEY ("id_createur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_86460fcc5e404581e3a4f24c55c" FOREIGN KEY ("id_kyc_validator") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_4b1ae8dfd705bf3d87daed97c3b" FOREIGN KEY ("id_createur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ADD CONSTRAINT "FK_54494bbd7dce153d3772a5aba9e" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_9fcb5ee53f6a49d4c1749a8afc0" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD CONSTRAINT "FK_65c703dfe3b01166a22fe5f94ae" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD CONSTRAINT "FK_e6f7ff1df7519484efc5fda6645" FOREIGN KEY ("id_createur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_057fc8ca0281c457b2136d322a5" FOREIGN KEY ("id_utilisateur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD CONSTRAINT "FK_d1bfe8971099902c089f1fb2d64" FOREIGN KEY ("id_mission") REFERENCES "missions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD CONSTRAINT "FK_d86f70db52d9b500c4a246a6b74" FOREIGN KEY ("id_signataire") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" ADD CONSTRAINT "FK_f757b9f5433c2d614d0529cd982" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" ADD CONSTRAINT "FK_0a43e0f1aba7ca3fc8cb663ac81" FOREIGN KEY ("id_calculated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" ADD CONSTRAINT "FK_6169e29df14d7cf7f36fd640c2e" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" ADD CONSTRAINT "FK_a68a8f341a6476b9d24e5699796" FOREIGN KEY ("id_completed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" ADD CONSTRAINT "FK_ce9701443c50bde65201292db14" FOREIGN KEY ("id_assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" ADD CONSTRAINT "FK_7ed82480e7b10a4806837d8f085" FOREIGN KEY ("id_createur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "obligations" ADD CONSTRAINT "FK_0065691a5840c0964dc9b37927a" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" ADD CONSTRAINT "FK_0f0804090568b5a57c825c58242" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" ADD CONSTRAINT "FK_98aa319ac1129ab5d7e01a7076e" FOREIGN KEY ("id_validated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" ADD CONSTRAINT "FK_a9936cf790419b1f1387ad2bf40" FOREIGN KEY ("id_signale_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_c87bdfeec376b0470b3f8f8569f" FOREIGN KEY ("id_utilisateur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop des FK
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_c87bdfeec376b0470b3f8f8569f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" DROP CONSTRAINT "FK_a9936cf790419b1f1387ad2bf40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" DROP CONSTRAINT "FK_98aa319ac1129ab5d7e01a7076e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" DROP CONSTRAINT "FK_0f0804090568b5a57c825c58242"`,
    );
    await queryRunner.query(
      `ALTER TABLE "obligations" DROP CONSTRAINT "FK_0065691a5840c0964dc9b37927a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" DROP CONSTRAINT "FK_7ed82480e7b10a4806837d8f085"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" DROP CONSTRAINT "FK_ce9701443c50bde65201292db14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" DROP CONSTRAINT "FK_a68a8f341a6476b9d24e5699796"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_etape" DROP CONSTRAINT "FK_6169e29df14d7cf7f36fd640c2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" DROP CONSTRAINT "FK_0a43e0f1aba7ca3fc8cb663ac81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" DROP CONSTRAINT "FK_f757b9f5433c2d614d0529cd982"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP CONSTRAINT "FK_d86f70db52d9b500c4a246a6b74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP CONSTRAINT "FK_d1bfe8971099902c089f1fb2d64"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_057fc8ca0281c457b2136d322a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP CONSTRAINT "FK_e6f7ff1df7519484efc5fda6645"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP CONSTRAINT "FK_65c703dfe3b01166a22fe5f94ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_9fcb5ee53f6a49d4c1749a8afc0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" DROP CONSTRAINT "FK_54494bbd7dce153d3772a5aba9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_4b1ae8dfd705bf3d87daed97c3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_86460fcc5e404581e3a4f24c55c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" DROP CONSTRAINT "FK_c808185b531b518faa39450315f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" DROP CONSTRAINT "FK_263bbf3b72b0ee778e81f651ef2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" DROP CONSTRAINT "FK_18a24e09ca2e8f9c718dc0a7a95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP CONSTRAINT "FK_4fd4295709e8a75d071b820d25a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP CONSTRAINT "FK_45dbd1627714bf50c36f12de3ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP CONSTRAINT "FK_b64ba0db606523cf0d471830c2f"`,
    );

    // Drop des tables dans l'ordre inverse des FK (14 → 1)
    await queryRunner.query(`DROP INDEX "public"."idx_audit_ressource"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_user"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);

    await queryRunner.query(`DROP INDEX "public"."idx_operation_statut"`);
    await queryRunner.query(`DROP TABLE "operation_sensible"`);
    await queryRunner.query(
      `DROP TYPE "public"."operation_sensible_statut_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."operation_sensible_type_enum"`,
    );

    await queryRunner.query(`DROP TABLE "obligations"`);
    await queryRunner.query(`DROP TYPE "public"."obligations_statut_enum"`);
    await queryRunner.query(`DROP TYPE "public"."obligations_type_enum"`);

    await queryRunner.query(`DROP TABLE "planning_etape"`);
    await queryRunner.query(`DROP TYPE "public"."planning_etape_statut_enum"`);
    await queryRunner.query(`DROP TYPE "public"."planning_etape_type_enum"`);

    await queryRunner.query(`DROP INDEX "public"."idx_score_client_date"`);
    await queryRunner.query(`DROP TABLE "score_risque"`);
    await queryRunner.query(`DROP TYPE "public"."score_risque_niveau_enum"`);

    await queryRunner.query(`DROP TABLE "lettre_mission"`);

    await queryRunner.query(`DROP INDEX "public"."idx_documents_id_client"`);
    await queryRunner.query(`DROP TABLE "documents"`);

    await queryRunner.query(`DROP TABLE "missions"`);
    await queryRunner.query(`DROP TYPE "public"."missions_statut_enum"`);
    await queryRunner.query(`DROP TYPE "public"."missions_type_enum"`);

    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TYPE "public"."contacts_type_enum"`);

    await queryRunner.query(`DROP TABLE "beneficiaire_effectif"`);

    await queryRunner.query(`DROP INDEX "public"."idx_client_statut"`);
    await queryRunner.query(`DROP INDEX "public"."idx_client_siret"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(
      `DROP TYPE "public"."clients_screeningstatut_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."clients_kycstatut_enum"`);
    await queryRunner.query(`DROP TYPE "public"."clients_statut_enum"`);
    await queryRunner.query(`DROP TYPE "public"."clients_typeentite_enum"`);

    await queryRunner.query(`DROP TABLE "questionnaire_acceptation"`);
    await queryRunner.query(
      `DROP TYPE "public"."questionnaire_acceptation_statut_enum"`,
    );

    await queryRunner.query(`DROP INDEX "public"."idx_prospect_statut"`);
    await queryRunner.query(`DROP INDEX "public"."idx_prospect_siret"`);
    await queryRunner.query(`DROP TABLE "prospects"`);
    await queryRunner.query(`DROP TYPE "public"."prospects_statutkanban_enum"`);
    await queryRunner.query(`DROP TYPE "public"."prospects_typeentite_enum"`);

    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
