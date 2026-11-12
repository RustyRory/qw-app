import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScoringAjustement1794514999042 implements MigrationInterface {
  name = 'ScoringAjustement1794514999042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."clients_niveaurisquemanuel_enum" AS ENUM('FAIBLE', 'MOYEN', 'ELEVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "niveauRisqueManuel" "public"."clients_niveaurisquemanuel_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "justificationNiveauManuel" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "niveauManuelAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "id_niveau_manuel_par" uuid`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."prospects_niveaurisquemanuel_enum" AS ENUM('FAIBLE', 'MOYEN', 'ELEVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "niveauRisqueManuel" "public"."prospects_niveaurisquemanuel_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "justificationNiveauManuel" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "niveauManuelAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "id_niveau_manuel_par" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_e918e3c6da8e4e5485e700b91a1" FOREIGN KEY ("id_niveau_manuel_par") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD CONSTRAINT "FK_78f31314aab9b69644b970e3f0f" FOREIGN KEY ("id_niveau_manuel_par") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP CONSTRAINT "FK_78f31314aab9b69644b970e3f0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_e918e3c6da8e4e5485e700b91a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "id_niveau_manuel_par"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "niveauManuelAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "justificationNiveauManuel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "niveauRisqueManuel"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."prospects_niveaurisquemanuel_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "id_niveau_manuel_par"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "niveauManuelAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "justificationNiveauManuel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "niveauRisqueManuel"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."clients_niveaurisquemanuel_enum"`,
    );
  }
}
