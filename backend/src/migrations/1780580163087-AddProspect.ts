import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProspect1780580163087 implements MigrationInterface {
  name = 'AddProspect1780580163087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."prospects_statut_enum" AS ENUM('nouveau', 'en_analyse', 'converti', 'rejete')`,
    );
    await queryRunner.query(
      `CREATE TABLE "prospects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prenom" character varying(100) NOT NULL, "nom" character varying(100) NOT NULL, "raisonSociale" character varying(200), "email" character varying(255), "telephone" character varying(20), "secteurActivite" character varying(200), "paysResidence" character varying(100), "estPep" boolean NOT NULL DEFAULT false, "notes" text, "statut" "public"."prospects_statut_enum" NOT NULL DEFAULT 'nouveau', "clientId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_createur" uuid NOT NULL, CONSTRAINT "PK_9fc60d8f29db14b861e3c96568e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prospects_id_createur" ON "prospects" ("id_createur") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prospects_statut" ON "prospects" ("statut") `,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD CONSTRAINT "FK_b64ba0db606523cf0d471830c2f" FOREIGN KEY ("id_createur") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP CONSTRAINT "FK_b64ba0db606523cf0d471830c2f"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_prospects_statut"`);
    await queryRunner.query(`DROP INDEX "public"."idx_prospects_id_createur"`);
    await queryRunner.query(`DROP TABLE "prospects"`);
    await queryRunner.query(`DROP TYPE "public"."prospects_statut_enum"`);
  }
}
