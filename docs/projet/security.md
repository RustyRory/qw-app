# Sécurité

QW-App traite des données personnelles et financières sensibles (KYC, pièces d'identité, bénéficiaires effectifs, opérations suspectes). Les exigences ci-dessous découlent à la fois des bonnes pratiques applicatives standard et des obligations réglementaires LCB-FT / RGPD propres au domaine.

---

## 1. RBAC — matrice des droits

4 rôles, stockés en base sous forme d'enum `Role` (`COLLABORATEUR`, `RESPONSABLE`, `EXPERT_COMPTABLE`, `ADMIN`).

| Action | Collaborateur | Responsable | Expert-comptable | Administrateur |
|--------|:-------------:|:-----------:|:----------------:|:--------------:|
| Créer un prospect / gérer le Kanban | ✅ | ✅ | ✅ | ✅ |
| Saisir le KYC | ✅ | ✅ | ✅ | ✅ |
| Valider le questionnaire d'acceptation | ❌ | ✅ | ✅ | ✅ |
| Convertir prospect → client | ❌ | ✅ | ✅ | ✅ |
| Signer une lettre de mission | ❌ | ❌ | ✅ | ✅ |
| Exporter un rapport | ❌ | ✅ | ✅ | ✅ |
| Déclarer une opération sensible | ✅ | ✅ | ✅ | ✅ |
| Valider la relation d'affaire | ❌ | ❌ | ✅ | ✅ |
| Gérer les utilisateurs | ❌ | ❌ | ❌ | ✅ |
| Supprimer un dossier (soft delete) | ❌ | ❌ | ❌ | ✅ |

Implémentation backend : `JwtAuthGuard` (authentification) + `RolesGuard` couplé au décorateur `@Roles(...roles: Role[])` sur chaque route protégée. Implémentation frontend : hook `useRole()` + composant `<Guard roles={[...]}>` pour masquer les actions non autorisées (voir [workflow.md](./workflow.md)).

---

## 2. Authentification

| Exigence | Détail |
|----------|--------|
| Transport du JWT | Cookie **HttpOnly** + `SameSite=Strict` — jamais accessible en JavaScript côté client (protection XSS) |
| Durée de vie | Expiration courte (ex. 1h), pas de refresh token en MVP |
| Hash mot de passe | bcrypt, 12 rounds minimum |
| Énumération de comptes | Même message d'erreur pour email inconnu et mot de passe incorrect |
| Compte désactivé | `isActive = false` → refus de connexion avant même la comparaison du hash |
| CSRF | Couvert par `SameSite=Strict` sur le cookie de session |

> Le cookie HttpOnly remplace le stockage en `localStorage` envisagé dans une version antérieure du projet : un token en `localStorage` est lisible par tout script injecté (XSS), ce qui est incompatible avec la sensibilité des données traitées (LCB-FT).

---

## 3. Backend

- [ ] `JwtAuthGuard` sur toutes les routes protégées, lit le JWT depuis le cookie HttpOnly
- [ ] `RolesGuard` + `@Roles()` sur les routes soumises à des droits spécifiques
- [ ] `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)
- [ ] CORS restreint à l'URL du frontend, `credentials: true` (nécessaire pour le cookie cross-origin en dev)
- [ ] Rate limiting sur `/api/auth/login` (ex. 10 req/min par IP)
- [ ] Requêtes SQL exclusivement via TypeORM (pas de requêtes brutes avec données utilisateur non paramétrées)
- [ ] Filtrage par rôle au niveau service (ex. un collaborateur ne voit que ses propres prospects/clients), pas uniquement côté frontend
- [ ] Toute action sensible (création, modification, validation, suppression, lecture de document) déclenche une entrée `AuditLog`

---

## 4. Documents (KYC, lettres de mission)

Les documents traités (pièces d'identité, Kbis, justificatifs, lettres de mission signées) sont parmi les données les plus sensibles de l'application. Un stockage auto-hébergé sur le VPS applicatif (ex. Minio en conteneur Docker à côté du backend) a été écarté : il ferait porter au cabinet seul la responsabilité de la disponibilité, de la sauvegarde et de la sécurité physique/logique de ces fichiers, sans les certifications qu'apporte un prestataire spécialisé. Le stockage est donc délégué à un **prestataire externe managé**.

| Exigence | Implémentation |
|----------|----------------|
| Prestataire | **OVHcloud Object Storage** (S3-compatible) — hébergeur français, datacenters en France |
| Chiffrement au repos | AES-256, géré par le prestataire |
| Chiffrement en transit | HTTPS/TLS pour tous les échanges avec le bucket |
| Isolation | Bucket dédié à l'application, accès via clé de service backend uniquement (jamais exposée au frontend) |
| Accès | Jamais d'URL publique directe — uniquement via URL pré-signée à durée limitée (15 minutes), générée côté backend |
| Taille maximale | 10 Mo par document |
| Formats acceptés | PDF, JPEG, PNG, DOCX |
| Traçabilité | Chaque upload et chaque téléchargement génère une entrée `AuditLog` (`CREATE` / `READ`) |

> Le choix d'un prestataire plutôt que d'un auto-hébergement a été fait suite aux remarques du jury lors de la soutenance CDA : pour des documents d'identité et des données KYC, la garantie apportée par un hébergeur certifié (disponibilité, sauvegarde, sécurité physique) est attendue et ne doit pas reposer sur l'infrastructure VPS gérée par le cabinet lui-même.

---

## 5. RGPD et conformité LCB-FT

| Exigence | Implémentation |
|----------|---------------|
| Rétention des données | Soft delete (`deletedAt`) — conservation **5 ans** après la fin de la relation (art. L.561-12 CMF) |
| Droit à la suppression | Anonymisation des données personnelles à l'issue de la période de rétention |
| Localisation des données | Base PostgreSQL (VPS) et stockage objet OVHcloud Object Storage hébergés en France uniquement |
| Minimisation | Collecte limitée aux données strictement nécessaires à la conformité KYC |
| Traçabilité | `AuditLog` exhaustif sur toutes les actions touchant des données personnelles (auteur, date, action, ressource) |
| Logs applicatifs | Aucune donnée personnelle dans les logs techniques (console, fichiers) — seules les références (UUID) y figurent |

---

## 6. Frontend

- [ ] Aucun secret ni token manipulable en JavaScript (le JWT est dans un cookie HttpOnly, invisible pour le client)
- [ ] Validation des formulaires côté client (Zod) avant envoi, en complément — jamais en remplacement — de la validation serveur
- [ ] Affichage des erreurs serveur dans les formulaires
- [ ] Blocage du rendu tant que `useAuth.ready === false` (pas de flash de contenu protégé)
- [ ] Masquage des actions non autorisées via `<Guard roles={[...]}>`, en sachant que c'est un confort d'UX — la vérification de droit qui compte est toujours côté backend
