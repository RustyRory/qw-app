# Workflow — Nouvelle version QW-App (backend)

> Ce document est le guide d'implémentation étape par étape pour migrer le backend vers le nouveau schéma de base de données (14 entités, KYC fusionné dans Client, modules ARPEC).

---

## Résumé des changements

| Type | Quoi |
|------|------|
| **Supprimer** | Module `kyc/` entier (entity, dto, service, controller, module, spec) |
| **Supprimer** | Anciennes migrations (InitSchema + AddProspect) |
| **Modifier** | `users/entities/user.entity.ts` — nouveau Role enum (UPPERCASE) + `deletedAt` |
| **Modifier** | `clients/entities/client.entity.ts` — réécriture complète (champs KYC fusionnés + SIRENE) |
| **Modifier** | `clients/clients.service.ts` — supprimer toute logique KYC |
| **Modifier** | `clients/clients.module.ts` — supprimer import KYC |
| **Modifier** | `prospects/entities/prospect.entity.ts` — nouveaux champs + `StatutKanban` |
| **Modifier** | `prospects/dto/create-prospect.dto.ts` — nouveaux champs |
| **Modifier** | `prospects/prospects.service.ts` — adapter à la nouvelle entité |
| **Modifier** | `documents/entities/document.entity.ts` — ajouter `type`, `s3Key`, `missionId` |
| **Modifier** | `scoring/entities/risk-score.entity.ts` — renommer `details` → `reponses`, champs ARPEC |
| **Modifier** | `scoring/scoring.service.ts` — réécriture algorithme ARPEC 4 dimensions |
| **Modifier** | `scoring/scoring.module.ts` — supprimer dépendance KYC |
| **Modifier** | `audit/entities/audit-log.entity.ts` — ajouter `ipAddress`, `ressource`/`ressourceId` |
| **Créer** | `common/enums/index.ts` — tous les enums partagés |
| **Créer** | Module `beneficiaires/` — BeneficiaireEffectif |
| **Créer** | Module `contacts/` — Contact |
| **Créer** | Module `questionnaires/` — QuestionnaireAcceptation |
| **Créer** | Module `missions/` — Mission |
| **Créer** | Module `lettres-mission/` — LettreMission |
| **Créer** | Module `planning/` — PlanningEtape |
| **Créer** | Module `obligations/` — Obligation |
| **Créer** | Module `operations-sensibles/` — OperationSensible |
| **Créer** | `migrations/1782000000000-V2Schema.ts` — migration unique propre |
| **Modifier** | `app.module.ts` — ajouter les 8 nouveaux modules, supprimer KYC |
| **Modifier** | `data-source.ts` — ajouter les 14 entités |
| **Modifier** | `database/seed.ts` — mettre à jour le seed utilisateur |

---

## Étape 0 — Reset de la base de données (dev uniquement)

On repart sur un schéma propre. La DB de dev est dans un volume Docker.

```bash
cd deployment
docker compose -f docker-compose.dev.yml down -v   # supprime le volume postgres
docker compose -f docker-compose.dev.yml up -d      # recrée PostgreSQL + Redis vides
```

---

## Étape 1 — Supprimer le module KYC

```bash
rm -rf backend/src/kyc
```

Fichiers supprimés :
- `kyc/entities/kyc.entity.ts`
- `kyc/dto/update-kyc.dto.ts`
- `kyc/kyc.controller.ts`
- `kyc/kyc.module.ts`
- `kyc/kyc.service.ts`
- `kyc/kyc.service.spec.ts`

---

## Étape 2 — Supprimer les anciennes migrations

```bash
rm backend/src/migrations/1780063741545-InitSchema.ts
rm backend/src/migrations/1780580163087-AddProspect.ts
```

---

## Étape 3 — Créer le fichier des enums partagés

**Créer** : `backend/src/common/enums/index.ts`

