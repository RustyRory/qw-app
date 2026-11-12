import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClientsFinRelation1794515235384 implements MigrationInterface {
  name = 'ClientsFinRelation1794515235384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "dateFinRelation" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "dateFinRelation"`,
    );
  }
}
