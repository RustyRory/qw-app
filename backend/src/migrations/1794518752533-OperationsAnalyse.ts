import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperationsAnalyse1794518752533 implements MigrationInterface {
  name = 'OperationsAnalyse1794518752533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" ADD "analyseAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" ADD "motifClassement" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" ADD "id_analyse_par" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" ADD CONSTRAINT "FK_114c0fa412fcf13da96e2efec13" FOREIGN KEY ("id_analyse_par") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" DROP CONSTRAINT "FK_114c0fa412fcf13da96e2efec13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" DROP COLUMN "id_analyse_par"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" DROP COLUMN "motifClassement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_sensible" DROP COLUMN "analyseAt"`,
    );
  }
}