```typescript
export enum Role {
  COLLABORATEUR = 'COLLABORATEUR',
  RESPONSABLE = 'RESPONSABLE',
  EXPERT_COMPTABLE = 'EXPERT_COMPTABLE',
  ADMIN = 'ADMIN',
}

export enum TypeEntite {
  PERSONNE_PHYSIQUE = 'PERSONNE_PHYSIQUE',
  PERSONNE_MORALE = 'PERSONNE_MORALE',
}

export enum StatutKanban {
  PRISE_CONTACT = 'PRISE_CONTACT',
  DECOUVERTE = 'DECOUVERTE',
  OPPORTUNITE = 'OPPORTUNITE',
  LAB = 'LAB',
  PREPARATION = 'PREPARATION',
  CONVERTI = 'CONVERTI',
  REFUSE = 'REFUSE',
}

export enum StatutClient {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  RESILIE = 'RESILIE',
}

export enum StatutKyc {
  INCOMPLET = 'INCOMPLET',
  COMPLET = 'COMPLET',
  VALIDE = 'VALIDE',
  EXPIRE = 'EXPIRE',
}

export enum ScreeningStatut {
  NON_EFFECTUE = 'NON_EFFECTUE',
  OK = 'OK',
  ALERTE = 'ALERTE',
}

export enum NiveauRisque {
  FAIBLE = 'FAIBLE',
  MOYEN = 'MOYEN',
  ELEVE = 'ELEVE',
}

export enum TypeDocument {
  PIECE_IDENTITE = 'PIECE_IDENTITE',
  JUSTIFICATIF_DOMICILE = 'JUSTIFICATIF_DOMICILE',
  KBIS = 'KBIS',
  STATUTS = 'STATUTS',
  LISTE_UBO = 'LISTE_UBO',
  ATTESTATION_PPE = 'ATTESTATION_PPE',
  JUSTIFICATIF_FONDS = 'JUSTIFICATIF_FONDS',
  LETTRE_MISSION = 'LETTRE_MISSION',
  RAPPORT = 'RAPPORT',
  ANNEXE = 'ANNEXE',
  AUTRE = 'AUTRE',
}

export enum TypeMission {
  COMPTABILITE = 'COMPTABILITE',
  AUDIT = 'AUDIT',
  CONSEIL = 'CONSEIL',
  JURIDIQUE = 'JURIDIQUE',
  AUTRE = 'AUTRE',
}

export enum StatutMission {
  EN_COURS = 'EN_COURS',
  SUSPENDUE = 'SUSPENDUE',
  TERMINEE = 'TERMINEE',
  RESILIEE = 'RESILIEE',
}

export enum TypeObligation {
  KYC_VERIFICATION = 'KYC_VERIFICATION',
  EVALUATION_RISQUE = 'EVALUATION_RISQUE',
  MISE_A_JOUR_DOCS = 'MISE_A_JOUR_DOCS',
  VALIDATION_RELATION = 'VALIDATION_RELATION',
  LETTRE_MISSION = 'LETTRE_MISSION',
}

export enum StatutObligation {
  A_FAIRE = 'A_FAIRE',
  FAIT = 'FAIT',
  EN_RETARD = 'EN_RETARD',
  EXPIRE = 'EXPIRE',
}

export enum TypeOperationSensible {
  SANS_JUSTIFICATION = 'SANS_JUSTIFICATION',
  COMPLEXE = 'COMPLEXE',
  SANS_OBJET_LICITE = 'SANS_OBJET_LICITE',
  INHABITUELLE = 'INHABITUELLE',
  ECONOMIE_VIRTUELLE = 'ECONOMIE_VIRTUELLE',
  ESPECES = 'ESPECES',
  AUTRE = 'AUTRE',
}

export enum StatutOperationSensible {
  SIGNALEE = 'SIGNALEE',
  EN_ANALYSE = 'EN_ANALYSE',
  CLASSEE = 'CLASSEE',
  TRACFIN_DECLARE = 'TRACFIN_DECLARE',
}

export enum TypeContact {
  INTERVENANT = 'INTERVENANT',
  AVOCAT = 'AVOCAT',
  COMMISSAIRE_COMPTES = 'COMMISSAIRE_COMPTES',
  NOTAIRE = 'NOTAIRE',
  AUTRE = 'AUTRE',
}

export enum TypePlanningEtape {
  REGLEMENTAIRE = 'REGLEMENTAIRE',
  MANUELLE = 'MANUELLE',
}

export enum StatutPlanningEtape {
  A_FAIRE = 'A_FAIRE',
  EN_COURS = 'EN_COURS',
  FAIT = 'FAIT',
  ANNULEE = 'ANNULEE',
}
```

---

## Étape 4 — Réécrire les entités existantes

### 4.1 `users/entities/user.entity.ts`

Changements : Role enum en UPPERCASE, `deletedAt`, supprimer les relations vers les anciens modules.

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 255, unique: true }) email: string;
  @Column({ type: 'varchar', length: 255 }) passwordHash: string;
  @Column({ type: 'enum', enum: Role, default: Role.COLLABORATEUR }) role: Role;
  @Column({ type: 'varchar', length: 100 }) prenom: string;
  @Column({ type: 'varchar', length: 100 }) nom: string;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'timestamptz', nullable: true }) lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ type: 'timestamptz' }) deletedAt: Date | null;
}
```

> **Note** : les `@OneToMany` vers les autres entités sont supprimés — TypeORM n'en a pas besoin côté inverse si on ne les utilise pas. On les ajoutera uniquement si nécessaire.

---

### 4.2 `clients/entities/client.entity.ts`

Réécriture complète. Champs SIRENE + champs KYC fusionnés + toutes les relations.

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';
import { BeneficiaireEffectif } from '../../beneficiaires/entities/beneficiaire-effectif.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Document } from '../../documents/entities/document.entity';
import { ScoreRisque } from '../../scoring/entities/score-risque.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { PlanningEtape } from '../../planning/entities/planning-etape.entity';
import { Obligation } from '../../obligations/entities/obligation.entity';
import { OperationSensible } from '../../operations-sensibles/entities/operation-sensible.entity';
import {
  TypeEntite, StatutClient, StatutKyc, ScreeningStatut,
} from '../../common/enums';

@Entity('clients')
@Index('idx_client_statut', ['statut'], { where: '"deletedAt" IS NULL' })
@Index('idx_client_siret', ['siret'], { where: '"siret" IS NOT NULL' })
export class Client {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 20, unique: true }) ref: string;
  @Column({ type: 'varchar', length: 14, nullable: true }) siret: string | null;
  @Column({ type: 'varchar', length: 9, nullable: true }) siren: string | null;
  @Column({ type: 'varchar', length: 255 }) raisonSociale: string;
  @Column({ type: 'enum', enum: TypeEntite }) typeEntite: TypeEntite;
  @Column({ type: 'varchar', length: 100, nullable: true }) formeJuridique: string | null;
  @Column({ type: 'varchar', length: 10, nullable: true }) codeNaf: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) activitePrincipale: string | null;
  @Column({ type: 'date', nullable: true }) dateCreationEntreprise: Date | null;
  @Column({ type: 'text', nullable: true }) adresseSiege: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) ville: string | null;
  @Column({ type: 'varchar', length: 10, nullable: true }) codePostal: string | null;
  @Column({ type: 'varchar', length: 100, default: 'France' }) pays: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }) chiffreAffaires: number | null;
  @Column({ type: 'integer', nullable: true }) effectif: number | null;
  @Column({ type: 'text', nullable: true }) natureMission: string | null;
  @Column({ type: 'enum', enum: StatutClient, default: StatutClient.ACTIF }) statut: StatutClient;
  @Column({ type: 'timestamptz', nullable: true }) sireneUpdatedAt: Date | null;

  // Champs KYC fusionnés
  @Column({ type: 'enum', enum: StatutKyc, default: StatutKyc.INCOMPLET }) kycStatut: StatutKyc;
  @Column({ type: 'boolean', default: false }) ppe: boolean;
  @Column({ type: 'text', nullable: true }) ppeDetail: string | null;
  @Column({ type: 'boolean', default: false }) uboSaisi: boolean;
  @Column({ type: 'enum', enum: ScreeningStatut, default: ScreeningStatut.NON_EFFECTUE }) screeningStatut: ScreeningStatut;
  @Column({ type: 'timestamptz', nullable: true }) screeningDate: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) kycCompletedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_kyc_validator' }) kycValidatedBy: User | null;

  @OneToOne(() => Prospect, (p) => p.client, { nullable: true })
  @JoinColumn({ name: 'id_prospect' }) prospect: Prospect | null;

  @OneToMany(() => BeneficiaireEffectif, (b) => b.client) beneficiaires: BeneficiaireEffectif[];
  @OneToMany(() => Contact, (c) => c.client) contacts: Contact[];
  @OneToMany(() => Document, (d) => d.client) documents: Document[];
  @OneToMany(() => ScoreRisque, (s) => s.client) scores: ScoreRisque[];
  @OneToMany(() => Mission, (m) => m.client) missions: Mission[];
  @OneToMany(() => PlanningEtape, (p) => p.client) planningEtapes: PlanningEtape[];
  @OneToMany(() => Obligation, (o) => o.client) obligations: Obligation[];
  @OneToMany(() => OperationSensible, (o) => o.client) operationsSensibles: OperationSensible[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' }) createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ type: 'timestamptz' }) deletedAt: Date | null;
}
```

