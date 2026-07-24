import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignatureDataUriToUser1782500000000 implements MigrationInterface {
  name = 'AddSignatureDataUriToUser1782500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "signatureDataUri" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "signatureDataUri"`,
    );
  }
}
