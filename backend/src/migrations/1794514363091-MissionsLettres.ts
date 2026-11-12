import { MigrationInterface, QueryRunner } from 'typeorm';

export class MissionsLettres1794514363091 implements MigrationInterface {
  name = 'MissionsLettres1794514363091';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "parametres_cabinet" ("id" integer NOT NULL DEFAULT '1', "nom" character varying(255) NOT NULL, "raisonSociale" character varying(255) NOT NULL, "formeJuridique" character varying(255) NOT NULL, "adresse" character varying(255) NOT NULL, "codePostal" character varying(10) NOT NULL, "ville" character varying(100) NOT NULL, "capitalSocial" character varying(50) NOT NULL, "siret" character varying(20) NOT NULL, "codeApe" character varying(10) NOT NULL, "tvaIntracommunautaire" character varying(50) NOT NULL, "email" character varying(255), "telephone" character varying(30), "logoDataUri" text, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_386f72c5ae677edad1915ec983c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignStatut"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lettre_mission_docusignstatut_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignEnvoyeAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignEnvelopeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignDestinataireEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "docusignDestinataireNom"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "cheminRelatif" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "id_document_signe_client" uuid`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."missions_type_enum" RENAME TO "missions_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missions_type_enum" AS ENUM('TENUE_COMPTABLE', 'COMPTES_ANNUELS', 'SOCIAL_PAIE', 'FISCAL', 'JURIDIQUE', 'CONSEIL', 'AUDIT_EXAMEN', 'AUTRE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ALTER COLUMN "type" TYPE "public"."missions_type_enum" USING (CASE "type"::text WHEN 'COMPTABILITE' THEN 'COMPTES_ANNUELS' WHEN 'AUDIT' THEN 'AUDIT_EXAMEN' ELSE "type"::text END)::"public"."missions_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."missions_type_enum_old"`);
    // Coordonnées du cabinet par défaut (reprises de l'ancien en-tête).
    await queryRunner.query(
      `INSERT INTO "parametres_cabinet" ("id", "nom", "raisonSociale", "formeJuridique", "adresse", "codePostal", "ville", "capitalSocial", "siret", "codeApe", "tvaIntracommunautaire") VALUES (1, 'QW CONSEILS', 'SAS QW CONSEILS', 'SAS d''expertise-comptable', '29 Rue du Colisée', '75008', 'Paris', '10 000 €', '952 244 887 00016', '6920 Z', 'FR89 952 244 887') ON CONFLICT ("id") DO NOTHING`,
    );
    // Répartition des travaux : choix unique → deux cases (cabinet / client).
    await queryRunner.query(
      `UPDATE "missions" SET "repartitionTravaux" = (SELECT jsonb_agg(CASE WHEN e ? 'assignation' THEN jsonb_build_object('id', e->>'id', 'cabinet', e->>'assignation' = 'CABINET', 'client', e->>'assignation' = 'CLIENT') ELSE e END) FROM jsonb_array_elements("repartitionTravaux") e) WHERE jsonb_typeof("repartitionTravaux") = 'array' AND jsonb_array_length("repartitionTravaux") > 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD CONSTRAINT "FK_47dfabf6842cebf8058a3d07eaa" FOREIGN KEY ("id_document_signe_client") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP CONSTRAINT "FK_47dfabf6842cebf8058a3d07eaa"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missions_type_enum_old" AS ENUM('COMPTABILITE', 'AUDIT', 'CONSEIL', 'JURIDIQUE', 'AUTRE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ALTER COLUMN "type" TYPE "public"."missions_type_enum_old" USING (CASE "type"::text WHEN 'COMPTES_ANNUELS' THEN 'COMPTABILITE' WHEN 'TENUE_COMPTABLE' THEN 'COMPTABILITE' WHEN 'AUDIT_EXAMEN' THEN 'AUDIT' WHEN 'JURIDIQUE' THEN 'JURIDIQUE' WHEN 'CONSEIL' THEN 'CONSEIL' ELSE 'AUTRE' END)::"public"."missions_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."missions_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."missions_type_enum_old" RENAME TO "missions_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "id_document_signe_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" DROP COLUMN "cheminRelatif"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignDestinataireNom" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignDestinataireEmail" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignEnvelopeId" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignEnvoyeAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lettre_mission_docusignstatut_enum" AS ENUM('ENVOYE', 'LIVRE', 'SIGNE', 'REFUSE', 'ANNULE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lettre_mission" ADD "docusignStatut" "public"."lettre_mission_docusignstatut_enum"`,
    );
    await queryRunner.query(`DROP TABLE "parametres_cabinet"`);
  }
}
