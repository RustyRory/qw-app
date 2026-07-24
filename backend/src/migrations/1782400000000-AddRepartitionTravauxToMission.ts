import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRepartitionTravauxToMission1782400000000 implements MigrationInterface {
  name = 'AddRepartitionTravauxToMission1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "repartitionTravaux" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "repartitionTravaux"`,
    );
  }
}