---

### 4.3 `prospects/entities/prospect.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { QuestionnaireAcceptation } from '../../questionnaires/entities/questionnaire-acceptation.entity';
import { TypeEntite, StatutKanban } from '../../common/enums';

@Entity('prospects')
@Index('idx_prospect_statut', ['statutKanban'], { where: '"deletedAt" IS NULL' })
@Index('idx_prospect_siret', ['siret'], { where: '"siret" IS NOT NULL' })
export class Prospect {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 20, unique: true }) ref: string;
  @Column({ type: 'varchar', length: 14, nullable: true }) siret: string | null;
  @Column({ type: 'varchar', length: 255 }) nom: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) telephone: string | null;
  @Column({ type: 'enum', enum: TypeEntite, default: TypeEntite.PERSONNE_MORALE }) typeEntite: TypeEntite;
  @Column({ type: 'enum', enum: StatutKanban, default: StatutKanban.PRISE_CONTACT }) statutKanban: StatutKanban;
  @Column({ type: 'text', nullable: true }) motifRefus: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) activite: string | null;
  @Column({ type: 'varchar', length: 10, nullable: true }) codeNaf: string | null;
  @Column({ type: 'text', nullable: true }) adresse: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) ville: string | null;
  @Column({ type: 'varchar', length: 10, nullable: true }) codePostal: string | null;
  @Column({ type: 'varchar', length: 100, default: 'France' }) pays: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }) chiffreAffaires: number | null;
  @Column({ type: 'integer', nullable: true }) effectif: number | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' }) createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_assigned' }) assignedTo: User | null;

  @OneToOne(() => QuestionnaireAcceptation, (q) => q.prospect, { nullable: true })
  questionnaire: QuestionnaireAcceptation | null;

  @OneToOne(() => Client, (c) => c.prospect, { nullable: true })
  client: Client | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ type: 'timestamptz' }) deletedAt: Date | null;
}
```

---

### 4.4 `documents/entities/document.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { TypeDocument } from '../../common/enums';

@Entity('documents')
@Index('idx_document_client', ['client'])
@Index('idx_document_expires', ['expiresAt'], { where: '"expiresAt" IS NOT NULL' })
export class Document {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'enum', enum: TypeDocument, default: TypeDocument.AUTRE }) type: TypeDocument;
  @Column({ type: 'varchar', length: 255 }) nom: string;
  @Column({ type: 'varchar', length: 100 }) mimeType: string;
  @Column({ type: 'integer' }) tailleOctets: number;
  @Column({ type: 'varchar', length: 500, unique: true }) s3Key: string;
  @Column({ type: 'timestamptz', nullable: true }) expiresAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) relanceAt: Date | null;

  @ManyToOne(() => Client, (c) => c.documents, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @ManyToOne(() => Mission, { nullable: true })
  @JoinColumn({ name: 'id_mission' }) mission: Mission | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_uploaded_by' }) uploadedBy: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

---

### 4.5 `scoring/entities/score-risque.entity.ts`

> **Renommer le fichier** : `risk-score.entity.ts` → `score-risque.entity.ts` (optionnel, mais cohérent avec le MLD).

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { NiveauRisque } from '../../common/enums';

export interface ArpecReponses {
  clientCaracteristiques: number;   // 0–50
  activiteSecteur: number;          // 0–40
  zoneGeographique: number;         // 0–30
  typeMission: number;              // 0–30
}

@Entity('score_risque')
@Index('idx_score_client_date', ['client', 'createdAt'])
export class ScoreRisque {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'integer' }) score: number;
  @Column({ type: 'enum', enum: NiveauRisque }) niveau: NiveauRisque;
  @Column({ type: 'jsonb' }) reponses: ArpecReponses;

  @ManyToOne(() => Client, (c) => c.scores, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_calculated_by' }) calculatedBy: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  // Pas de updatedAt : INSERT-ONLY (historique immuable)
}
```

---

### 4.6 `audit/entities/audit-log.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  VALIDATE = 'VALIDATE',
  LOGIN = 'LOGIN',
}

