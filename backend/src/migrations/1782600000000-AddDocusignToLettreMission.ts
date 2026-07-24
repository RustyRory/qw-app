import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocusignToLettreMission1782600000000 implements MigrationInterface {
  name = 'AddDocusignToLettreMission1782600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."lettre_mission_docusignstatut_enum" AS ENUM('ENVOYE', 'LIVRE', 'SIGNE', 'REFUSE', 'ANNULE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "signeeParClientAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignEnvelopeId" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignStatut" "public"."lettre_mission_docusignstatut_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignDestinataireEmail" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignDestinataireNom" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignEnvoyeAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignEnvoyeAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignDestinataireNom"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignDestinataireEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignStatut"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignEnvelopeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "signeeParClientAt"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lettre_mission_docusignstatut_enum"`,
    );
  }
}
