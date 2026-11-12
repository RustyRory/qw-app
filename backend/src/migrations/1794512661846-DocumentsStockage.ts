import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentsStockage1794512661846 implements MigrationInterface {
  name = 'DocumentsStockage1794512661846';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "nomOriginal" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "cheminRelatif" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "dateExpiration" date`,
    );
    await queryRunner.query(`ALTER TABLE "documents" ADD "id_prospect" uuid`);
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."documents_type_enum" RENAME TO "documents_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_type_enum" AS ENUM('PIECE_IDENTITE', 'PIECE_IDENTITE_DIRIGEANT', 'PIECE_IDENTITE_BENEFICIAIRE', 'JUSTIFICATIF_DOMICILE', 'KBIS', 'STATUTS', 'LISTE_UBO', 'ATTESTATION_PPE', 'JUSTIFICATIF_FONDS', 'LETTRE_MISSION', 'RAPPORT', 'ANNEXE', 'AUTRE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" TYPE "public"."documents_type_enum" USING "type"::"text"::"public"."documents_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" SET DEFAULT 'AUTRE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."documents_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "id_client" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_id_prospect" ON "documents" ("id_prospect") `,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_017f11a7908e613a1299bb789ca" FOREIGN KEY ("id_prospect") REFERENCES "prospects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "CHK_documents_client_xor_prospect" CHECK (("id_client" IS NULL) <> ("id_prospect" IS NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "CHK_documents_client_xor_prospect"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_017f11a7908e613a1299bb789ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_documents_id_prospect"`);
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "id_client" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_type_enum_old" AS ENUM('PIECE_IDENTITE', 'JUSTIFICATIF_DOMICILE', 'KBIS', 'STATUTS', 'LISTE_UBO', 'ATTESTATION_PPE', 'JUSTIFICATIF_FONDS', 'LETTRE_MISSION', 'RAPPORT', 'ANNEXE', 'AUTRE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" TYPE "public"."documents_type_enum_old" USING "type"::"text"::"public"."documents_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "type" SET DEFAULT 'AUTRE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."documents_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."documents_type_enum_old" RENAME TO "documents_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_b67c3b0aa2df3080874ce8a47dc" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN "id_prospect"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN "dateExpiration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN "cheminRelatif"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN "nomOriginal"`,
    );
  }
}