@Entity('audit_logs')
@Index('idx_audit_ressource', ['ressource', 'ressourceId'])
@Index('idx_audit_user', ['utilisateur'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'enum', enum: AuditAction }) action: AuditAction;
  @Column({ type: 'varchar', length: 50 }) ressource: string;
  @Column({ type: 'uuid' }) ressourceId: string;
  @Column({ type: 'jsonb', nullable: true }) details: Record<string, unknown> | null;
  @Column({ type: 'varchar', length: 45, nullable: true }) ipAddress: string | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' }) utilisateur: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

> **Important** : après ce changement, toutes les références à `entiteType`/`entiteId` dans les services existants doivent être remplacées par `ressource`/`ressourceId`.

---

## Étape 5 — Créer les 8 nouvelles entités

### 5.1 `questionnaires/entities/questionnaire-acceptation.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToOne, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';

export enum StatutQuestionnaire {
  EN_COURS = 'EN_COURS',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
}

@Entity('questionnaire_acceptation')
export class QuestionnaireAcceptation {
  @PrimaryGeneratedColumn('uuid') id: string;

  @OneToOne(() => Prospect, (p) => p.questionnaire, { nullable: false })
  @JoinColumn({ name: 'id_prospect' }) prospect: Prospect;

  @Column({ type: 'enum', enum: StatutQuestionnaire, default: StatutQuestionnaire.EN_COURS })
  statut: StatutQuestionnaire;

  @Column({ type: 'jsonb', nullable: true }) reponses: Record<string, unknown> | null;
  @Column({ type: 'text', nullable: true }) motifRefus: string | null;

  @Column({ type: 'timestamptz', nullable: true }) validatedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_validated_by' }) validatedBy: User | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' }) createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

---

### 5.2 `beneficiaires/entities/beneficiaire-effectif.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

@Entity('beneficiaire_effectif')
export class BeneficiaireEffectif {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 50, nullable: true }) prenom: string | null;
  @Column({ type: 'varchar', length: 100 }) nom: string;
  @Column({ type: 'date', nullable: true }) dateNaissance: Date | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) nationalite: string | null;
  @Column({ type: 'text', nullable: true }) adresse: string | null;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) pourcentageDetention: number;
  @Column({ type: 'boolean', default: false }) ppe: boolean;

  @ManyToOne(() => Client, (c) => c.beneficiaires, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

---

### 5.3 `contacts/entities/contact.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { TypeContact } from '../../common/enums';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 50, nullable: true }) prenom: string | null;
  @Column({ type: 'varchar', length: 100 }) nom: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) telephone: string | null;
  @Column({ type: 'enum', enum: TypeContact, default: TypeContact.AUTRE }) type: TypeContact;
  @Column({ type: 'text', nullable: true }) roleDetail: string | null;

  @ManyToOne(() => Client, (c) => c.contacts, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

---

### 5.4 `missions/entities/mission.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { LettreMission } from '../../lettres-mission/entities/lettre-mission.entity';
import { TypeMission, StatutMission } from '../../common/enums';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'enum', enum: TypeMission }) type: TypeMission;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'enum', enum: StatutMission, default: StatutMission.EN_COURS }) statut: StatutMission;
  @Column({ type: 'date' }) dateDebut: Date;
  @Column({ type: 'date', nullable: true }) dateFin: Date | null;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) honoraires: number | null;

  @ManyToOne(() => Client, (c) => c.missions, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' }) createdBy: User;

  @OneToMany(() => LettreMission, (l) => l.mission) lettresMission: LettreMission[];

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
```

---

### 5.5 `lettres-mission/entities/lettre-mission.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Mission } from '../../missions/entities/mission.entity';

@Entity('lettre_mission')
export class LettreMission {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'integer', default: 1 }) version: number;
  @Column({ type: 'jsonb' }) contenu: Record<string, unknown>;
  @Column({ type: 'boolean', default: false }) signeeParExpert: boolean;
  @Column({ type: 'timestamptz', nullable: true }) signeeAt: Date | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) s3Key: string | null;

  @ManyToOne(() => Mission, (m) => m.lettresMission, { nullable: false })
  @JoinColumn({ name: 'id_mission' }) mission: Mission;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_signataire' }) signataire: User | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

---

### 5.6 `planning/entities/planning-etape.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { TypePlanningEtape, StatutPlanningEtape } from '../../common/enums';

@Entity('planning_etape')
export class PlanningEtape {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 255 }) titre: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'enum', enum: TypePlanningEtape }) type: TypePlanningEtape;
  @Column({ type: 'enum', enum: StatutPlanningEtape, default: StatutPlanningEtape.A_FAIRE }) statut: StatutPlanningEtape;
  @Column({ type: 'date', nullable: true }) dateEcheance: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;

  @ManyToOne(() => Client, (c) => c.planningEtapes, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_completed_by' }) completedBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_assigned_to' }) assignedTo: User | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' }) createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

---

### 5.7 `obligations/entities/obligation.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { TypeObligation, StatutObligation } from '../../common/enums';

@Entity('obligations')
export class Obligation {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'enum', enum: TypeObligation }) type: TypeObligation;
  @Column({ type: 'enum', enum: StatutObligation, default: StatutObligation.A_FAIRE }) statut: StatutObligation;
  @Column({ type: 'date', nullable: true }) dateEcheance: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;

  @ManyToOne(() => Client, (c) => c.obligations, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
```

---

### 5.8 `operations-sensibles/entities/operation-sensible.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { TypeOperationSensible, StatutOperationSensible } from '../../common/enums';

@Entity('operation_sensible')
@Index('idx_operation_statut', ['client', 'statut'])
export class OperationSensible {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'enum', enum: TypeOperationSensible }) type: TypeOperationSensible;
  @Column({ type: 'text' }) description: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }) montant: number | null;
  @Column({ type: 'varchar', length: 3, nullable: true }) devise: string | null;
  @Column({ type: 'enum', enum: StatutOperationSensible, default: StatutOperationSensible.SIGNALEE }) statut: StatutOperationSensible;
  @Column({ type: 'timestamptz', nullable: true }) tracfinDate: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) validatedAt: Date | null;

  @ManyToOne(() => Client, (c) => c.operationsSensibles, { nullable: false })
  @JoinColumn({ name: 'id_client' }) client: Client;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_validated_by' }) validatedBy: User | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_signale_by' }) signaleBy: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
