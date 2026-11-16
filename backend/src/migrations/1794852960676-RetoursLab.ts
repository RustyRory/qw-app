import { MigrationInterface, QueryRunner } from 'typeorm';

export class RetoursLab1794852960676 implements MigrationInterface {
  name = 'RetoursLab1794852960676';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."acceptation_mission_statut_enum" AS ENUM('EN_COURS', 'ACCEPTEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "acceptation_mission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reponses" jsonb NOT NULL DEFAULT '{}', "statut" "public"."acceptation_mission_statut_enum" NOT NULL DEFAULT 'EN_COURS', "decideeAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_prospect" uuid, "id_client" uuid, "id_decidee_par" uuid, "id_rempli_par" uuid, CONSTRAINT "PK_b410b60c92a1111742057aebb33" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "formuleAppel" character varying(30) NOT NULL DEFAULT 'Madame, Monsieur,'`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "repartitionCapital" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "dateClotureExercice" date`,
    );
    await queryRunner.query(`ALTER TABLE "missions" ADD "dateEffet" date`);
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "periodeHonoraires" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "fraisDeboursPct" numeric(5,2) NOT NULL DEFAULT '5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "rythmeFacturation" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "rythmePaiement" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "euid" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "euid" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."documents_type_enum" RENAME TO "documents_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_type_enum" AS ENUM('PIECE_IDENTITE', 'PIECE_IDENTITE_DIRIGEANT', 'PIECE_IDENTITE_BENEFICIAIRE', 'JUSTIFICATIF_DOMICILE', 'KBIS', 'EXTRAIT_INPI', 'AVIS_SIRENE', 'LISTE_ACTIONNAIRES', 'STATUTS', 'LISTE_UBO', 'ATTESTATION_PPE', 'JUSTIFICATIF_FONDS', 'LETTRE_MISSION', 'RAPPORT', 'ANNEXE', 'AUTRE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" TYPE "public"."documents_type_enum" USING "type"::"text"::"public"."documents_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" SET DEFAULT 'AUTRE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."documents_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."obligations_type_enum" RENAME TO "obligations_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."obligations_type_enum" AS ENUM('KYC_VERIFICATION', 'EVALUATION_RISQUE', 'MISE_A_JOUR_DOCS', 'VALIDATION_RELATION', 'LETTRE_MISSION', 'VALIDATION_LETTRE_MISSION', 'SIGNATURE_LETTRE_MISSION', 'INFORMATIONS_A_COMPLETER', 'QUESTIONNAIRES_A_COMPLETER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "obligations" ALTER COLUMN "type" TYPE "public"."obligations_type_enum" USING "type"::"text"::"public"."obligations_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."obligations_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" ADD CONSTRAINT "FK_7b4202ff4137fde25d9f9ecd552" FOREIGN KEY ("id_prospect") REFERENCES "prospects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" ADD CONSTRAINT "FK_66f887ba1122905f90193b23277" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" ADD CONSTRAINT "FK_d50d82880c30be5d64ca72cfe67" FOREIGN KEY ("id_decidee_par") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" ADD CONSTRAINT "FK_04707c9a22566afaf4d2a39b040" FOREIGN KEY ("id_rempli_par") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" DROP CONSTRAINT "FK_04707c9a22566afaf4d2a39b040"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" DROP CONSTRAINT "FK_d50d82880c30be5d64ca72cfe67"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" DROP CONSTRAINT "FK_66f887ba1122905f90193b23277"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acceptation_mission" DROP CONSTRAINT "FK_7b4202ff4137fde25d9f9ecd552"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."obligations_type_enum_old" AS ENUM('KYC_VERIFICATION', 'EVALUATION_RISQUE', 'MISE_A_JOUR_DOCS', 'VALIDATION_RELATION', 'LETTRE_MISSION', 'VALIDATION_LETTRE_MISSION', 'SIGNATURE_LETTRE_MISSION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "obligations" ALTER COLUMN "type" TYPE "public"."obligations_type_enum_old" USING "type"::"text"::"public"."obligations_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."obligations_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."obligations_type_enum_old" RENAME TO "obligations_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_type_enum_old" AS ENUM('PIECE_IDENTITE', 'PIECE_IDENTITE_DIRIGEANT', 'PIECE_IDENTITE_BENEFICIAIRE', 'JUSTIFICATIF_DOMICILE', 'KBIS', 'STATUTS', 'LISTE_UBO', 'ATTESTATION_PPE', 'JUSTIFICATIF_FONDS', 'LETTRE_MISSION', 'RAPPORT', 'ANNEXE', 'AUTRE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" TYPE "public"."documents_type_enum_old" USING "type"::"text"::"public"."documents_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" SET DEFAULT 'AUTRE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."documents_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."documents_type_enum_old" RENAME TO "documents_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "prospects" DROP COLUMN "euid"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "euid"`);
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "rythmePaiement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "rythmeFacturation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "fraisDeboursPct"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "periodeHonoraires"`,
    );
    await queryRunner.query(`ALTER TABLE "missions" DROP COLUMN "dateEffet"`);
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "dateClotureExercice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "repartitionCapital"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "formuleAppel"`,
    );
    await queryRunner.query(`DROP TABLE "acceptation_mission"`);
    await queryRunner.query(
      `DROP TYPE "public"."acceptation_mission_statut_enum"`,
    );
  }
}
