import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScreeningAuto1794858013528 implements MigrationInterface {
  name = 'ScreeningAuto1794858013528';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."screening_correspondance_statut_enum" AS ENUM('A_VERIFIER', 'HOMONYME', 'CONFIRMEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "screening_correspondance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "personneControlee" character varying(300) NOT NULL, "idRegistre" integer NOT NULL, "nomRegistre" character varying(300) NOT NULL, "natureRegistre" character varying(30) NOT NULL, "motifs" text, "registreDu" TIMESTAMP WITH TIME ZONE NOT NULL, "statut" "public"."screening_correspondance_statut_enum" NOT NULL DEFAULT 'A_VERIFIER', "commentaire" text, "decideAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_client" uuid, "id_prospect" uuid, "id_decide_par" uuid, CONSTRAINT "PK_e92eb4f0f9a92bede97fcc5ac69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d3af4c6f4d1302c043ec1fcf00" ON "screening_correspondance" ("id_prospect") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a5e92f21d07ad9326384ccba5" ON "screening_correspondance" ("id_client") `,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "screeningRegistreDu" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."prospects_screeningstatut_enum" AS ENUM('NON_EFFECTUE', 'OK', 'ALERTE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "screeningStatut" "public"."prospects_screeningstatut_enum" NOT NULL DEFAULT 'NON_EFFECTUE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "screeningDate" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" ADD "screeningRegistreDu" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "screening_correspondance" ADD CONSTRAINT "FK_7a5e92f21d07ad9326384ccba5d" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "screening_correspondance" ADD CONSTRAINT "FK_d3af4c6f4d1302c043ec1fcf004" FOREIGN KEY ("id_prospect") REFERENCES "prospects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "screening_correspondance" ADD CONSTRAINT "FK_6c2edb45af6dc44c3c77c701823" FOREIGN KEY ("id_decide_par") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "screening_correspondance" DROP CONSTRAINT "FK_6c2edb45af6dc44c3c77c701823"`,
    );
    await queryRunner.query(
      `ALTER TABLE "screening_correspondance" DROP CONSTRAINT "FK_d3af4c6f4d1302c043ec1fcf004"`,
    );
    await queryRunner.query(
      `ALTER TABLE "screening_correspondance" DROP CONSTRAINT "FK_7a5e92f21d07ad9326384ccba5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "screeningRegistreDu"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "screeningDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prospects" DROP COLUMN "screeningStatut"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."prospects_screeningstatut_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "screeningRegistreDu"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a5e92f21d07ad9326384ccba5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3af4c6f4d1302c043ec1fcf00"`,
    );
    await queryRunner.query(`DROP TABLE "screening_correspondance"`);
    await queryRunner.query(
      `DROP TYPE "public"."screening_correspondance_statut_enum"`,
    );
  }
}