```

---

## Étape 6 — Créer les 8 nouveaux modules NestJS

Pour chaque module, la structure est identique :

```
src/<module>/
├── entities/<entity>.entity.ts    ← déjà créé étape 5
├── dto/
│   ├── create-<entity>.dto.ts
│   └── update-<entity>.dto.ts
├── <module>.service.ts
├── <module>.controller.ts
└── <module>.module.ts
```

### 6.1 Module `questionnaires`

**`questionnaires/dto/create-questionnaire.dto.ts`**
```typescript
import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { StatutQuestionnaire } from '../entities/questionnaire-acceptation.entity';

export class CreateQuestionnaireDto {
  @IsUUID() prospectId: string;
  @IsOptional() @IsObject() reponses?: Record<string, unknown>;
  @IsOptional() @IsEnum(StatutQuestionnaire) statut?: StatutQuestionnaire;
  @IsOptional() @IsString() motifRefus?: string;
}
```

**`questionnaires/questionnaires.service.ts`**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionnaireAcceptation, StatutQuestionnaire } from './entities/questionnaire-acceptation.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { User } from '../users/entities/user.entity';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(QuestionnaireAcceptation)
    private readonly repo: Repository<QuestionnaireAcceptation>,
  ) {}

  async create(dto: CreateQuestionnaireDto, userId: string): Promise<QuestionnaireAcceptation> {
    const q = this.repo.create({
      prospect: { id: dto.prospectId } as Prospect,
      reponses: dto.reponses ?? null,
      createdBy: { id: userId } as User,
    });
    return this.repo.save(q);
  }

  findByProspect(prospectId: string): Promise<QuestionnaireAcceptation | null> {
    return this.repo.findOne({ where: { prospect: { id: prospectId } } });
  }

  async validate(id: string, userId: string): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOneBy({ id });
    if (!q) throw new NotFoundException();
    q.statut = StatutQuestionnaire.VALIDE;
    q.validatedAt = new Date();
    q.validatedBy = { id: userId } as User;
    return this.repo.save(q);
  }

  async refuse(id: string, motif: string, userId: string): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOneBy({ id });
    if (!q) throw new NotFoundException();
    q.statut = StatutQuestionnaire.REFUSE;
    q.motifRefus = motif;
    q.validatedAt = new Date();
    q.validatedBy = { id: userId } as User;
    return this.repo.save(q);
  }
}
```

**`questionnaires/questionnaires.controller.ts`**
```typescript
import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QuestionnairesService } from './questionnaires.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/questionnaires')
export class QuestionnairesController {
  constructor(private readonly svc: QuestionnairesService) {}

  @Post() create(@Body() dto: CreateQuestionnaireDto, @Req() req: any) {
    return this.svc.create(dto, req.user.id);
  }

  @Get('prospect/:prospectId')
  findByProspect(@Param('prospectId') id: string) {
    return this.svc.findByProspect(id);
  }

  @Patch(':id/valider')
  validate(@Param('id') id: string, @Req() req: any) {
    return this.svc.validate(id, req.user.id);
  }

  @Patch(':id/refuser')
  refuse(@Param('id') id: string, @Body('motif') motif: string, @Req() req: any) {
    return this.svc.refuse(id, motif, req.user.id);
  }
}
```

**`questionnaires/questionnaires.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionnaireAcceptation } from './entities/questionnaire-acceptation.entity';
import { QuestionnairesService } from './questionnaires.service';
import { QuestionnairesController } from './questionnaires.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionnaireAcceptation])],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}
```

---

### 6.2 Module `beneficiaires`

**`beneficiaires/dto/create-beneficiaire.dto.ts`**
```typescript
import { IsBoolean, IsDecimal, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateBeneficiaireDto {
  @IsUUID() clientId: string;
  @IsString() @IsNotEmpty() nom: string;
  @IsOptional() @IsString() prenom?: string;
  @IsOptional() @IsString() dateNaissance?: string;
  @IsOptional() @IsString() nationalite?: string;
  @IsOptional() @IsString() adresse?: string;
  @IsNumber() @Min(0) @Max(100) pourcentageDetention: number;
  @IsOptional() @IsBoolean() ppe?: boolean;
}
```

**`beneficiaires/beneficiaires.service.ts`**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaireEffectif } from './entities/beneficiaire-effectif.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateBeneficiaireDto } from './dto/create-beneficiaire.dto';

@Injectable()
export class BeneficiairesService {
  constructor(
    @InjectRepository(BeneficiaireEffectif)
    private readonly repo: Repository<BeneficiaireEffectif>,
  ) {}

  create(dto: CreateBeneficiaireDto): Promise<BeneficiaireEffectif> {
    const b = this.repo.create({
      ...dto,
      client: { id: dto.clientId } as Client,
    });
    return this.repo.save(b);
  }

  findByClient(clientId: string): Promise<BeneficiaireEffectif[]> {
    return this.repo.find({ where: { client: { id: clientId } }, order: { createdAt: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    const b = await this.repo.findOneBy({ id });
    if (!b) throw new NotFoundException();
    await this.repo.remove(b);
  }
}
```

**`beneficiaires/beneficiaires.controller.ts`**
```typescript
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BeneficiairesService } from './beneficiaires.service';
import { CreateBeneficiaireDto } from './dto/create-beneficiaire.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/beneficiaires')
export class BeneficiairesController {
  constructor(private readonly svc: BeneficiairesService) {}

