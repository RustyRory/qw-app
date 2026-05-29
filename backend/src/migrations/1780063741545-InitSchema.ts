import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1780063741545 implements MigrationInterface {
  name = 'InitSchema1780063741545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "kyc" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nationalite" character varying(100), "paysResidence" character varying(100), "secteurActivite" character varying(200), "formeJuridique" character varying(100), "estPep" boolean NOT NULL DEFAULT false, "paysHautRisque" boolean NOT NULL DEFAULT false, "chiffreAffaires" numeric(15,2), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, CONSTRAINT "REL_b3ba889abc1e8c963dc3506c12" UNIQUE ("id_client"), CONSTRAINT "PK_84ab2e81ea9700d29dda719f3be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nomFichier" character varying(255) NOT NULL, "cheminStockage" character varying(500) NOT NULL, "typeMime" character varying(100) NOT NULL, "taille" bigint NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid NOT NULL, "id_utilisateur" uuid NOT NULL, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_id_client" ON "documents" ("id_client") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_scores_niveau_enum" AS ENUM('faible', 'moyen', 'eleve')`,
    );
    await queryRunner.query(
      `CREATE TABLE "risk_scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" smallint NOT NULL, "niveau" "public"."risk_scores_niveau_enum" NOT NULL, "details" jsonb, "calculatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "id_client" uuid NOT NULL, "id_utilisateur" uuid NOT NULL, CONSTRAINT "PK_ac76f1fbfc456572b6ed51abe8f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_risk_scores_id_client" ON "risk_scores" ("id_client") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clients_statut_enum" AS ENUM('en_cours', 'valide', 'rejete')`,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reference" character varying(50) NOT NULL, "prenom" character varying(100) NOT NULL, "nom" character varying(100) NOT NULL, "raisonSociale" character varying(200), "email" character varying(255), "telephone" character varying(20), "statut" "public"."clients_statut_enum" NOT NULL DEFAULT 'en_cours', "deletedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_createur" uuid NOT NULL, "id_validateur" uuid, CONSTRAINT "UQ_c7edaf5401587567318dc328cc2" UNIQUE ("reference"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clients_id_createur" ON "clients" ("id_createur") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clients_deleted_at" ON "clients" ("deletedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clients_statut" ON "clients" ("statut") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'READ', 'VALIDATE', 'LOGIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."audit_logs_action_enum" NOT NULL, "entiteType" character varying(50) NOT NULL, "entiteId" uuid NOT NULL, "details" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_utilisateur" uuid NOT NULL, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_entite" ON "audit_logs" ("entiteType", "entiteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_id_utilisateur" ON "audit_logs" ("id_utilisateur") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('collaborateur', 'responsable', 'expert-comptable', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'collaborateur', "prenom" character varying(100) NOT NULL, "nom" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD CONSTRAINT "FK_b3ba889abc1e8c963dc3506c128" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_057fc8ca0281c457b2136d322a5" FOREIGN KEY ("id_utilisateur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_scores" ADD CONSTRAINT "FK_6ef3f80132b4535c2cf7f9f4af5" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_scores" ADD CONSTRAINT "FK_d5edc88bc1531c050bc791f31da" FOREIGN KEY ("id_utilisateur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_4b1ae8dfd705bf3d87daed97c3b" FOREIGN KEY ("id_createur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_a9d201c78afca2ef571867f03ed" FOREIGN KEY ("id_validateur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_c87bdfeec376b0470b3f8f8569f" FOREIGN KEY ("id_utilisateur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_c87bdfeec376b0470b3f8f8569f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_a9d201c78afca2ef571867f03ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_4b1ae8dfd705bf3d87daed97c3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_scores" DROP CONSTRAINT "FK_d5edc88bc1531c050bc791f31da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_scores" DROP CONSTRAINT "FK_6ef3f80132b4535c2cf7f9f4af5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_057fc8ca0281c457b2136d322a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP CONSTRAINT "FK_b3ba889abc1e8c963dc3506c128"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_audit_logs_id_utilisateur"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_entite"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_created_at"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_clients_statut"`);
    await queryRunner.query(`DROP INDEX "public"."idx_clients_deleted_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_clients_id_createur"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TYPE "public"."clients_statut_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_risk_scores_id_client"`);
    await queryRunner.query(`DROP TABLE "risk_scores"`);
    await queryRunner.query(`DROP TYPE "public"."risk_scores_niveau_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_documents_id_client"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TABLE "kyc"`);
  }
}
