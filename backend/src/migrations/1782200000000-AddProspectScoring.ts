import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProspectScoring1782200000000 implements MigrationInterface {
  name = 'AddProspectScoring1782200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "score_risque" ALTER COLUMN "id_client" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" ADD "id_prospect" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" ADD CONSTRAINT "FK_score_risque_id_prospect" FOREIGN KEY ("id_prospect") REFERENCES "prospects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_score_prospect_date" ON "score_risque" ("id_prospect", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" ADD CONSTRAINT "CHK_score_risque_client_xor_prospect" CHECK ((("id_client" IS NOT NULL)::int + ("id_prospect" IS NOT NULL)::int) = 1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "score_risque" DROP CONSTRAINT "CHK_score_risque_client_xor_prospect"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_score_prospect_date"`);
    await queryRunner.query(
      `ALTER TABLE "score_risque" DROP CONSTRAINT "FK_score_risque_id_prospect"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" DROP COLUMN "id_prospect"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_risque" ALTER COLUMN "id_client" SET NOT NULL`,
    );
  }
}