  @Post() create(@Body() dto: CreateBeneficiaireDto) { return this.svc.create(dto); }
  @Get('client/:clientId') findByClient(@Param('clientId') id: string) { return this.svc.findByClient(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
```

**`beneficiaires/beneficiaires.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiaireEffectif } from './entities/beneficiaire-effectif.entity';
import { BeneficiairesService } from './beneficiaires.service';
import { BeneficiairesController } from './beneficiaires.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BeneficiaireEffectif])],
  controllers: [BeneficiairesController],
  providers: [BeneficiairesService],
})
export class BeneficiairesModule {}
```

---

### 6.3 Module `contacts`

Même structure que `beneficiaires`. DTOs / Service / Controller / Module à créer sur le même modèle.

**`contacts/dto/create-contact.dto.ts`**
```typescript
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TypeContact } from '../../common/enums';

export class CreateContactDto {
  @IsUUID() clientId: string;
  @IsString() @IsNotEmpty() nom: string;
  @IsOptional() @IsString() prenom?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsEnum(TypeContact) type: TypeContact;
  @IsOptional() @IsString() roleDetail?: string;
}
```

**`contacts/contacts.service.ts`** → CRUD sur `Contact` (identique à BeneficiairesService).
**`contacts/contacts.controller.ts`** → POST, GET `:clientId`, DELETE `:id`.
**`contacts/contacts.module.ts`** → TypeOrmModule.forFeature([Contact]).

---

### 6.4 Module `missions`

**`missions/dto/create-mission.dto.ts`**
```typescript
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TypeMission } from '../../common/enums';

export class CreateMissionDto {
  @IsUUID() clientId: string;
  @IsEnum(TypeMission) type: TypeMission;
  @IsOptional() @IsString() description?: string;
  @IsDateString() dateDebut: string;
  @IsOptional() @IsDateString() dateFin?: string;
  @IsOptional() @IsNumber() honoraires?: number;
}
```

**`missions/missions.service.ts`** → CRUD + changer statut (suspend, terminer, résilier).
**`missions/missions.controller.ts`** → POST, GET, PATCH, DELETE + PATCH `:id/statut`.
**`missions/missions.module.ts`** → TypeOrmModule.forFeature([Mission]).

---

### 6.5 Module `lettres-mission`

**`lettres-mission/dto/create-lettre.dto.ts`**
```typescript
import { IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export class CreateLettreMissionDto {
  @IsUUID() missionId: string;
  @IsObject() @IsNotEmpty() contenu: Record<string, unknown>;
}
```

**`lettres-mission/lettres-mission.service.ts`** → create (auto-incrémente `version`), findByMission, signer.
**`lettres-mission/lettres-mission.controller.ts`** → POST, GET, PATCH `:id/signer`.
**`lettres-mission/lettres-mission.module.ts`** → TypeOrmModule.forFeature([LettreMission]).

---

### 6.6 Module `planning`

**`planning/dto/create-etape.dto.ts`**
```typescript
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TypePlanningEtape } from '../../common/enums';

export class CreateEtapeDto {
  @IsUUID() clientId: string;
  @IsString() @IsNotEmpty() titre: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(TypePlanningEtape) type: TypePlanningEtape;
  @IsOptional() @IsDateString() dateEcheance?: string;
  @IsOptional() @IsUUID() assignedToId?: string;
}
```

**`planning/planning.service.ts`** → create, findByClient, complete(id, userId), remove.
**`planning/planning.controller.ts`** → POST, GET, PATCH `:id/completer`, DELETE.
**`planning/planning.module.ts`** → TypeOrmModule.forFeature([PlanningEtape]).

---

### 6.7 Module `obligations`

```typescript
// obligations/dto/create-obligation.dto.ts
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TypeObligation } from '../../common/enums';

export class CreateObligationDto {
  @IsUUID() clientId: string;
  @IsEnum(TypeObligation) type: TypeObligation;
  @IsOptional() @IsDateString() dateEcheance?: string;
}
```

**`obligations/obligations.service.ts`** → create, findByClient, marquerFait(id), findEnRetard.
**`obligations/obligations.controller.ts`** → POST, GET, PATCH `:id/fait`.
**`obligations/obligations.module.ts`** → TypeOrmModule.forFeature([Obligation]).

---

### 6.8 Module `operations-sensibles`

```typescript
// operations-sensibles/dto/create-operation.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TypeOperationSensible } from '../../common/enums';

