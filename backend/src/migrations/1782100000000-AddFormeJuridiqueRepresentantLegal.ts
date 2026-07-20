import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormeJuridiqueRepresentantLegal1782100000000 implements MigrationInterface {
  name = 'AddFormeJuridiqueRepresentantLegal1782100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "formeJuridique" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "representantLegal" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "representantLegal" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "representantLegal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "representantLegal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "formeJuridique"`,
    );
  }
}
