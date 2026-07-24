import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameLettreMissionS3KeyToCheminStockage1782300000000 implements MigrationInterface {
  name = 'RenameLettreMissionS3KeyToCheminStockage1782300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" RENAME COLUMN "s3Key" TO "cheminStockage"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" RENAME COLUMN "cheminStockage" TO "s3Key"`,
    );
  }
}