export class CreateOperationDto {
  @IsUUID() clientId: string;
  @IsEnum(TypeOperationSensible) type: TypeOperationSensible;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsNumber() montant?: number;
  @IsOptional() @IsString() devise?: string;
}
```

**`operations-sensibles/operations.service.ts`** → create, findByClient, declareTracfin(id, date, userId), classer(id, userId).
**`operations-sensibles/operations.controller.ts`** → POST, GET, PATCH `:id/tracfin`, PATCH `:id/classer`.
**`operations-sensibles/operations.module.ts`** → TypeOrmModule.forFeature([OperationSensible]).

---

## Étape 7 — Mettre à jour les modules existants

### 7.1 Scoring — réécriture algorithme ARPEC

**`scoring/entities/score-risque.entity.ts`** → voir étape 4.5

**`scoring/dto/create-score.dto.ts`** (nouveau)
```typescript
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateScoreDto {
  @IsUUID() clientId: string;
  @IsInt() @Min(0) @Max(50) clientCaracteristiques: number;
  @IsInt() @Min(0) @Max(40) activiteSecteur: number;
  @IsInt() @Min(0) @Max(30) zoneGeographique: number;
  @IsInt() @Min(0) @Max(30) typeMission: number;
}
```

**`scoring/scoring.service.ts`** — réécriture :
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoreRisque, ArpecReponses } from './entities/score-risque.entity';
import { NiveauRisque } from '../common/enums';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateScoreDto } from './dto/create-score.dto';

function computeNiveau(score: number): NiveauRisque {
  if (score <= 40) return NiveauRisque.FAIBLE;
  if (score <= 80) return NiveauRisque.MOYEN;
  return NiveauRisque.ELEVE;
}

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(ScoreRisque)
    private readonly repo: Repository<ScoreRisque>,
  ) {}

  async calculate(dto: CreateScoreDto, userId: string): Promise<ScoreRisque> {
    const reponses: ArpecReponses = {
      clientCaracteristiques: dto.clientCaracteristiques,
      activiteSecteur: dto.activiteSecteur,
      zoneGeographique: dto.zoneGeographique,
      typeMission: dto.typeMission,
    };
    const score = dto.clientCaracteristiques + dto.activiteSecteur
                + dto.zoneGeographique + dto.typeMission;
    const niveau = computeNiveau(score);

    return this.repo.save(
      this.repo.create({
        score,
        niveau,
        reponses,
        client: { id: dto.clientId } as Client,
        calculatedBy: { id: userId } as User,
      }),
    );
  }

  findByClient(clientId: string): Promise<ScoreRisque[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findCurrent(clientId: string): Promise<ScoreRisque | null> {
    return this.repo.findOne({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }
}
```

**`scoring/scoring.controller.ts`** — mettre à jour pour accepter un body :
```typescript
@Post()
calculate(@Body() dto: CreateScoreDto, @Req() req: any) {
  return this.scoringService.calculate(dto, req.user.id);
}

@Get('client/:clientId')
findByClient(@Param('clientId') id: string) {
  return this.scoringService.findByClient(id);
}

@Get('client/:clientId/courant')
findCurrent(@Param('clientId') id: string) {
  return this.scoringService.findCurrent(id);
}
```

**`scoring/scoring.module.ts`** — supprimer Kyc, supprimer Redis (optionnel de le garder) :
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([ScoreRisque])],
  controllers: [ScoringController],
  providers: [ScoringService],
})
export class ScoringModule {}
```

---

### 7.2 Clients — supprimer la logique KYC

**`clients/clients.service.ts`** — supprimer tout ce qui concerne `Kyc` :
- Supprimer `@InjectRepository(Kyc)` et `kycRepo`
- Dans `create()` : supprimer la création du KYC, remplacer `reference` par `ref`, adapter aux nouveaux champs
- Dans `findOne()` : supprimer `relations: ['kyc', ...]`
- Changer `ClientStatut.VALIDE` → `StatutClient.ACTIF` (nouveau enum)
- Renommer `createur` → `createdBy`

**`clients/clients.module.ts`** — supprimer import `Kyc` :
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Client, AuditLog])],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
```

---

### 7.3 Prospects — adapter à la nouvelle entité

**`prospects/dto/create-prospect.dto.ts`** — nouveaux champs :
```typescript
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TypeEntite } from '../../common/enums';

export class CreateProspectDto {
  @IsString() @IsNotEmpty() nom: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsEnum(TypeEntite) typeEntite: TypeEntite;
  @IsOptional() @IsString() siret?: string;
  @IsOptional() @IsString() activite?: string;
  @IsOptional() @IsString() codeNaf?: string;
  @IsOptional() @IsString() adresse?: string;
  @IsOptional() @IsString() ville?: string;
  @IsOptional() @IsString() codePostal?: string;
  @IsOptional() @IsString() pays?: string;
  @IsOptional() @IsString() notes?: string;
}
```

**`prospects/prospects.service.ts`** :
- Supprimer toutes les références à `Kyc`
- Remplacer `ProspectStatut.CONVERTI` → `StatutKanban.CONVERTI`
- Dans `convertToClient()` : créer un `Client` sans KYC (juste les champs du prospect)
- Générer `ref` via `QWP-YYYY-NNN` pour les prospects (distinct de `QW-YYYY-NNN` pour les clients)
- Changer `createur` → `createdBy`

---

### 7.4 Audit — adapter les champs renommés

Dans tous les services qui créent des `AuditLog`, remplacer :
- `entiteType` → `ressource`
- `entiteId` → `ressourceId`

---

## Étape 8 — Mettre à jour `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from './users/entities/user.entity';
import { Prospect } from './prospects/entities/prospect.entity';
import { QuestionnaireAcceptation } from './questionnaires/entities/questionnaire-acceptation.entity';
import { Client } from './clients/entities/client.entity';
import { BeneficiaireEffectif } from './beneficiaires/entities/beneficiaire-effectif.entity';
import { Contact } from './contacts/entities/contact.entity';
import { Mission } from './missions/entities/mission.entity';
import { Document } from './documents/entities/document.entity';
import { LettreMission } from './lettres-mission/entities/lettre-mission.entity';
import { ScoreRisque } from './scoring/entities/score-risque.entity';
import { PlanningEtape } from './planning/entities/planning-etape.entity';
import { Obligation } from './obligations/entities/obligation.entity';
import { OperationSensible } from './operations-sensibles/entities/operation-sensible.entity';
import { AuditLog } from './audit/entities/audit-log.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProspectsModule } from './prospects/prospects.module';
import { QuestionnairesModule } from './questionnaires/questionnaires.module';
import { ClientsModule } from './clients/clients.module';
import { BeneficiairesModule } from './beneficiaires/beneficiaires.module';
import { ContactsModule } from './contacts/contacts.module';
import { MissionsModule } from './missions/missions.module';
import { DocumentsModule } from './documents/documents.module';
import { LettresMissionModule } from './lettres-mission/lettres-mission.module';
import { ScoringModule } from './scoring/scoring.module';
import { PlanningModule } from './planning/planning.module';
import { ObligationsModule } from './obligations/obligations.module';
import { OperationsSensiblesModule } from './operations-sensibles/operations-sensibles.module';
import { AuditModule } from './audit/audit.module';

