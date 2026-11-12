import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProspectsConversion1794513573692 implements MigrationInterface {
  name = 'ProspectsConversion1794513573692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ADD "id_prospect" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" ADD "id_client" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" DROP CONSTRAINT "FK_54494bbd7dce153d3772a5aba9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ALTER COLUMN "id_client" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ADD CONSTRAINT "CHK_beneficiaire_client_xor_prospect" CHECK (("id_client" IS NULL) <> ("id_prospect" IS NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ADD CONSTRAINT "FK_54494bbd7dce153d3772a5aba9e" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ADD CONSTRAINT "FK_e85d4f8e9bc2b92fce46c3893bd" FOREIGN KEY ("id_prospect") REFERENCES "prospects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" ADD CONSTRAINT "FK_c0d63a5a267711ff418104d20c6" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" DROP CONSTRAINT "FK_c0d63a5a267711ff418104d20c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" DROP CONSTRAINT "FK_e85d4f8e9bc2b92fce46c3893bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" DROP CONSTRAINT "FK_54494bbd7dce153d3772a5aba9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" DROP CONSTRAINT "CHK_beneficiaire_client_xor_prospect"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ALTER COLUMN "id_client" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" ADD CONSTRAINT "FK_54494bbd7dce153d3772a5aba9e" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_acceptation" DROP COLUMN "id_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beneficiaire_effectif" DROP COLUMN "id_prospect"`,
    );
  }
}