const ALL_ENTITIES = [
  User, Prospect, QuestionnaireAcceptation, Client,
  BeneficiaireEffectif, Contact, Mission, Document,
  LettreMission, ScoreRisque, PlanningEtape, Obligation,
  OperationSensible, AuditLog,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: ALL_ENTITIES,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      synchronize: false,
    }),
    AuthModule, UsersModule, ProspectsModule, QuestionnairesModule,
    ClientsModule, BeneficiairesModule, ContactsModule, MissionsModule,
    DocumentsModule, LettresMissionModule, ScoringModule, PlanningModule,
    ObligationsModule, OperationsSensiblesModule, AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## Étape 9 — Mettre à jour `data-source.ts`

Remplacer la liste d'entités par `ALL_ENTITIES` (les 14 entités).

```typescript
import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
config();

// importer les 14 entités (même liste que app.module.ts)

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ALL_ENTITIES,
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/migrations/*.js'
      : 'src/migrations/*.ts',
  ],
  synchronize: false,
});
```

---

## Étape 10 — Créer la migration V2

**Créer** : `backend/src/migrations/1782000000000-V2Schema.ts`

La migration doit créer les 14 tables dans l'ordre des FK (voir [modelisation-bdd.md](./modelisation-bdd.md) §9).

Ordre de création :
1. `users`
2. `prospects`
3. `questionnaire_acceptation`
4. `clients`
5. `beneficiaire_effectif`
6. `contacts`
7. `missions`
8. `documents`
9. `lettre_mission`
10. `score_risque`
11. `planning_etape`
12. `obligations`
13. `operation_sensible`
14. `audit_logs`

Générer automatiquement :
```bash
cd backend
npm run typeorm migration:generate -- src/migrations/1782000000000-V2Schema -d src/data-source.ts
```

> Si la génération automatique ne fonctionne pas (TypeScript non compilé), tu peux écrire la migration à la main en SQL pur via `queryRunner.query(...)`. Un exemple de template est fourni ci-dessous.

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2Schema1782000000000 implements MigrationInterface {
  name = 'V2Schema1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "public"."role_enum" AS ENUM(
        'COLLABORATEUR', 'RESPONSABLE', 'EXPERT_COMPTABLE', 'ADMIN'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "email"        VARCHAR(255) NOT NULL,
        "passwordHash" VARCHAR(255) NOT NULL,
        "role"         "public"."role_enum" NOT NULL DEFAULT 'COLLABORATEUR',
        "prenom"       VARCHAR(100) NOT NULL,
        "nom"          VARCHAR(100) NOT NULL,
        "isActive"     BOOLEAN      NOT NULL DEFAULT true,
        "lastLoginAt"  TIMESTAMPTZ,
        "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deletedAt"    TIMESTAMPTZ,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // ... (voir modelisation-bdd.md pour le DDL complet de chaque table)
    // Continuer avec prospects, questionnaire_acceptation, clients (avec tous les champs KYC), etc.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // DROP dans l'ordre inverse des FK
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operation_sensible" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "obligations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "planning_etape" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "score_risque" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lettre_mission" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "missions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "beneficiaire_effectif" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questionnaire_acceptation" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prospects" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."role_enum"`);
    // ... DROP les autres enums
  }
}
```

---

## Étape 11 — Mettre à jour le seed

**`database/seed.ts`** — adapter les imports et enum :

```typescript
import { Role } from '../common/enums';
// ...
const admin = usersRepo.create({
  email: 'admin@qw-app.fr',
  passwordHash: await hash('Admin1234!', 10),
  role: Role.ADMIN,
  prenom: 'Admin',
  nom: 'QW',
  isActive: true,
});
```

---

## Étape 12 — Vérifier que tout compile

```bash
cd backend
npm run build
```

Corriger les erreurs TypeScript une par une. Les erreurs les plus probables :
- Imports vers `../kyc/...` qui subsistent → les supprimer
- `UserRole` utilisé dans les guards → remplacer par `Role` depuis `common/enums`
- `entiteType`/`entiteId` dans les services → remplacer par `ressource`/`ressourceId`
- `ClientStatut.EN_COURS`/`VALIDE`/`REJETE` → remplacer par `StatutClient.ACTIF`/etc.
- `ProspectStatut.CONVERTI` → `StatutKanban.CONVERTI`
- `client.reference` → `client.ref`
- `client.createur` → `client.createdBy`

---

## Étape 13 — Lancer et tester

```bash
# Démarrer le backend
cd backend
npm run start:dev

# Lancer le seed (si applicable)
npm run seed

# Tester les endpoints clés
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qw-app.fr","password":"Admin1234!"}'
```

---

## Récapitulatif — ordre d'exécution

```
0. docker compose down -v && docker compose up -d
1. rm -rf backend/src/kyc
2. rm backend/src/migrations/*.ts
3. Créer src/common/enums/index.ts
4. Réécrire les 6 entités existantes
5. Créer les 8 nouvelles entités
6. Créer les 8 nouveaux modules (dto + service + controller + module)
7. Mettre à jour scoring.service.ts, clients.service.ts, prospects.service.ts
8. Corriger les références AuditLog (entiteType → ressource)
9. Mettre à jour app.module.ts + data-source.ts
10. Créer la migration V2 (génération auto ou SQL manuel)
11. Mettre à jour database/seed.ts
12. npm run build
13. npm run start:dev
```
