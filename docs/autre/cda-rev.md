# Plan de révision CDA — QW-App

> **8 piliers** · Cliquer sur un topic pour approfondir avec Claude

---

## 1. Architecture & Conception

### Patterns d'architecture

#### MVC vs 3-couches

##### MVC (Model-View-Controller)

Pattern de **présentation** qui sépare les responsabilités d'une interface utilisateur.

```
Utilisateur
    │
    ▼
┌──────────┐   action    ┌──────────────┐   lit/écrit   ┌────────┐
│   View   │ ──────────► │  Controller  │ ◄────────────► │ Model  │
│  (UI)    │ ◄────────── │  (logique)   │               │(données│
└──────────┘   met à     └──────────────┘               │& règles│
               jour                                      └────────┘
```

| Composant | Rôle | Exemple NestJS |
|-----------|------|----------------|
| **Model** | Données + règles métier | Entité TypeORM, Service |
| **View** | Présentation à l'utilisateur | Template, réponse JSON |
| **Controller** | Reçoit les requêtes, orchestre | `@Controller()` |

##### Architecture 3-couches (3-tier)

Pattern d'**organisation globale** d'une application, indépendant du pattern de présentation.

```
┌─────────────────────────────────┐
│   Couche Présentation           │  HTTP, REST, GraphQL
│   (Controllers, Routes)         │
├─────────────────────────────────┤
│   Couche Métier                 │  Règles, transformations,
│   (Services, Use Cases)         │  validations
├─────────────────────────────────┤
│   Couche Accès aux données      │  SQL, ORM, cache
│   (Repositories, DAOs)          │
└─────────────────────────────────┘
```

##### Comparaison

| | MVC | 3-couches |
|--|-----|-----------|
| **Portée** | Pattern de présentation | Architecture applicative |
| **Objectif** | Séparer UI / logique / données | Séparer responsabilités techniques |
| **Niveau** | Design pattern | Style architectural |
| **Compatibilité** | Peut vivre dans la couche présentation | Englobe MVC |

> **Ils ne s'opposent pas** : une appli peut utiliser 3-couches globalement avec MVC dans la couche présentation.

##### Dans QW-App (NestJS)

```
src/
├── prospect/
│   ├── prospect.controller.ts   ← Couche Présentation (+ MVC Controller)
│   ├── prospect.service.ts      ← Couche Métier
│   └── prospect.repository.ts   ← Couche Accès aux données
```

```typescript
@Controller('prospects')
export class ProspectController {
  constructor(private readonly prospectService: ProspectService) {}

  @Post()
  create(@Body() dto: CreateProspectDto) {
    return this.prospectService.create(dto);
  }
}

@Injectable()
export class ProspectService {
  constructor(private readonly repo: ProspectRepository) {}

  async create(dto: CreateProspectDto) {
    return this.repo.save(dto);
  }
}
```

##### Points clés CDA

- **MVC** = pattern de présentation (UI-oriented)
- **3-couches** = architecture technique (séparation des responsabilités)
- NestJS impose implicitement les 3-couches via ses modules
- La couche métier ne doit **jamais** importer un ORM ou une dépendance HTTP
- Le Controller ne contient **aucune logique métier**

---

#### Architecture hexagonale

##### Principe

Aussi appelée **Ports & Adapters**. Isole le domaine métier au centre ; les interactions externes (BDD, HTTP, email) sont des adaptateurs branchés sur des ports (interfaces).

```
             ┌──────────────────────────────┐
  HTTP  ──►  │  Driving    ┌─────────────┐  │
  CLI   ──►  │  Adapters ──►   DOMAINE   │  │
  Tests ──►  │             │  (logique   │  │
             │             │   métier)   │  │
             │  Driven  ◄──┤             │  │
  BDD   ◄──  │  Adapters   └─────────────┘  │
  Email ◄──  └──────────────────────────────┘
```

| Concept | Rôle |
|---------|------|
| **Port** | Interface définie par le domaine |
| **Adaptateur Driving** | Déclenche le domaine (Controller HTTP, CLI) |
| **Adaptateur Driven** | Implémente un port (Repository SQL, client SMTP) |

##### Exemple NestJS

```typescript
// Port (interface définie par le domaine — ne dépend de rien)
export interface IProspectRepository {
  findById(id: string): Promise<Prospect>;
  save(prospect: Prospect): Promise<Prospect>;
}

// Adaptateur driven (TypeORM — implémente le port)
@Injectable()
export class TypeOrmProspectRepository implements IProspectRepository {
  constructor(@InjectRepository(Prospect) private orm: Repository<Prospect>) {}

  findById(id: string) { return this.orm.findOneBy({ id }); }
  save(prospect: Prospect) { return this.orm.save(prospect); }
}

// Le service dépend du port, pas de l'implémentation
@Injectable()
export class ProspectService {
  constructor(
    @Inject('IProspectRepository') private repo: IProspectRepository,
  ) {}
}
```

##### Points clés CDA

- Les dépendances vont **toujours vers l'intérieur** (le domaine ne dépend de rien)
- Hexagonale ≠ 3-couches : ici le domaine est totalement découplé des techno externes
- Testable sans BDD ni HTTP (on mock les ports)
- Facilite le swap d'implémentation (PostgreSQL → MongoDB)

---

#### Monolithe vs microservices

##### Monolithe

Une seule application déployée, toutes les fonctionnalités ensemble.

```
┌─────────────────────────┐
│  Auth │  KYC │  Notifs  │
│       Une BDD           │
└─────────────────────────┘
      Deploy global
```

##### Microservices

Ensemble de petits services indépendants, chacun responsable d'un domaine.

```
┌──────────┐   ┌──────────┐  ┌──────────┐
│  Auth    │   │   KYC    │  │  Notifs  │
│ Service  │   │ Service  │  │ Service  │
└────┬─────┘   └────┬─────┘  └────┬─────┘
     └──────────────┴─────────────┘
              Message Bus
```

##### Comparaison

| Critère | Monolithe | Microservices |
|---------|-----------|---------------|
| **Complexité initiale** | Faible | Haute |
| **Scalabilité** | Globale | Par service |
| **Déploiement** | Simple | Complexe (orchestration) |
| **Communication** | In-process (rapide) | Réseau (latence) |
| **Transactions** | ACID natives | Saga pattern |
| **Adapté pour** | Startup, équipe réduite | Grande équipe, fort trafic |

##### Points clés CDA

- **QW-App = Monolithe** (NestJS + Next.js). Justifié : équipe réduite, domaine unique
- Le monolithe n'est pas un anti-pattern — c'est souvent le bon choix de départ
- "Modular monolith" = monolithe avec modules bien isolés, facilite une migration future
- Les microservices multiplient les points de défaillance réseau

---

#### DDD (Domain-Driven Design)

##### Principe

Approche centrée sur le **domaine métier**, en alignant le code avec le vocabulaire des experts métier.

| Concept | Description | Exemple QW-App |
|---------|-------------|----------------|
| **Ubiquitous Language** | Vocabulaire commun dev/métier | "Prospect", "Dossier KYC" |
| **Bounded Context** | Frontière d'un sous-domaine | Auth, KYC, Notifications |
| **Entity** | Objet avec identité propre | `Prospect` (a un `id`) |
| **Value Object** | Objet sans identité, défini par ses valeurs | `Email`, `Score` |
| **Aggregate** | Cluster d'entités cohérentes | `Prospect` + `Documents` |
| **Repository** | Abstraction d'accès aux aggregates | `ProspectRepository` |
| **Domain Event** | Événement métier significatif | `ProspectValidated` |

##### Exemple

```typescript
// Value Object
class Email {
  private readonly value: string;
  constructor(value: string) {
    if (!value.includes('@')) throw new Error('Email invalide');
    this.value = value;
  }
  toString() { return this.value; }
}

// Entity (Aggregate Root)
class Prospect {
  private status: ProspectStatus = ProspectStatus.PENDING;

  validate(): ProspectValidated {
    if (this.status !== ProspectStatus.DOCUMENTS_SUBMITTED)
      throw new Error('Transition invalide');
    this.status = ProspectStatus.VALIDATED;
    return new ProspectValidated(this.id); // Domain Event
  }
}
```

##### Points clés CDA

- DDD = **philosophie de conception**, pas un pattern technique
- Le code doit parler le même langage que le métier
- Appliquer DDD complet sur un petit projet = over-engineering
- Le Bounded Context délimite où un terme a un sens précis

---

#### SOLID

| Principe | Nom | Règle |
|----------|-----|-------|
| **S** | Single Responsibility | Une classe = une raison de changer |
| **O** | Open/Closed | Ouvert à l'extension, fermé à la modification |
| **L** | Liskov Substitution | Un sous-type remplace son parent sans casser le code |
| **I** | Interface Segregation | Préférer plusieurs petites interfaces à une grande |
| **D** | Dependency Inversion | Dépendre des abstractions, pas des implémentations |

##### Exemples NestJS

```typescript
// S — Single Responsibility
// ❌ Service qui valide ET envoie l'email
class ProspectService { createAndNotify(dto) { /* valide + mail */ } }

// ✅ Responsabilités séparées
class ProspectService { create(dto) {} }
class NotificationService { sendWelcome(prospect) {} }

// O — Open/Closed
// ✅ Ajouter un type de scoring sans modifier ScoringService
interface IScoringStrategy { calculate(p: Prospect): number; }
class StandardScoring implements IScoringStrategy { ... }
class EnhancedScoring implements IScoringStrategy { ... }

// D — Dependency Inversion
// ❌ Couplage fort à l'implémentation
class ProspectService {
  private repo = new TypeOrmProspectRepository();
}
// ✅ Dépend de l'abstraction
class ProspectService {
  constructor(@Inject('IProspectRepository') private repo: IProspectRepository) {}
}
```

##### Points clés CDA

- SOLID guide vers un code **maintenable et testable**
- NestJS facilite **D** via son système de DI
- **S** est le plus souvent violé : un service qui fait trop de choses
- **O** s'applique avec les stratégies, décorateurs, plugins

---

### Principes de conception

#### SoC (Separation of Concerns)

##### Principe

Chaque module/classe/fonction ne gère qu'**une seule préoccupation** (concern).

```
Sans SoC :                       Avec SoC :
┌─────────────────────┐          ┌──────────┐ ┌──────────┐ ┌──────────┐
│ ProspectController  │          │Controller│ │ Service  │ │   Repo   │
│ - valide la req     │  ──►     │- routing │ │- métier  │ │- SQL     │
│ - logique métier    │          │- parsing │ │- règles  │ │- ORM     │
│ - requête SQL       │          └──────────┘ └──────────┘ └──────────┘
│ - formate réponse   │
└─────────────────────┘
```

##### Dans QW-App

| Concern | Responsable |
|---------|------------|
| Routing & parsing HTTP | Controller |
| Règles métier | Service |
| Authentification/autorisation | Guard |
| Validation des DTOs | Pipe |
| Accès BDD | Repository |

##### Points clés CDA

- SoC est le principe fondateur derrière MVC, 3-couches, hexagonale
- Facilite les tests unitaires (chaque concern testable isolément)
- Violation typique : logique métier dans un Controller

---

#### IoC & DI (Inversion of Control & Dependency Injection)

##### Définitions

**IoC :** inverser le contrôle de la création des dépendances — ce n'est plus la classe qui crée ses dépendances, c'est un conteneur extérieur.

**DI :** mécanisme concret d'IoC — les dépendances sont **injectées** depuis l'extérieur.

```
Sans IoC :                       Avec IoC (DI) :
┌────────────────────┐           ┌──────────────────┐
│  ProspectService   │           │ NestJS Container │
│  constructor() {   │           │ (IoC Container)  │
│    this.repo =     │           └────────┬─────────┘
│     new TypeOrm    │                    │ injecte
│     Repository()   │           ┌────────▼──────────┐
│  }                 │           │  ProspectService  │
└────────────────────┘           │  constructor(     │
   ↑ couplage fort               │    private repo:  │
                                 │    IRepo          │
                                 │  ) {}             │
                                 └───────────────────┘
```

##### Exemple NestJS

```typescript
@Injectable()
export class ProspectService {
  // NestJS injecte automatiquement ProspectRepository
  constructor(private readonly repo: ProspectRepository) {}
}

@Module({
  providers: [ProspectService, ProspectRepository],
})
export class ProspectModule {}
```

##### Points clés CDA

- IoC = principe · DI = implémentation de IoC
- `@Injectable()` = "ce service peut être injecté dans le conteneur"
- Avantages : testabilité (mock facile), découplage, réutilisabilité
- NestJS gère le cycle de vie des instances via son conteneur DI

---

#### Couplage & cohésion

##### Définitions

**Couplage :** degré de dépendance entre modules. → **Objectif : faible couplage.**

**Cohésion :** degré auquel les éléments d'un module appartiennent ensemble. → **Objectif : forte cohésion.**

##### Couplage

```typescript
// ❌ Couplage fort : imports directs d'implémentations
class ProspectService {
  private userService = new UserService();
  private emailService = new EmailService();
}

// ✅ Couplage faible : dépend des interfaces
class ProspectService {
  constructor(
    private userService: IUserService,
    private notif: INotificationService,
  ) {}
}
```

| | Couplage fort | Couplage faible |
|-|---------------|-----------------|
| **Tests** | Difficiles (besoin de tout) | Faciles (mock les interfaces) |
| **Modification** | Effet cascade | Impacte peu |
| **Réutilisation** | Faible | Haute |

##### Cohésion

```typescript
// ❌ Faible cohésion : éléments sans rapport
class UtilsService {
  formatDate() {}
  sendEmail() {}
  calculateScore() {}
}

// ✅ Forte cohésion : tout appartient au même domaine
class ScoringService {
  calculateRiskScore() {}
  normalizeScore() {}
  getScoreLabel() {}
}
```

##### Points clés CDA

- Règle d'or : **faible couplage + forte cohésion**
- Le couplage se mesure au nombre de dépendances externes d'un module
- La cohésion se mesure à la "logique commune" des éléments

---

#### Monorepo & workspaces

##### Concept

**Monorepo :** un seul dépôt git pour plusieurs packages/apps.
**Workspaces :** fonctionnalité npm/yarn/pnpm pour partager les dépendances.

```
qw-app/ (monorepo)
├── apps/
│   ├── frontend/     (Next.js)
│   └── backend/      (NestJS)
├── packages/
│   └── shared-types/ (types partagés TS)
├── package.json      (workspace root)
└── turbo.json        (Turborepo — pipeline de build)
```

##### Avantages / Inconvénients

| Avantages | Inconvénients |
|-----------|---------------|
| Partage de code facile (types, utils) | Clone/install plus lourd |
| Refactoring atomique (un seul PR) | Risque de couplage accidentel |
| CI/CD unifié | Configuration plus complexe |

##### Points clés CDA

- Différent du "multirepo" où chaque projet a son propre dépôt
- Outils : Turborepo, Nx, pnpm workspaces
- `turbo.json` définit le pipeline de build (parallélisme, cache)

---

## 2. NestJS

### Méthodologie de développement par ressource

#### Ordre : Migration → Entity → Seed → DTO → Service → Controller → Page

Pour chaque module, **toujours suivre cet ordre**. Chaque étape dépend de la précédente.

```
Migration → Entity → Seed → DTO → Service → Controller → Page Next.js
```

| Étape | Fichier | Rôle |
|-------|---------|------|
| **Migration** | `database/migrations/<ts>-CreateClient.ts` | Crée/modifie le schéma PostgreSQL (versionnée git) |
| **Entity** | `clients/entities/client.entity.ts` | Mappe la table en objet TypeScript (TypeORM) |
| **Seed** | `database/seed.ts` | Données de test reproductibles (`npm run seed`) |
| **DTO** | `clients/dto/create-client.dto.ts` | Valide et type le body des requêtes (`class-validator`) |
| **Service** | `clients/clients.service.ts` | Logique métier + accès BDD + audit + cache |
| **Controller** | `clients/clients.controller.ts` | Routes HTTP + guards + délégation au service |
| **Page** | `app/dashboard/clients/page.tsx` | UI Next.js — consomme l'API via `apiFetch` |

##### Exemple complet — ClientsModule

```typescript
// 1. Entity
@Entity()
export class Client {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() firstName: string;
  @Column({ unique: true }) email: string;
  @Column() ref: string;          // QW-2025-001
  @OneToOne(() => Kyc, { cascade: true }) @JoinColumn() kyc: Kyc;
  @ManyToOne(() => User) creator: User;
  @DeleteDateColumn() deletedAt: Date | null;  // soft delete (LCB-FT 5 ans)
  @CreateDateColumn() createdAt: Date;
}

// 2. DTO
export class CreateClientDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsEmail()                email: string;
}

// 3. Service
@Injectable()
export class ClientsService {
  async create(dto: CreateClientDto, creatorId: string): Promise<Client> {
    const ref = await this.generateRef();               // QW-YYYY-XXX
    const client = await this.clientRepo.save({
      ...dto, ref, creator: { id: creatorId },
      kyc: this.kycRepo.create({}),                     // fiche KYC vide liée
    });
    await this.auditService.log(creatorId, 'CREATE', 'CLIENT', client.id);
    return client;
  }

  async findAll(user: RequestUser): Promise<Client[]> {
    if (user.role === Role.COLLABORATEUR)
      return this.clientRepo.find({ where: { creator: { id: user.id } } });
    return this.clientRepo.find();                       // responsable/admin
  }
}

// 4. Controller
@Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  @Post()
  create(@Body() dto: CreateClientDto, @Req() req) {
    return this.clientsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Req() req) {
    return this.clientsService.findAll(req.user);
  }

  @Roles(Role.RESPONSABLE, Role.ADMIN)
  @Patch(':id/validate')
  validate(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.clientsService.validate(id, req.user.id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.softDelete(id);           // deletedAt = NOW()
  }
}
```

##### Points clés CDA

- **Jamais** de logique métier dans le Controller
- **Jamais** d'accès BDD direct dans le Controller
- L'ordre garantit que chaque couche s'appuie sur ce qui existe déjà
- `synchronize: false` → la migration est la seule source de vérité pour le schéma

---

### Fondamentaux

#### Modules NestJS

Le module est l'**unité organisationnelle** de NestJS. Chaque feature est encapsulée dans un module.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Prospect])],  // modules/entités importés
  controllers: [ProspectController],                 // routes
  providers: [ProspectService, ProspectRepository],  // services DI
  exports: [ProspectService],                        // accessible aux autres modules
})
export class ProspectModule {}
```

##### Arborescence type

```
AppModule (root)
├── AuthModule
├── ProspectModule
│   ├── ProspectController
│   ├── ProspectService
│   └── ProspectRepository
├── KycModule
└── DatabaseModule (@Global)
```

##### Modules spéciaux

| Décorateur / Pattern | Rôle |
|---------------------|------|
| `@Global()` | Providers disponibles partout sans import explicite |
| `forRoot(config)` | Module configuré une fois à la racine |
| `forFeature(entities)` | Module configuré par feature (ex: TypeORM par entité) |

##### Points clés CDA

- Un module = un domaine fonctionnel (SoC au niveau module)
- `exports` contrôle l'encapsulation : seul ce qui est exporté est utilisable de l'extérieur
- `forRoot()` / `forFeature()` = pattern des modules dynamiques

---

#### Cycle de vie d'une requête

```
Requête HTTP
     │
     ▼
Middleware          ← transformation globale, logging (avant tout)
     │
     ▼
Guard               ← auth/authorisation → rejette avec 401/403
     │
     ▼
Interceptor (before) ← timing, cache, transformation de la req
     │
     ▼
Pipe                ← validation et transformation des params → 400
     │
     ▼
Route Handler       ← méthode du Controller
     │
     ▼
Service / Logique
     │
     ▼
Interceptor (after) ← transformation de la réponse
     │
     ▼
Exception Filter    ← attrape toute erreur levée dans le cycle
     │
     ▼
Réponse HTTP
```

##### Points clés CDA

- L'ordre est **strict** et immuable : Middleware → Guard → Interceptor → Pipe → Handler
- Un Guard peut court-circuiter avant le handler (retourne `false` → 403)
- L'Exception Filter est le dernier maillon — attrape les erreurs de tout le cycle
- Middleware = héritage Express, Guard = spécifique NestJS (a accès à l'`ExecutionContext`)

---

#### Guards

Décident si une requête peut **accéder à la route** (retournent `true` ou `false`).

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(' ')[1];
    try {
      req.user = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

##### Portées d'application

```typescript
// Global
app.useGlobalGuards(new AuthGuard());

// Contrôleur
@UseGuards(AuthGuard)
@Controller('prospects')

// Route uniquement
@UseGuards(RolesGuard)
@Delete(':id')
remove() {}
```

##### Points clés CDA

- Guard ≠ Middleware : le Guard accède à l'`ExecutionContext` NestJS (type de handler, metadata)
- `canActivate()` retourne `false` → `ForbiddenException` (403) automatique
- On peut chaîner plusieurs Guards : `@UseGuards(AuthGuard, RolesGuard)`
- Utilisé pour auth, RBAC, ownership checks

---

#### Interceptors

Permettent d'**intercepter et transformer** les requêtes et réponses (avant et après le handler).

```typescript
// Logging de durée
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`Durée: ${Date.now() - start}ms`)),
    );
  }
}

// Wrapper de réponse uniforme
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({ success: true, data, timestamp: new Date().toISOString() })),
    );
  }
}
```

##### Cas d'usage

- Logging des temps de réponse
- Wrapper de réponse uniforme `{ success, data }`
- Cache (court-circuiter le handler et retourner depuis le cache)
- Transformation/sérialisation des données

##### Points clés CDA

- Basé sur RxJS `Observable` — `next.handle()` = appel du handler
- Peut modifier la réponse **après** le handler (contrairement au Guard)
- `tap()` = effet de bord sans modifier la valeur, `map()` = transformation

---

#### Pipes & validation

Transforment et **valident** les données entrantes (params, body, query).

```typescript
// DTO avec class-validator
export class CreateProspectDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsInt()
  @Min(18)
  age: number;
}

// Activation globale (main.ts)
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // supprime les champs non décorés
  forbidNonWhitelisted: true, // erreur si champ inconnu reçu
  transform: true,           // transforme les types ("42" → 42)
}));

// Controller
@Post()
create(@Body() dto: CreateProspectDto) { // validé automatiquement
  return this.service.create(dto);
}

// Pipes intégrés sur les params
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {}
```

##### Pipes built-in

| Pipe | Rôle |
|------|------|
| `ValidationPipe` | Valide via `class-validator` |
| `ParseIntPipe` | `"42"` → `42` |
| `ParseUUIDPipe` | Valide le format UUID |
| `DefaultValuePipe` | Applique une valeur par défaut |

##### Points clés CDA

- `ValidationPipe` + `class-validator` = combo standard NestJS
- `whitelist: true` est une mesure de sécurité (évite l'injection de champs superflus)
- Si validation échoue → `400 Bad Request` avec détail des erreurs

---

#### Middleware

Fonctions exécutées **avant** le cycle Guard/Interceptor/Pipe. Accès direct à `req` et `res` Express.

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url} — ${new Date().toISOString()}`);
    next(); // obligatoire pour continuer la chaîne
  }
}

// Application dans le module
@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // ou { path: 'prospects', method: RequestMethod.GET }
  }
}
```

##### Middleware vs Guard

| | Middleware | Guard |
|-|------------|-------|
| **Accès NestJS** | Non (req/res brut Express) | Oui (ExecutionContext) |
| **Ordre** | Avant les Guards | Après les Middleware |
| **Usage typique** | Logging, CORS, parsing | Auth, RBAC |

##### Points clés CDA

- Middleware est hérité d'Express.js — identique à `app.use()` classique
- `next()` doit toujours être appelé (sinon la requête est bloquée indéfiniment)
- Pour l'authentification, préférer un Guard (accès au contexte NestJS)

---

### Avancé

#### RBAC & decorators

##### Pattern RBAC dans NestJS

```typescript
// 1. Décorateur custom (attache des métadonnées)
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// 2. Guard qui lit les métadonnées
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    return required.some(role => user.roles?.includes(role));
  }
}

// 3. Utilisation
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Delete(':id')
remove(@Param('id') id: string) {}
```

##### Points clés CDA

- `SetMetadata` + `Reflector` = pattern standard RBAC NestJS
- Les Guards s'exécutent dans l'ordre : `AuthGuard` d'abord (token), `RolesGuard` ensuite (rôle)
- Décorateur custom = réutilisabilité + lisibilité (`@Roles(Role.ADMIN)` vs `@UseGuards(...)`)
- `getAllAndOverride` : prend la valeur du handler, sinon du controller

---

#### ConfigModule & `.env`

Gestion centralisée de la configuration et validation au démarrage.

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        REDIS_URL: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
    }),
  ],
})
export class AppModule {}

// Utilisation dans un service
@Injectable()
export class AuthService {
  constructor(private config: ConfigService) {}

  login() {
    const secret = this.config.get<string>('JWT_SECRET');
    // ...
  }
}
```

##### Points clés CDA

- Ne **jamais** hardcoder des secrets dans le code source
- `validationSchema` garantit que l'app ne démarre pas avec une config incomplète
- `.env` → dans `.gitignore` ; `.env.example` (sans valeurs réelles) → commité
- `isGlobal: true` → pas besoin d'importer `ConfigModule` dans chaque module

---

#### Scopes DI

Contrôle le **cycle de vie** des instances dans le conteneur NestJS.

| Scope | Instance créée | Cas d'usage |
|-------|---------------|-------------|
| `DEFAULT` (Singleton) | Une seule pour toute l'app | Services stateless (99% des cas) |
| `REQUEST` | Une par requête HTTP | Accès au contexte de la requête |
| `TRANSIENT` | Une à chaque injection | Services avec état interne mutable |

```typescript
// Singleton (défaut) — ne rien spécifier
@Injectable()
export class ProspectService {}

// Request scope
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private userId: string;
  set(id: string) { this.userId = id; }
  get() { return this.userId; }
}

// Injection dans un controller (devient lui aussi REQUEST-scoped)
@Controller()
export class ProspectController {
  constructor(private ctx: RequestContextService) {}
}
```

##### Points clés CDA

- `DEFAULT` (singleton) convient à 99% des cas (stateless)
- `REQUEST` scope crée une instance par requête → overhead mémoire
- Si un service `REQUEST` est injecté dans un singleton → le singleton devient aussi `REQUEST`
- `TRANSIENT` est rarement nécessaire

---

#### Exception filters

Attrapent les exceptions levées dans l'application et formatent la réponse d'erreur.

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}

// Application globale (main.ts)
app.useGlobalFilters(new HttpExceptionFilter());
```

##### Hiérarchie des exceptions NestJS

```
HttpException
├── BadRequestException        (400)
├── UnauthorizedException      (401)
├── ForbiddenException         (403)
├── NotFoundException          (404)
├── ConflictException          (409)
└── InternalServerErrorException (500)
```

##### Points clés CDA

- `@Catch()` sans argument attrape **toutes** les exceptions (même non-HTTP)
- Permet de normaliser le format des erreurs sur toute l'API
- NestJS a un filtre global par défaut : `{ statusCode, message, error }`
- L'Exception Filter est le **dernier maillon** du cycle de vie

---

## 3. Base de données

### SQL & modélisation

#### Normalisation

Processus d'organisation d'une BDD pour **réduire la redondance** et garantir l'intégrité des données.

| Forme | Règle | Violation typique |
|-------|-------|-------------------|
| **1NF** | Valeurs atomiques, pas de groupes répétés | Stocker `"Paris,Lyon"` dans un champ |
| **2NF** | 1NF + pas de dépendance partielle | Clé composée où une col dépend d'une partie de la clé |
| **3NF** | 2NF + pas de dépendance transitive | `ville → code_postal` stocké dans la table `commande` |

```sql
-- ❌ Non normalisé (violation 1NF et 3NF)
CREATE TABLE prospect (
  id UUID,
  nom TEXT,
  email TEXT,
  ville TEXT,
  code_postal TEXT  -- dépend de ville, pas du prospect (transitive)
);

-- ✅ Normalisé
CREATE TABLE prospect (
  id UUID PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  ville_id INTEGER REFERENCES ville(id)
);

CREATE TABLE ville (
  id SERIAL PRIMARY KEY,
  nom TEXT,
  code_postal TEXT
);
```

##### Points clés CDA

- La **3NF** est l'objectif standard en production
- La **dénormalisation** est parfois intentionnelle pour la performance (ex : stocker le `total` d'une commande)
- La normalisation protège l'intégrité mais peut complexifier les requêtes (JOINs)

---

#### Relations TypeORM

```typescript
// One-to-One
@Entity()
export class Prospect {
  @OneToOne(() => KycDossier, { cascade: true })
  @JoinColumn()
  kyc: KycDossier;
}

// One-to-Many / Many-to-One
@Entity()
export class Prospect {
  @OneToMany(() => Document, doc => doc.prospect)
  documents: Document[];
}

@Entity()
export class Document {
  @ManyToOne(() => Prospect, prospect => prospect.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prospect_id' })
  prospect: Prospect;
}

// Many-to-Many
@Entity()
export class Prospect {
  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];
}
```

##### Options importantes

| Option | Effet |
|--------|-------|
| `cascade: true` | Sauvegarde/supprime les relations automatiquement via TypeORM |
| `eager: true` | Charge la relation automatiquement (attention perf, N+1) |
| `onDelete: 'CASCADE'` | Suppression en cascade côté PostgreSQL (DDL) |
| `nullable: false` | Colonne NOT NULL |

##### Points clés CDA

- `@JoinColumn()` définit la colonne de clé étrangère (côté Many ou owning side)
- `eager: true` peut générer des N+1 → préférer `leftJoinAndSelect()` dans QueryBuilder
- `cascade` TypeORM ≠ `ON DELETE CASCADE` SQL : l'un est géré par l'ORM, l'autre par la BDD

---

#### Index PostgreSQL

Un index accélère les lectures en créant une structure de données auxiliaire (B-tree par défaut).

```sql
-- Index simple
CREATE INDEX idx_prospect_email ON prospect(email);

-- Index unique
CREATE UNIQUE INDEX idx_prospect_email_unique ON prospect(email);

-- Index composite (l'ordre des colonnes compte)
CREATE INDEX idx_status_created ON prospect(status, created_at);

-- Index partiel
CREATE INDEX idx_prospect_active ON prospect(email) WHERE deleted_at IS NULL;
```

```typescript
// TypeORM
@Entity()
@Index(['status', 'createdAt'])
export class Prospect {
  @Column()
  @Index({ unique: true })
  email: string;
}
```

##### Quand indexer ?

| Oui | Non |
|-----|-----|
| Colonnes filtrées fréquemment (WHERE) | Petites tables (< 1000 lignes) |
| Colonnes de JOIN | Colonnes rarement filtrées |
| Colonnes de ORDER BY | Tables très souvent écrites (INSERT/UPDATE/DELETE) |
| Clés étrangères | Colonnes avec peu de valeurs distinctes (booléens) |

##### Points clés CDA

- Un index **ralentit les écritures** (mise à jour de la structure à chaque INSERT/UPDATE/DELETE)
- `EXPLAIN ANALYZE` pour vérifier qu'un index est bien utilisé par PostgreSQL
- PostgreSQL utilise B-tree par défaut (optimal pour `=`, `<`, `>`, `BETWEEN`)

---

#### Transactions ACID

Une transaction regroupe plusieurs opérations en une unité atomique.

| Propriété | Signification |
|-----------|--------------|
| **A**tomicité | Tout ou rien : si une op échoue, tout est annulé (ROLLBACK) |
| **C**ohérence | La BDD reste dans un état valide après la transaction |
| **I**solation | Les transactions concurrentes ne s'interfèrent pas |
| **D**urabilité | Une transaction validée survit aux pannes |

```typescript
// Transaction avec QueryRunner (TypeORM)
async transfer(fromId: string, toId: string, amount: number) {
  const qr = this.dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    await qr.manager.decrement(Account, { id: fromId }, 'balance', amount);
    await qr.manager.increment(Account, { id: toId }, 'balance', amount);
    await qr.commitTransaction();
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release(); // toujours libérer la connexion
  }
}
```

##### Niveaux d'isolation

| Niveau | Dirty Read | Non-repeatable Read | Phantom |
|--------|------------|---------------------|---------|
| Read Committed (défaut PG) | Non | Possible | Possible |
| Repeatable Read | Non | Non | Possible |
| Serializable | Non | Non | Non |

##### Points clés CDA

- PostgreSQL = `READ COMMITTED` par défaut
- `ROLLBACK` annule **toutes** les opérations de la transaction
- `finally { qr.release() }` est obligatoire pour éviter les fuites de connexions

---

#### Soft delete

Marquer un enregistrement comme supprimé sans le supprimer physiquement de la BDD.

```typescript
@Entity()
export class Prospect {
  @DeleteDateColumn()  // TypeORM gère automatiquement
  deletedAt: Date | null;
}

// Suppression douce — set deletedAt = NOW()
await repo.softDelete(id);

// Récupération (exclut automatiquement les soft-deleted)
await repo.findOne({ where: { id } });

// Inclure les soft-deleted
await repo.findOne({ where: { id }, withDeleted: true });

// Restauration
await repo.restore(id);
```

##### Avantages / Inconvénients

| Avantages | Inconvénients |
|-----------|---------------|
| Audit trail (historique complet) | La table grossit |
| Restauration possible | Requêtes à adapter (index partiel `WHERE deleted_at IS NULL`) |
| RGPD : suppression réelle différée | Complexité accrue |

##### Points clés CDA

- Indispensable pour l'audit trail (RGPD, conformité AML)
- TypeORM avec `@DeleteDateColumn` filtre automatiquement les enregistrements supprimés
- Pour le RGPD : le soft delete ≠ suppression des données personnelles → **anonymiser**

---

### TypeORM & migrations

#### Migrations TypeORM

Les migrations versionnent les **changements de schéma** de la BDD, à l'instar de git pour le code.

```bash
# Générer une migration (compare entités vs BDD)
npx typeorm migration:generate src/migrations/AddProspectScore -d src/data-source.ts

# Exécuter les migrations en attente
npx typeorm migration:run -d src/data-source.ts

# Annuler la dernière migration
npx typeorm migration:revert -d src/data-source.ts
```

```typescript
// Migration générée
export class AddProspectScore1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('prospect', new TableColumn({
      name: 'score',
      type: 'integer',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('prospect', 'score');
  }
}
```

##### Points clés CDA

- `synchronize: true` (dev uniquement) → **jamais en production** (peut supprimer des colonnes)
- Les fichiers de migration sont versionnés dans git avec le code
- `up()` applique le changement, `down()` le reverte
- En CI/CD : `migration:run` automatiquement au déploiement

---

#### Repository pattern

Abstraction de la couche d'accès aux données, isolant la logique de persistance du service.

```typescript
@Injectable()
export class ProspectRepository {
  constructor(
    @InjectRepository(Prospect)
    private readonly orm: Repository<Prospect>,
  ) {}

  findByEmail(email: string): Promise<Prospect | null> {
    return this.orm.findOne({ where: { email } });
  }

  findAllActive(): Promise<Prospect[]> {
    return this.orm
      .createQueryBuilder('p')
      .where('p.deletedAt IS NULL')
      .andWhere('p.status = :status', { status: 'ACTIVE' })
      .getMany();
  }

  save(data: Partial<Prospect>): Promise<Prospect> {
    return this.orm.save(data);
  }
}
```

| Repository Pattern | Accès ORM direct dans Service |
|-------------------|-------------------------------|
| Service découplé de TypeORM | Service couplé à TypeORM |
| Logique SQL centralisée | Queries dispersées dans les services |
| Facile à mocker dans les tests | Plus difficile à tester |

##### Points clés CDA

- Le service ne connaît pas TypeORM — seulement les méthodes du repository
- Facilite le swap d'ORM (hexagonale)
- TypeORM fournit un `Repository<T>` générique que l'on wrappe dans un custom repo

---

#### Query optimization

Techniques pour améliorer les performances des requêtes TypeORM/PostgreSQL.

```typescript
// ❌ Problème N+1 : une requête par prospect
const prospects = await repo.find();
for (const p of prospects) {
  const docs = await docRepo.find({ where: { prospectId: p.id } }); // N requêtes !
}

// ✅ Solution : JOIN en une seule requête
const prospects = await repo
  .createQueryBuilder('p')
  .leftJoinAndSelect('p.documents', 'doc')
  .getMany();

// ✅ Pagination (ne jamais retourner tout)
const [items, total] = await repo.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
  order: { createdAt: 'DESC' },
});

// ✅ SELECT partiel
const emails = await repo
  .createQueryBuilder('p')
  .select(['p.id', 'p.email'])
  .getMany();
```

##### Points clés CDA

- Le problème **N+1** est la cause n°1 de lenteur avec les ORMs
- `EXPLAIN ANALYZE` (PostgreSQL) pour diagnostiquer une requête lente
- Toujours paginer les listes (ne jamais retourner tous les enregistrements)
- Sélectionner uniquement les colonnes nécessaires (éviter `SELECT *` implicite)

---

#### Views SQL

Une vue est une **requête sauvegardée** présentée comme une table virtuelle.

```sql
-- Vue simple
CREATE VIEW prospect_summary AS
SELECT
  p.id,
  p.email,
  COUNT(d.id) AS document_count,
  k.status AS kyc_status
FROM prospect p
LEFT JOIN document d ON d.prospect_id = p.id
LEFT JOIN kyc_dossier k ON k.prospect_id = p.id
GROUP BY p.id, p.email, k.status;

-- Vue matérialisée (données cachées, refresh manuel)
CREATE MATERIALIZED VIEW prospect_stats AS
SELECT status, COUNT(*) AS total FROM prospect GROUP BY status;

REFRESH MATERIALIZED VIEW prospect_stats;
```

```typescript
// TypeORM @ViewEntity
@ViewEntity({
  expression: `SELECT p.id, p.email, COUNT(d.id) AS doc_count
               FROM prospect p
               LEFT JOIN document d ON d.prospect_id = p.id
               GROUP BY p.id, p.email`,
})
export class ProspectSummary {
  @ViewColumn() id: string;
  @ViewColumn() email: string;
  @ViewColumn() docCount: number;
}
```

##### Points clés CDA

- Vue simple = pas de stockage, requête exécutée à chaque `SELECT`
- Vue matérialisée = stockée physiquement, meilleures performances, mais potentiellement périmée
- Utile pour simplifier des requêtes complexes et les réutiliser dans l'ORM

---

## 4. Sécurité

### Auth & tokens

#### JWT (JSON Web Token)

Standard pour transmettre des informations de façon sécurisée entre parties via un token signé.

##### Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9        ← Header  (algo + type, base64)
.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiVVNFUiJ9  ← Payload (données, base64)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQ    ← Signature (HMAC-SHA256 avec secret)
```

```json
// Payload type
{
  "userId": "uuid-123",
  "role": "USER",
  "iat": 1700000000,
  "exp": 1700003600
}
```

##### Dans QW-App

```typescript
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private config: ConfigService) {}

  login(user: User) {
    const payload = { userId: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '1h',
      }),
    };
  }
}
```

##### Points clés CDA

- JWT est **stateless** : le serveur ne stocke pas de session
- Le payload est en base64 → **lisible par tous** (ne jamais y mettre de secret)
- La **signature** empêche la falsification du payload
- Si compromis : pas de révocation possible sans liste noire → tokens courts (15min)

---

#### bcrypt

Algorithme de **hachage de mots de passe** avec salt automatique et facteur de coût configurable.

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // 2^10 itérations ≈ 100ms

// Hachage
const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Vérification
const isValid = await bcrypt.compare(plainPassword, hash);

// Dans AuthService
async register(dto: RegisterDto) {
  const hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
  return this.userRepo.save({ ...dto, password: hash });
}

async validateUser(email: string, password: string) {
  const user = await this.userRepo.findByEmail(email);
  if (!user || !await bcrypt.compare(password, user.password)) return null;
  return user;
}
```

| Algo | Adapté mots de passe ? | Raison |
|------|----------------------|--------|
| MD5, SHA-256 | **Non** | Trop rapide (attaque brute-force facile) |
| **bcrypt** | **Oui** | Intentionnellement lent, salt intégré |
| **argon2** | **Oui** | Plus récent, résistant GPU/ASIC |

##### Points clés CDA

- bcrypt est intentionnellement **lent** — c'est une feature, pas un bug
- `saltRounds = 10` → ≈ 100ms (bon équilibre sécurité/performance)
- Le salt est inclus dans le hash → pas besoin de le stocker séparément
- **Ne jamais stocker un mot de passe en clair**

---

#### Auth vs Authz

| | Authentification (AuthN) | Autorisation (AuthZ) |
|-|--------------------------|----------------------|
| **Question** | Qui es-tu ? | As-tu le droit ? |
| **Mécanisme** | JWT, session, OAuth | RBAC, ACL, permissions |
| **Résultat** | Identité vérifiée | Accès accordé/refusé |
| **Erreur HTTP** | 401 Unauthorized | 403 Forbidden |
| **NestJS** | `AuthGuard` | `RolesGuard` |

```
Requête avec JWT
       │
       ▼
  AuthGuard       ← "Est-ce un utilisateur valide ?" → 401 si non
       │
       ▼
  RolesGuard      ← "A-t-il le bon rôle ?" → 403 si non
       │
       ▼
  Handler
```

##### Points clés CDA

- **401** = non authentifié ("je ne sais pas qui tu es")
- **403** = non autorisé ("je sais qui tu es, mais tu n'as pas le droit")
- L'authentification **précède toujours** l'autorisation
- Ne pas retourner 404 à la place de 403 pour cacher l'existence d'une ressource (sauf cas spécifique)

---

#### Refresh tokens

Système à **deux tokens** pour équilibrer sécurité et expérience utilisateur.

```
Login → access_token (15min) + refresh_token (7j)

Client fait ses requêtes avec access_token
                │
     access_token expiré
                │
                ▼
POST /auth/refresh + refresh_token
                │
                ▼
Nouveau access_token (+ rotation du refresh_token)
```

```typescript
async login(user: User) {
  const payload = { userId: user.id };
  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  const refreshToken = this.jwtService.sign(
    { ...payload, type: 'refresh' },
    { expiresIn: '7d' },
  );
  // Stocker le refresh token hashé en BDD (pour révocation)
  await this.storeRefreshToken(user.id, await bcrypt.hash(refreshToken, 10));
  return { accessToken, refreshToken };
}
```

##### Points clés CDA

- **Access token** : court (15min), envoyé dans chaque requête (`Authorization: Bearer`)
- **Refresh token** : long (7j), stocké dans un cookie `HttpOnly` uniquement
- Stocker le refresh token en BDD (hashé) permet la **révocation** (déconnexion forcée)
- **Rotation** : émettre un nouveau refresh token à chaque renouvellement

---

### Vulnérabilités & bonnes pratiques

#### Injection SQL

L'attaquant insère du SQL malveillant dans une entrée utilisateur non filtrée.

```sql
-- ❌ Vulnérable : concaténation directe
SELECT * FROM user WHERE email = '${email}'
-- Si email = "' OR '1'='1" → retourne tous les users !
-- Si email = "'; DROP TABLE user; --" → catastrophe

-- ✅ Protégé : paramètres préparés
SELECT * FROM user WHERE email = $1  -- PostgreSQL
```

```typescript
// ✅ TypeORM find() échappe automatiquement
await repo.findOne({ where: { email } });

// ✅ QueryBuilder avec paramètres nommés
await repo
  .createQueryBuilder('u')
  .where('u.email = :email', { email })
  .getOne();

// ❌ Dangereux : interpolation dans QueryBuilder
.where(`u.email = '${email}'`) // injection possible !
```

##### Points clés CDA

- Protection principale : **ne jamais interpoler** des entrées utilisateur dans du SQL
- TypeORM protège par défaut avec ses méthodes standard
- Principe du **moindre privilège** : le user DB n'a que les droits nécessaires (pas de DROP, pas de superuser)
- `ValidationPipe` + `class-validator` → filtrer les entrées à la couche HTTP

---

#### XSS & CSRF

##### XSS (Cross-Site Scripting)

Injection de scripts malveillants dans une page web.

```html
<!-- ❌ Vulnérable : affichage sans échappement (HTML brut) -->
<div>{userInput}</div>  <!-- si userInput = <script>steal(document.cookie)</script> -->

<!-- ✅ React échappe automatiquement le JSX -->
<div>{userInput}</div>  <!-- rendu comme texte, pas comme HTML -->

<!-- ❌ Dangereux en React -->
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Protections :** échapper les sorties, `Content-Security-Policy`, cookie `HttpOnly`.

##### CSRF (Cross-Site Request Forgery)

Forcer un utilisateur authentifié à effectuer une action involontaire.

```
1. Victime connectée sur banque.fr (cookie de session)
2. Visite site-malveillant.com
3. Le site fait POST banque.fr/transfer?to=attacker&amount=1000
4. Le cookie est envoyé automatiquement → action exécutée !
```

**Protections :**
- Cookie `SameSite=Strict` ou `SameSite=Lax` (méthode moderne)
- Token CSRF dans les formulaires (méthode classique)
- Les APIs REST avec `Authorization: Bearer` sont **naturellement résistantes** au CSRF (pas de cookie)

##### Points clés CDA

- `HttpOnly` sur les cookies → le JS ne peut pas lire le cookie (protection XSS)
- `Secure` → cookie envoyé uniquement via HTTPS
- `SameSite=Strict` → cookie non envoyé dans les requêtes cross-site (protection CSRF)

---

#### CORS (Cross-Origin Resource Sharing)

Mécanisme navigateur qui **contrôle les requêtes cross-origin** (domaine différent).

```
Frontend (app.monsite.fr) → API (api.monsite.fr)
↑ origines différentes → bloqué par le navigateur sans header CORS
```

```typescript
// NestJS
app.enableCors({
  origin: ['https://app.monsite.fr', 'https://admin.monsite.fr'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // autoriser les cookies cross-origin
});
```

##### Preflight request

```
Browser → OPTIONS /api/prospects  (preflight automatique pour POST)
Server  → 200 + Access-Control-Allow-Origin: https://app.monsite.fr
Browser → POST /api/prospects     (requête réelle)
```

##### Points clés CDA

- CORS est une protection **côté navigateur uniquement** (les clients non-browser ignorent CORS)
- `origin: '*'` est dangereux en production
- `credentials: true` + `origin: '*'` est **interdit** par la spec HTTP
- En dev avec Next.js : les API Routes proxifient vers le backend → pas de problème CORS

---

#### Rate limiting

Limiter le nombre de requêtes par client pour prévenir les abus et attaques DoS.

```typescript
// @nestjs/throttler
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // fenêtre de 60 secondes
      limit: 10,   // max 10 requêtes par fenêtre
    }]),
  ],
})
export class AppModule {}

app.useGlobalGuards(new ThrottlerGuard());

// Surcharger par route
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Post('login')
login() {}

// Exclure une route
@SkipThrottle()
@Get('health')
health() {}
```

##### Avec Redis (multi-instance)

```typescript
ThrottlerModule.forRoot({
  storage: new ThrottlerStorageRedisService(redisClient),
  ttl: 60000,
  limit: 100,
})
```

##### Points clés CDA

- Sans Redis : compteur en mémoire → perdu au redémarrage, ne fonctionne pas en multi-instance
- Avec Redis : state partagé entre instances → adapté à la production
- Réponse : `429 Too Many Requests` + header `Retry-After`
- Stratégies : par IP, par userId, par API key

---

#### HTTPS & TLS

**TLS (Transport Layer Security) :** protocole de chiffrement des communications réseau.
**HTTPS** = HTTP + TLS.

```
Sans TLS :  Client ──[données lisibles]──────────► Serveur
Avec TLS :  Client ──[données chiffrées AES-256]──► Serveur
```

##### Handshake TLS simplifié

```
1. Client → Serveur : algos supportés (ClientHello)
2. Serveur → Client : certificat TLS (clé publique + identité)
3. Client          : vérifie le certificat (CA de confiance — Let's Encrypt)
4. Échange de clés → session key symétrique
5. Communication chiffrée avec la session key
```

##### Configuration Nginx

```nginx
server {
  listen 443 ssl http2;
  ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
  add_header Strict-Transport-Security "max-age=31536000" always; # HSTS

  location / { proxy_pass http://frontend:3001; }
  location /api/ { proxy_pass http://backend:3000/; }
}

server {
  listen 80;
  return 301 https://$host$request_uri; # redirection HTTP → HTTPS
}
```

##### Points clés CDA

- TLS est géré par le **reverse proxy** (Nginx), pas par l'application NestJS/Next.js
- **Let's Encrypt** → certificats gratuits, renouvellement automatique avec Certbot
- **HSTS** (`Strict-Transport-Security`) : force le navigateur à utiliser HTTPS
- TLS 1.2 minimum, **TLS 1.3** recommandé

---

## 5. Frontend

### Next.js App Router

#### Server vs Client components

**Server Components (défaut) :** rendus côté serveur, accès direct aux données, zéro JS envoyé au client.

**Client Components (`'use client'`) :** rendus côté client, accès aux hooks React et aux événements DOM.

```typescript
// Server Component (défaut dans app/)
// app/prospects/page.tsx
export default async function ProspectsPage() {
  // Fetch direct côté serveur — pas de useEffect, pas de loading state
  const prospects = await fetch(`${process.env.BACKEND_URL}/prospects`).then(r => r.json());
  return <ProspectList prospects={prospects} />;
}

// Client Component
// components/prospect-filter.tsx
'use client';

export function ProspectFilter({ onFilter }: { onFilter: (v: string) => void }) {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => { setValue(e.target.value); onFilter(e.target.value); }} />;
}
```

| Besoin | Server | Client |
|--------|--------|--------|
| Fetch data (async/await direct) | ✅ | ✅ (via fetch + useEffect) |
| `useState`, `useEffect` | ❌ | ✅ |
| Event listeners (`onClick`) | ❌ | ✅ |
| Accès BDD/FS direct | ✅ | ❌ |
| Variables d'env secrets | ✅ | ❌ (exposées au navigateur) |
| Composants interactifs | ❌ | ✅ |

##### Points clés CDA

- Un Server Component peut importer un Client Component, **pas l'inverse**
- Minimiser les `'use client'` → réduire le bundle JS envoyé au navigateur
- Les données sensibles (clés API, `BACKEND_URL` interne) restent côté serveur

---

#### SSR / SSG / ISR / CSR

| Mode | Quand rendu | Données | Cas d'usage |
|------|-------------|---------|-------------|
| **SSR** | À chaque requête | Fraîches | Dashboard, pages user-specific |
| **SSG** | Au build | Figées | Blog, docs, landing page |
| **ISR** | Après X secondes | Semi-fraîches | Catalogue, news |
| **CSR** | Côté client | Via fetch JS | Apps très interactives |

```typescript
// SSR (fetch sans cache)
const data = await fetch(url, { cache: 'no-store' });

// SSG (cache permanent)
const data = await fetch(url, { cache: 'force-cache' });

// ISR (revalider toutes les 60s)
const data = await fetch(url, { next: { revalidate: 60 } });
// Ou :
export const revalidate = 60;

// SSG avec routes dynamiques
export async function generateStaticParams() {
  const prospects = await fetchProspects();
  return prospects.map(p => ({ id: p.id }));
}
```

##### Points clés CDA

- Dans l'App Router, le comportement par défaut est **SSR** (cache: 'no-store')
- ISR = bon compromis perf/fraîcheur pour des données qui changent peu
- SSG → le plus rapide (servi depuis CDN), mais données figées au moment du build
- Le CSR est déconseillé pour le SEO et le First Contentful Paint

---

#### App Router routing

La structure de fichiers dans `app/` **est** la structure des routes.

```
app/
├── layout.tsx              → Layout racine (toujours affiché)
├── page.tsx                → Route /
├── loading.tsx             → Suspense automatique pendant le fetch
├── error.tsx               → Error boundary (Client Component)
├── not-found.tsx           → 404 personnalisé
├── prospects/
│   ├── page.tsx            → Route /prospects
│   ├── layout.tsx          → Layout imbriqué pour /prospects/*
│   └── [id]/
│       └── page.tsx        → Route /prospects/:id
├── (auth)/                 → Route group (pas d'impact sur l'URL)
│   ├── login/page.tsx      → Route /login
│   └── register/page.tsx   → Route /register
└── api/
    └── prospects/
        └── route.ts        → API Route /api/prospects (GET, POST...)
```

##### Fichiers spéciaux

| Fichier | Rôle |
|---------|------|
| `layout.tsx` | UI partagée, persist entre navigations (pas de re-render) |
| `page.tsx` | UI de la route, rend la page publique |
| `loading.tsx` | Skeleton/spinner pendant le chargement (Suspense) |
| `error.tsx` | Gestion des erreurs (doit être un Client Component) |
| `route.ts` | API Route handler (remplace `pages/api/`) |

##### Points clés CDA

- `layout.tsx` ne se re-rend **pas** lors de la navigation entre ses enfants
- `(dossier)` = route group : organise sans changer l'URL
- `[slug]` = segment dynamique · `[...slug]` = catch-all · `[[...slug]]` = optionnel

---

#### BFF (Backend For Frontend)

Couche intermédiaire dédiée au frontend qui agrège, adapte et sécurise les données.

```
                    ┌──────────────────────┐
Web App  ────────►  │   Next.js BFF        │  ← API Routes (/api/*)
Mobile   ────────►  │   (Route handlers    │
                    │    server-side)       │
                    └──────────┬───────────┘
                               │ agrège + sécurise
                    ┌──────────┴───────────┐
                    ▼                      ▼
               NestJS API            Service KYC
```

```typescript
// app/api/prospects/route.ts — BFF layer
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Appel au backend interne (non exposé au client)
  const res = await fetch(`${process.env.BACKEND_URL}/prospects`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return NextResponse.json(await res.json());
}
```

##### Points clés CDA

- Le BFF empêche le client d'appeler directement le backend (sécurité)
- Les secrets (`BACKEND_URL`, clés API internes) restent côté serveur Next.js
- Agrège plusieurs services → réduit les aller-retours du client
- QW-App utilise les API Routes Next.js comme BFF

---

### React & state management

#### Hooks React

Fonctions qui permettent d'utiliser l'état et le cycle de vie dans les composants fonctionnels.

```typescript
// useState : état local
const [count, setCount] = useState(0);

// useEffect : effets de bord (fetch, subscriptions, timers)
useEffect(() => {
  const sub = subscribeToUpdates(id);
  return () => sub.unsubscribe(); // cleanup à l'unmount ou si id change
}, [id]); // tableau de dépendances

// useCallback : mémoïser une fonction (stable entre les renders)
const handleSubmit = useCallback(() => {
  submit(formData);
}, [formData]);

// useMemo : mémoïser un calcul coûteux
const sortedItems = useMemo(() => items.sort(compareFn), [items]);

// useRef : référence mutable sans déclencher de re-render
const inputRef = useRef<HTMLInputElement>(null);

// useContext : lire un contexte sans prop drilling
const { user } = useContext(AuthContext);

// Custom hook : encapsuler de la logique réutilisable
function useProspect(id: string) {
  const [data, setData] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchProspect(id).then(setData).finally(() => setLoading(false));
  }, [id]);
  return { data, loading };
}
```

##### Points clés CDA

- `useEffect` avec `[]` = s'exécute **une seule fois** au montage
- Les hooks ne peuvent pas être appelés conditionnellement (règle des hooks)
- `useMemo`/`useCallback` : ne pas optimiser prématurément — ont un coût de mémoïsation
- Les custom hooks commencent par `use` et peuvent appeler d'autres hooks

---

#### Zod validation

Bibliothèque de validation et parsing de schémas **TypeScript-first**.

```typescript
import { z } from 'zod';

const CreateProspectSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2).max(50),
  age: z.number().int().min(18, 'Majeur requis'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  address: z.object({
    city: z.string(),
    zipCode: z.string().regex(/^\d{5}$/),
  }).optional(),
});

// Inférer le type TypeScript depuis le schéma (source de vérité unique)
type CreateProspectDto = z.infer<typeof CreateProspectSchema>;

// Valider (throw ZodError si invalide)
const data = CreateProspectSchema.parse(rawInput);

// Valider sans throw (retourne { success, data, error })
const result = CreateProspectSchema.safeParse(rawInput);
if (!result.success) console.error(result.error.issues);

// Avec React Hook Form
const form = useForm<CreateProspectDto>({
  resolver: zodResolver(CreateProspectSchema),
});
```

##### Points clés CDA

- Zod = validation + inférence de type → le type TS est **toujours synchronisé** avec la validation
- `safeParse` → ne throw pas (préférable dans les formulaires)
- Fonctionne côté client (formulaires) ET serveur (API Routes, NestJS avec `zod-nestjs`)
- Alternative à `class-validator` dans les projets Next.js-first

---

#### State management

```
Local state      → useState (un composant)
Lifted state     → useState dans le parent commun
Context          → useContext (arbre de composants, pas de perf)
Global store     → Zustand, Jotai (toute l'app, léger)
Server state     → TanStack Query / SWR (données distantes)
```

```typescript
// Zustand (state global léger)
interface ProspectStore {
  selectedId: string | null;
  select: (id: string) => void;
}

const useProspectStore = create<ProspectStore>((set) => ({
  selectedId: null,
  select: (id) => set({ selectedId: id }),
}));

// Dans un composant
const { selectedId, select } = useProspectStore();

// TanStack Query (server state — le meilleur outil pour les données API)
const { data, isLoading, error } = useQuery({
  queryKey: ['prospects', filters],
  queryFn: () => fetchProspects(filters),
  staleTime: 5 * 60 * 1000, // données fraîches 5min, pas de refetch
});

const mutation = useMutation({
  mutationFn: createProspect,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospects'] }),
});
```

##### Points clés CDA

- Toujours commencer par l'état local, promouvoir seulement si nécessaire
- Context n'est **pas** un outil de performance (re-render de tout l'arbre abonné)
- TanStack Query gère le cache, la déduplication, la revalidation → idéal pour les données API
- Zustand > Redux pour la plupart des projets modernes (moins de boilerplate)

---

#### shadcn/ui & Radix

**Radix UI :** bibliothèque de composants **headless** (accessibles, sans style).

**shadcn/ui :** collection de composants copiables dans le projet, basés sur Radix + Tailwind CSS.

```bash
# Installation d'un composant (copié dans le projet — pas une dépendance npm)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
```

```typescript
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ProspectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau prospect</DialogTitle>
        </DialogHeader>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button>Confirmer</Button>
      </DialogContent>
    </Dialog>
  );
}
```

##### Points clés CDA

- shadcn/ui n'est **pas une lib** : les composants vivent dans votre repo, vous les possédez et les modifiez
- Radix gère l'accessibilité (ARIA, focus trap, keyboard navigation) automatiquement
- `variant`, `size` = props de personnalisation via `class-variance-authority` (CVA)
- Facilite la conformité WCAG (accessibilité) sans effort supplémentaire

---

## 6. Cache & Infrastructure

### Redis & cache

#### Redis data structures

Redis est un store clé-valeur **en mémoire** supportant plusieurs structures de données natives.

| Structure | Commandes clés | Cas d'usage |
|-----------|---------------|-------------|
| **String** | `SET`, `GET`, `INCR`, `EX` | Cache simple, compteurs |
| **Hash** | `HSET`, `HGET`, `HGETALL` | Sessions utilisateur, objets |
| **List** | `LPUSH`, `RPUSH`, `LRANGE` | File de jobs, logs |
| **Set** | `SADD`, `SMEMBERS`, `SISMEMBER` | Tags uniques, permissions |
| **Sorted Set** | `ZADD`, `ZRANGE`, `ZRANGEBYSCORE` | Leaderboards, rate limiting sliding window |
| **Stream** | `XADD`, `XREAD` | Event streaming, audit |

```typescript
import Redis from 'ioredis';
const redis = new Redis({ host: 'redis', port: 6379 });

// String avec TTL
await redis.set('prospect:123', JSON.stringify(prospect), 'EX', 300);
const raw = await redis.get('prospect:123');

// Hash (session)
await redis.hset('session:abc', { userId: '123', role: 'USER' });
const session = await redis.hgetall('session:abc');

// Sorted Set (rate limiting)
const now = Date.now();
await redis.zadd('rl:ip:1.2.3.4', now, `${now}`);
await redis.zremrangebyscore('rl:ip:1.2.3.4', 0, now - 60000);
const count = await redis.zcard('rl:ip:1.2.3.4');
```

##### Points clés CDA

- Redis = **in-memory** → < 1ms, mais limité par la RAM disponible
- Persistance optionnelle : RDB (snapshots) ou AOF (append-only log)
- La structure choisie impacte directement les performances (Sorted Set pour sliding window)

---

#### Stratégies de cache

| Stratégie | Flux | Cas d'usage |
|-----------|------|-------------|
| **Cache-Aside** | App vérifie cache → miss → lit BDD → stocke | La plus courante, read-heavy |
| **Write-Through** | Écriture dans cache ET BDD simultanément | Cohérence forte |
| **Write-Behind** | Écriture dans cache, BDD asynchrone | Write-heavy, risque de perte |
| **Read-Through** | Le cache lit la BDD automatiquement | Simplifie le code applicatif |

```typescript
// Cache-Aside (le plus utilisé)
@Injectable()
export class ProspectService {
  async findById(id: string): Promise<Prospect> {
    // 1. Vérifier le cache
    const cached = await this.redis.get(`prospect:${id}`);
    if (cached) return JSON.parse(cached);

    // 2. Cache miss → BDD
    const prospect = await this.repo.findById(id);

    // 3. Stocker en cache (TTL 5min)
    await this.redis.set(`prospect:${id}`, JSON.stringify(prospect), 'EX', 300);
    return prospect;
  }

  async update(id: string, data: UpdateDto) {
    const updated = await this.repo.update(id, data);
    await this.redis.del(`prospect:${id}`); // invalider le cache
    return updated;
  }
}
```

##### Points clés CDA

- Cache-Aside = lazy loading — seules les données demandées sont mises en cache
- Toujours **invalider** le cache à l'écriture
- Le cache ne doit jamais être la **source de vérité** — la BDD fait foi

---

#### TTL & invalidation

**TTL (Time To Live) :** durée de vie d'une entrée en cache avant expiration automatique.

```typescript
// Définir un TTL
await redis.set('key', value, 'EX', 300);   // expire dans 300s
await redis.set('key', value, 'PX', 5000);  // expire dans 5000ms

// Renouveler le TTL
await redis.expire('key', 300);

// Consulter le TTL restant
const ttl = await redis.ttl('key'); // -1 = pas de TTL, -2 = n'existe pas

// Invalidation par groupe (pattern avec Set Redis)
async function invalidateProspect(id: string) {
  const keys = await redis.smembers(`prospect:${id}:cache_keys`);
  if (keys.length) await redis.del(...keys);
  await redis.del(`prospect:${id}:cache_keys`);
}
```

##### Stratégies d'invalidation

| Stratégie | Description | Avantage |
|-----------|-------------|----------|
| **TTL** | Expiration automatique après N secondes | Simple, sans logique applicative |
| **Invalidation active** | `DEL` à chaque écriture | Cohérence immédiate |
| **Event-driven** | Message bus → invalide le cache | Découplé (microservices) |

##### Points clés CDA

- TTL trop court → beaucoup de cache misses (perte de perf)
- TTL trop long → données périmées (incohérence)
- L'invalidation active est plus complexe mais plus cohérente que le TTL seul
- `KEYS pattern` en production → dangereux (bloque Redis) ; utiliser `SCAN` à la place

---

#### Redis comme session store

Stocker les sessions utilisateur dans Redis plutôt qu'en mémoire (scalable, partageable).

```typescript
// NestJS avec connect-redis
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,    // inaccessible au JS
      secure: true,      // HTTPS uniquement
      sameSite: 'lax',   // protection CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    },
  }),
);

// Données stockées dans Redis :
// Key: "sess:abc123" → Hash: { userId: "uuid", role: "USER", ... }
```

##### JWT vs Sessions Redis

| | JWT (stateless) | Sessions Redis (stateful) |
|-|-----------------|--------------------------|
| **Stockage** | Client (token) | Serveur (Redis) |
| **Révocation** | Difficile (liste noire) | Immédiate (`DEL sess:id`) |
| **Scalabilité** | Stateless (facile) | Nécessite Redis partagé |
| **Données** | Limitées (dans chaque req) | Illimitées |

##### Points clés CDA

- Sessions Redis = révocation immédiate possible (déconnexion forcée, compromis détecté)
- `httpOnly` + `secure` + `sameSite` = trio de sécurité pour les cookies de session
- En multi-instance, Redis est partagé → toutes les instances accèdent aux mêmes sessions

---

### Infrastructure & Docker

#### Docker & containers

Docker empaquète une application et ses dépendances dans un **conteneur** isolé et reproductible.

```dockerfile
# Dockerfile multi-stage (NestJS)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml
services:
  backend:
    build: ./apps/backend
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/qwapp
      REDIS_URL: redis://redis:6379
    depends_on: [db, redis]

  frontend:
    build: ./apps/frontend
    ports: ["3001:3001"]

  db:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: qwapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

volumes:
  postgres_data:
  redis_data:
```

##### Points clés CDA

- **Multi-stage build** : l'image de prod ne contient pas les devDependencies → image légère
- `depends_on` = ordre de démarrage, pas la disponibilité (ajouter `healthcheck` pour attendre la BDD)
- Les volumes persistent les données entre redémarrages
- `alpine` = images légères (~5MB) vs Debian (~100MB)

---

#### Nginx reverse proxy

Nginx sert de point d'entrée unique : TLS, routing, load balancing, fichiers statiques.

```nginx
upstream backend  { server backend:3000; }
upstream frontend { server frontend:3001; }

server {
  listen 443 ssl http2;
  server_name app.qwapp.fr;

  ssl_certificate /etc/letsencrypt/live/qwapp.fr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/qwapp.fr/privkey.pem;
  add_header Strict-Transport-Security "max-age=31536000" always;

  # Frontend Next.js
  location / {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Backend API (route interne uniquement)
  location /api/ {
    proxy_pass http://backend/;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}

server {
  listen 80;
  return 301 https://$host$request_uri;
}
```

##### Points clés CDA

- Le backend NestJS n'est **pas exposé** directement sur Internet — Nginx est le seul point d'entrée
- `proxy_set_header X-Real-IP` : permet à l'application de connaître l'IP réelle du client
- `http2` améliore les performances (multiplexage des requêtes)
- Nginx peut servir les fichiers statiques Next.js directement (plus rapide que Node.js)

---

#### Dev vs Prod

| Aspect | Développement | Production |
|--------|--------------|------------|
| **Hot reload** | Oui (Turbopack, NestJS watch) | Non |
| **Source maps** | Oui | Non (ou séparées) |
| **Logs** | Verbeux | Structurés JSON, niveau WARN+ |
| **BDD** | `synchronize: true` | `synchronize: false` + migrations |
| **Secrets** | `.env` local | Variables d'env serveur ou vault |
| **HTTPS** | Non (localhost) | Oui (Let's Encrypt) |
| **Minification** | Non | Oui |

```typescript
// NestJS
TypeOrmModule.forRoot({
  synchronize: process.env.NODE_ENV !== 'production', // JAMAIS true en prod
})

// Logs structurés en prod (Winston)
if (process.env.NODE_ENV === 'production') {
  app.useLogger(new WinstonLogger({ format: winston.format.json() }));
}
```

##### Points clés CDA

- `NODE_ENV=production` active les optimisations (minification, tree-shaking)
- Les secrets ne sont **jamais** dans le code source ni dans les images Docker
- La parité dev/prod via Docker réduit les "ça marche sur ma machine"
- `synchronize: true` en production peut **supprimer des colonnes** sans warning

---

#### CI/CD

**CI (Continuous Integration) :** automatiser tests et validations à chaque push.
**CD (Continuous Deployment) :** déployer automatiquement après validation CI.

##### Architecture des workflows QW-App (layered)

Les workflows sont organisés en **3 couches** :

| Couche | Fichiers | Déclencheur |
|--------|----------|-------------|
| **Réutilisables** | `lint.yml`, `tests.yml`, `audit.yml`, `docker-build.yml` | `workflow_call` uniquement |
| **Orchestrateurs** | `ci.yml`, `deploy.yml`, `release.yml`, `hotfix-release.yml` | Événements GitHub |
| **Validation PR** | `branch-name.yml`, `commit-msg.yml`, `structure.yml` | `pull_request` |

```yaml
# ci.yml — orchestrateur : appelle les 4 workflows réutilisables EN PARALLÈLE
jobs:
  lint:
    uses: ./.github/workflows/lint.yml
  tests:
    uses: ./.github/workflows/tests.yml
  audit:
    uses: ./.github/workflows/audit.yml      # npm audit --audit-level=high
  docker-build:
    uses: ./.github/workflows/docker-build.yml
# PR bloquée si l'un des 4 échoue
```

```yaml
# deploy.yml — déclenché sur push vers staging
steps:
  - SSH vers VPS
  - git pull origin staging
  - docker compose build && docker compose up -d --remove-orphans
  - healthcheck HTTP toutes les 2s (timeout 30s)
  # Si échec : les anciens conteneurs continuent de tourner (rollback implicite)

# release.yml — déclenché sur push vers main (depuis dev)
steps:
  - Récupérer le dernier tag (ex. v1.2.0)
  - Incrémenter le mineur → v1.3.0
  - Créer le tag Git + GitHub Release avec CHANGELOG.md

# hotfix-release.yml — déclenché sur push vers main (depuis hotfix/*)
steps:
  - Incrémenter le patch → v1.3.1
  - Créer tag + Release
  - Ouvrir automatiquement une PR de sync main → dev
```

##### Validation PR

| Workflow | Ce qu'il vérifie |
|----------|-----------------|
| `branch-name.yml` | Format : `feat/123-desc`, `fix/123-desc`, `hotfix/123-desc` |
| `commit-msg.yml` | Format : `type(scope): Fixes #<issue> - message` |
| `structure.yml` | Présence de `README.md`, `CONTRIBUTING.md`, `INSTALL.md`, `LICENSE` |

##### Secrets GitHub requis

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH dédié |
| `VPS_SSH_KEY` | Clé privée SSH (sans passphrase) |
| `GITHUB_TOKEN` | Fourni automatiquement (créer releases et PR) |

##### Points clés CDA

- La CI **bloque le merge** si les tests échouent → protection de la branche principale
- Architecture **layered** : les workflows réutilisables ne s'exécutent jamais seuls
- Les secrets sont dans les **secrets du dépôt**, jamais en clair
- `npm ci` → installation reproductible depuis `package-lock.json`
- En cas d'échec du déploiement : les anciens conteneurs continuent → rollback implicite

---

## 7. TypeScript & Qualité

### TypeScript avancé

#### Generics

Permettent d'écrire du code **réutilisable et typé** pour différents types sans perdre la sûreté de type.

```typescript
// Generic simple
function identity<T>(arg: T): T { return arg; }

// Generic avec contrainte
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic dans une classe
class Repository<T extends { id: string }> {
  private items: T[] = [];

  findById(id: string): T | undefined {
    return this.items.find(item => item.id === id);
  }

  save(item: T): T {
    this.items.push(item);
    return item;
  }
}

const prospectRepo = new Repository<Prospect>();
const userRepo = new Repository<User>(); // même code, types différents

// Generic dans un type
type ApiResponse<T> = {
  data: T;
  success: boolean;
  timestamp: string;
};

type ProspectListResponse = ApiResponse<Prospect[]>;
```

##### Points clés CDA

- `<T>` = paramètre de type, résolu à l'utilisation (inféré ou explicite)
- `extends` dans les generics = contrainte (T doit satisfaire cette forme)
- `keyof T` = union de toutes les clés de T
- Les generics évitent la duplication de code tout en conservant la sécurité des types

---

#### Decorators

Fonctions qui **modifient** le comportement d'une classe, méthode, propriété ou paramètre à la déclaration.

```typescript
// Decorator de méthode
function Log(): MethodDecorator {
  return (target, key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`Calling ${String(key)}`, args);
      const result = original.apply(this, args);
      console.log(`Result:`, result);
      return result;
    };
  };
}

// Decorator de classe (NestJS style)
function Controller(prefix: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('prefix', prefix, target);
  };
}

// Decorator de paramètre
function Param(key: string): ParameterDecorator {
  return (target, method, index) => {
    Reflect.defineMetadata(`param:${index}`, key, target, method);
  };
}

// Utilisation
@Controller('prospects')
class ProspectController {
  @Log()
  findOne(@Param('id') id: string) { return id; }
}
```

##### Points clés CDA

- Nécessite `experimentalDecorators: true` et `emitDecoratorMetadata: true` dans `tsconfig.json`
- NestJS est **entièrement construit** sur les decorators
- L'ordre d'exécution : de bas en haut pour les decorators de méthode
- `reflect-metadata` permet de stocker/lire des métadonnées sur les classes et méthodes

---

#### Interface vs type

```typescript
// Interface — pour les contrats et les formes d'objets
interface IProspectRepository {
  findById(id: string): Promise<Prospect>;
  save(prospect: Prospect): Promise<Prospect>;
}

// Extensible (déclaration fusion)
interface IProspectRepository {
  delete(id: string): Promise<void>; // fusionne automatiquement
}

// Type alias — pour les unions, intersections, types complexes
type Status = 'PENDING' | 'VALIDATED' | 'REJECTED';          // union
type ProspectWithScore = Prospect & { score: number };        // intersection
type MaybeProspect = Prospect | null;

// Types mappés (uniquement avec type)
type ReadOnlyProspect = { readonly [K in keyof Prospect]: Prospect[K] };
type PartialProspect = { [K in keyof Prospect]?: Prospect[K] };
```

| | `interface` | `type` |
|-|-------------|--------|
| Forme d'un objet | ✅ | ✅ |
| Union types | ❌ | ✅ |
| Augmentation de déclaration | ✅ | ❌ |
| Types mappés | ❌ | ✅ |
| Implements dans une classe | ✅ | ✅ (si objet) |

##### Points clés CDA

- `interface` pour ce qu'une classe **implémente** (contrats)
- `type` pour les unions, intersections et types utilitaires
- En cas de doute : `interface` pour les objets, `type` pour tout le reste

---

#### Utility types

Types built-in TypeScript pour transformer d'autres types sans redondance.

```typescript
interface Prospect {
  id: string;
  email: string;
  firstName: string;
  score: number;
  deletedAt: Date | null;
}

// Partial — toutes les propriétés optionnelles (DTO de mise à jour)
type UpdateDto = Partial<Prospect>;

// Required — toutes les propriétés requises
type FullProspect = Required<Prospect>;

// Pick — garder certaines propriétés
type ProspectSummary = Pick<Prospect, 'id' | 'email' | 'firstName'>;

// Omit — exclure certaines propriétés (DTO de création)
type CreateDto = Omit<Prospect, 'id' | 'deletedAt' | 'score'>;

// Readonly — propriétés immuables
type ImmutableProspect = Readonly<Prospect>;

// Record — objet avec clés et valeurs typés
type StatusCounts = Record<string, number>;

// NonNullable — exclut null et undefined
type DefinedDate = NonNullable<Date | null | undefined>; // Date

// ReturnType — type de retour d'une fonction
type ServiceResult = ReturnType<typeof prospectService.findAll>;

// Parameters — tuple des paramètres d'une fonction
type FindParams = Parameters<typeof prospectService.findById>; // [id: string]
```

##### Points clés CDA

- Les utility types évitent de dupliquer les types (DRY appliqué aux types)
- `Partial` → très utilisé pour les DTOs de mise à jour
- `Omit` → créer un DTO depuis l'entité sans répéter tous les champs manuellement
- `z.infer<>` de Zod fait la même chose mais synchronisé avec la validation runtime

---

#### Enums vs union types

```typescript
// Enum string TypeScript
enum ProspectStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

// Enum numérique (piège courant)
enum Direction { Up, Down } // 0, 1 — comportement surprenant en JSON

// Union type (string literal)
type ProspectStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';

// Pattern recommandé : const object + union (le meilleur des deux mondes)
const PROSPECT_STATUS = {
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
} as const;

type ProspectStatus = typeof PROSPECT_STATUS[keyof typeof PROSPECT_STATUS];
// = 'PENDING' | 'VALIDATED' | 'REJECTED'

// Itérable + typé
Object.values(PROSPECT_STATUS); // ['PENDING', 'VALIDATED', 'REJECTED']
```

| | Enum | Union type | Const object + union |
|-|------|------------|---------------------|
| **Bundle JS** | Objet compilé | Effacé (0 bytes) | Objet (itérable) |
| **Itération** | `Object.values()` | Non natif | `Object.values()` |
| **Type safety** | ✅ | ✅ | ✅ |
| **Sérialisation JSON** | String enums OK, num. problématiques | ✅ | ✅ |

##### Points clés CDA

- Les enums numériques sont à éviter (la valeur JSON est un nombre, pas un label lisible)
- Les enums string sont acceptables mais les union types sont plus idiomatiques en TS moderne
- `as const` + `typeof` = itérabilité des enums + légèreté des union types

---

### Qualité & outillage

#### Tests (unit, intégration, E2E)

##### Pyramide de tests

```
        /\
       /  \       E2E     — peu, lents, coûteux, réalistes
      /────\
     /      \     Intégration — moyennement nombreux, réalistes
    /────────\
   /          \   Unit — beaucoup, rapides, isolés
  /────────────\
```

```typescript
// Unit (Jest) — logique pure, aucune dépendance externe
describe('ScoringService.calculate', () => {
  it('retourne 0 pour un historique vide', () => {
    const service = new ScoringService();
    expect(service.calculate([])).toBe(0);
  });
});

// Intégration (NestJS Testing) — service + BDD réelle
describe('ProspectService (intégration)', () => {
  let service: ProspectService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot({ type: 'sqlite', database: ':memory:' })],
      providers: [ProspectService, ProspectRepository],
    }).compile();
    service = module.get(ProspectService);
  });

  it('crée un prospect', async () => {
    const result = await service.create({ email: 'test@test.com' });
    expect(result.id).toBeDefined();
  });
});

// E2E (Supertest)
describe('POST /prospects (e2e)', () => {
  it('retourne 201', () => {
    return request(app.getHttpServer())
      .post('/prospects')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'test@test.com', firstName: 'Alice' })
      .expect(201)
      .expect(res => expect(res.body.data.id).toBeDefined());
  });
});
```

##### Points clés CDA

- **Unit** : tester la logique métier pure, mocker les dépendances avec `jest.fn()`
- **Intégration** : tester les interactions réelles entre composants (service + BDD)
- **E2E** : tester le flux HTTP complet, proche de ce que vit l'utilisateur
- `jest.spyOn()` = observer et optionnellement mocker une méthode existante

---

#### Conventional Commits

Standard de messages de commit lisibles par humains et machines, permettant la génération de CHANGELOG automatique.

##### Format

```
<type>(<scope>): <description courte>

[corps optionnel]

[footer optionnel]
```

##### Types standards

| Type | Quand l'utiliser |
|------|-----------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Formatage, sans changement logique |
| `refactor` | Refactoring sans new feature ni fix |
| `test` | Ajout/modification de tests |
| `chore` | Maintenance (deps, config, CI) |
| `perf` | Amélioration de performance |

##### Format standard

```
feat(scope): description courte
fix(auth): corriger la vérification du token
feat!: breaking change → bump majeur semver
```

##### Format QW-App — référence d'issue obligatoire

Le projet impose d'inclure le numéro d'issue GitHub dans chaque commit, validé automatiquement par `commitlint` :

```
type(scope): Fixes #<issue> - description courte

Exemples :
  feat(clients): Fixes #42 - ajouter la route POST /api/clients
  fix(scoring): Fixes #34 - corriger le calcul PEP
  docs(readme): Fixes #5 - mettre à jour les instructions d'installation
```

```js
// commitlint.config.js — règle subject-case désactivée (majuscule après #issue)
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: { 'subject-case': [0] },
};
```

##### Points clés CDA

- `!` après le type = **breaking change** (bump majeur en semver)
- `scope` entre parenthèses = module/feature concerné
- Lier chaque commit à une issue = traçabilité complète (nécessaire en équipe)
- Permet de générer le CHANGELOG et bumper la version automatiquement (semantic-release)

---

#### Git Flow

Organisation des branches Git structurant le cycle de développement → staging → production.

##### Branches QW-App

| Branche | Rôle | Depuis |
|---------|------|--------|
| `main` | Version stable livrée | — |
| `dev` | Intégration des développements | `main` |
| `staging` | Environnement de test + déploiement auto | `dev` |
| `feat/<issue>-desc` | Nouvelle fonctionnalité | `dev` |
| `fix/<issue>-desc` | Correction de bug | `dev` |
| `hotfix/<issue>-desc` | Correction urgente en production | `main` |

##### Flux quotidien

```bash
# 1. Créer une branche depuis dev
git checkout dev && git pull
git checkout -b feat/42-creation-client

# 2. Développer et committer
git commit -m "feat(clients): Fixes #42 - ajouter la route POST /api/clients"

# 3. Ouvrir une PR vers dev → CI s'exécute automatiquement
git push origin feat/42-creation-client

# 4. CI verte + review → merge dans dev
# 5. dev → staging → déploiement automatique (deploy.yml)
# 6. dev → main → release (release.yml, bump mineur x.Y.0)
# hotfix/* → main → release patch (hotfix-release.yml, bump x.y.Z)
```

##### Versioning SemVer

| Événement | Bump | Déclenché par |
|-----------|------|---------------|
| Merge `dev` → `main` | Mineur `x.Y.0` | `release.yml` |
| Merge `hotfix/*` → `main` | Patch `x.y.Z` | `hotfix-release.yml` |

##### Points clés CDA

- **Branch protection rules** : `main` et `dev` bloqués sans CI verte
- `staging` = environnement de recette entre `dev` et `main`
- Le hotfix ouvre automatiquement une PR de sync `main → dev` pour ne pas perdre le correctif
- Nommer les branches avec le numéro d'issue (`feat/42-...`) = traçabilité

---

#### Husky & lint-staged

**Husky :** exécute des scripts sur les hooks Git (`pre-commit`, `commit-msg`, `pre-push`).

**lint-staged :** exécute des linters/formatters uniquement sur les **fichiers stagés** (pas tout le projet).

```bash
npm install --save-dev husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg — valide le format Conventional Commits
npx --no -- commitlint --edit $1
```

```js
// commitlint.config.js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

##### Points clés CDA

- lint-staged évite de linter tout le projet à chaque commit → rapide
- `pre-commit` : qualité du code avant commit
- `commit-msg` : validation du format du message
- `--no-verify` bypasse les hooks → à éviter, brise les garanties de qualité

---

#### ESLint & Prettier

**ESLint :** analyse statique du code — détecte les bugs potentiels et enforce les conventions.

**Prettier :** formateur de code opinioné — standardise le style automatiquement.

```js
// eslint.config.mjs
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [...tseslint.configs.recommended],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['error', 'warn'] }],
  },
});
```

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

| | ESLint | Prettier |
|-|--------|----------|
| **Rôle** | Qualité et correctness du code | Style et formatage |
| **Correction** | `--fix` (partielle) | `--write` (totale) |
| **Configuration** | Très configurable | Peu d'options (opinioné) |

##### Points clés CDA

- ESLint et Prettier ont des rôles **distincts et complémentaires**
- `eslint-config-prettier` désactive les règles ESLint qui entrent en conflit avec Prettier
- Intégration IDE + "format on save" = productivité maximale, zéro friction
- En CI : `eslint --max-warnings 0` bloque les warnings (qualité stricte)

---

## 8. Métier & Données

### Processus KYC

#### KYC expliqué

**KYC (Know Your Customer) :** processus réglementaire de **vérification d'identité** des clients, obligatoire dans les secteurs financiers.

##### Cadre légal

- Directive européenne **AML (Anti-Money Laundering)** / **LCB-FT** (Lutte Contre le Blanchiment et le Financement du Terrorisme) en France
- Obligation de vérifier l'identité **avant** toute relation d'affaires
- Conservation des documents : **5 ans minimum** après la fin de la relation

##### Niveaux de vérification

| Niveau | Vérification | Cas |
|--------|-------------|-----|
| **Simplifié** | Nom + email + auto-déclaration | Faible risque, montants faibles |
| **Standard** | Pièce d'identité + justificatif de domicile | Risque moyen |
| **Renforcé** | Entretien + origine des fonds + justificatifs supplémentaires | Haut risque, PPE |

##### Documents collectés

- Particuliers : CNI ou passeport, justificatif de domicile (< 3 mois)
- Entreprises : Kbis, statuts, liste des **UBO** (Ultimate Beneficial Owners — bénéficiaires effectifs > 25%)

##### Points clés CDA

- KYC n'est **pas optionnel** dans les secteurs financiers — c'est une obligation légale
- La vérification peut être manuelle (backoffice) ou automatisée (API OCR, liveness check)
- Données KYC soumises au **RGPD ET** aux obligations AML (rétention minimale 5 ans → tension avec droit à l'oubli)

---

#### Workflow prospect → client

```
[Visiteur]
    │ inscription (email + mdp)
    ▼
[PENDING]
    │ dépôt documents KYC
    ▼
[DOCUMENTS_SUBMITTED]
    │
    ├── vérification automatique (OCR, liveness)
    │         │
    │    ┌────┴──────┐
    │    │ conforme  │ suspect
    │    ▼           ▼
    │ [AUTO_VALIDATED] [MANUAL_REVIEW]
    │         │              │ décision backoffice
    │         │       ┌──────┴──────┐
    │         │       ▼             ▼
    │         │  [VALIDATED]    [REJECTED]
    │         │
    └─────────┘
               │ compte ouvert
               ▼
            [CLIENT]
```

```typescript
// Machine à états — transitions valides uniquement
const TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  PENDING: ['DOCUMENTS_SUBMITTED'],
  DOCUMENTS_SUBMITTED: ['AUTO_VALIDATED', 'MANUAL_REVIEW'],
  AUTO_VALIDATED: ['VALIDATED'],
  MANUAL_REVIEW: ['VALIDATED', 'REJECTED'],
  VALIDATED: [],
  REJECTED: [],
};

function transition(current: ProspectStatus, next: ProspectStatus) {
  if (!TRANSITIONS[current].includes(next))
    throw new Error(`Transition invalide: ${current} → ${next}`);
}
```

##### Points clés CDA

- Chaque changement de statut = événement tracé dans l'audit trail
- Les transitions invalides doivent être **bloquées** (machine à états)
- Un prospect rejeté peut re-soumettre selon les règles métier (nouveau dossier)

---

#### Risk scoring

Évaluation automatique du **niveau de risque LCB-FT** d'un client à partir de ses données KYC.

##### Critères pondérés QW-App

| Critère | Points | Justification réglementaire |
|---------|:------:|-----------------------------|
| PEP (Personne Politiquement Exposée) | **+30** | Risque de corruption — vigilance accrue obligatoire |
| Pays à haut risque (listes GAFI) | **+25** | Juridictions non coopératives en matière LCB-FT |
| Secteur sensible (crypto, casino, forex, immobilier, luxe) | **+20** | Secteurs traditionnellement utilisés pour le blanchiment |
| Chiffre d'affaires > 500 000 € | **+10** | Volumes élevés = exposition supérieure |

##### Niveaux de risque

| Score | Niveau | Action |
|:-----:|--------|--------|
| 0 – 33 | 🟢 FAIBLE | Surveillance standard |
| 34 – 66 | 🟡 MOYEN | Diligences renforcées |
| 67 – 100 | 🔴 ÉLEVÉ | Vigilance accrue + signalement possible (Tracfin) |

```typescript
@Injectable()
export class ScoringService {
  calculate(kyc: Kyc): RiskScore {
    let score = 0;

    if (kyc.estPep) score += 30;
    if (kyc.paysHautRisque) score += 25;
    if (kyc.secteurSensible) score += 20;
    if (kyc.chiffreAffaires > 500_000) score += 10;

    const level =
      score <= 33 ? RiskLevel.FAIBLE :
      score <= 66 ? RiskLevel.MOYEN :
                    RiskLevel.ELEVE;

    return { score, level, calculatedAt: new Date() };
  }
}
```

**Implémentation dans QW-App :**
- Résultat **persisté** en base avec horodatage (historique des réévaluations)
- Cache Redis : clé `scoring:<clientId>`, TTL 3 600 s
- Cache **invalidé** à chaque `PATCH` sur le KYC
- Enregistrement d'un `AuditLog` à chaque calcul

##### Points clés CDA

- Le score est calculé **à partir des données KYC**, pas des transactions (score statique initial)
- Chaque recalcul crée une nouvelle ligne `risk_scores` → historique complet
- La justification (quels critères) doit être conservée (conformité réglementaire)
- Un score élevé déclenche une revue manuelle par un responsable

---

#### Audit trail

Historique **immuable** de toutes les actions significatives sur les entités métier.

```typescript
@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string; // 'PROSPECT', 'KYC_DOSSIER', 'DOCUMENT'

  @Column()
  entityId: string;

  @Column()
  action: string; // 'STATUS_CHANGED', 'DOCUMENT_UPLOADED', 'SCORE_CALCULATED'

  @Column('jsonb', { nullable: true })
  before: Record<string, unknown>;

  @Column('jsonb', { nullable: true })
  after: Record<string, unknown>;

  @Column()
  performedBy: string; // userId ou 'SYSTEM'

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Injectable()
export class AuditService {
  async log(params: CreateAuditLogDto) {
    await this.auditRepo.save(params);
    // L'audit trail est append-only — jamais de UPDATE ni DELETE
  }
}
```

##### Points clés CDA

- L'audit trail est **append-only** — jamais de modification ni suppression
- Obligatoire pour la conformité (AML, RGPD, audit interne, litiges)
- Stocker `before` et `after` permet de reconstruire l'historique complet
- Différent des logs techniques : l'audit trail est **métier** (qui a fait quoi, quand)

---

### Gestion des fichiers & données

#### Presigned URLs

URLs temporaires et signées permettant un accès direct au stockage objet (S3, Minio) **sans transiter par le backend**.

```
Sans presigned URL :                     Avec presigned URL :
Client → Backend → S3 (upload)           1. Client → Backend (demande URL)
← gros fichiers passent par le backend   2. Backend → Client (URL signée, 15min)
                                         3. Client → S3 directement (upload)
```

```typescript
@Injectable()
export class StorageService {
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  // URL d'upload
  async getUploadUrl(fileName: string, contentType: string) {
    const key = `documents/${randomUUID()}/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 }); // 15min
    return { url, key };
  }

  // URL de téléchargement
  async getDownloadUrl(key: string) {
    const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: 300 }); // 5min
  }
}
```

##### Points clés CDA

- Le bucket S3 est **privé** — seules les presigned URLs permettent l'accès
- L'URL expire rapidement (15min upload, 5min download)
- Avantage : les fichiers ne transitent pas par le backend → réduit la charge serveur
- Sécurité : toujours valider le type MIME côté backend après upload (ne pas faire confiance au `contentType` du client)

---

#### RGPD & données personnelles

**RGPD (Règlement Général sur la Protection des Données) :** cadre européen de protection des données personnelles (entré en vigueur mai 2018).

##### Droits des personnes

| Droit | Description | Implémentation technique |
|-------|-------------|--------------------------|
| **Accès** | Obtenir ses données | Export JSON/CSV du profil |
| **Rectification** | Corriger ses données | Endpoint PATCH |
| **Effacement** | "Droit à l'oubli" | Anonymisation |
| **Portabilité** | Recevoir ses données en format structuré | Export GDPR |
| **Opposition** | S'opposer au traitement | Unsubscribe, opt-out |
| **Limitation** | Geler le traitement sans supprimer | Flag `processingFrozen` |

```typescript
@Injectable()
export class GdprService {
  async anonymize(prospectId: string) {
    // Anonymiser les données personnelles identifiantes
    await this.prospectRepo.update(prospectId, {
      email: `deleted-${randomUUID()}@anonymized.invalid`,
      firstName: 'ANONYMIZED',
      lastName: 'ANONYMIZED',
      phone: null,
      address: null,
      // Les données légales KYC restent (obligation AML 5 ans)
    });

    // Supprimer les documents du stockage
    await this.storageService.deleteFolder(`documents/${prospectId}/`);

    // Tracer l'anonymisation (audit)
    await this.auditService.log({
      entityType: 'PROSPECT',
      entityId: prospectId,
      action: 'GDPR_ANONYMIZED',
      performedBy: 'SYSTEM',
    });
  }
}
```

##### Points clés CDA

- **Privacy by design** : ne collecter que les données nécessaires (minimisation)
- RGPD et AML entrent en conflit (droit à l'oubli vs rétention 5 ans) → **anonymiser** plutôt que supprimer
- Les violations doivent être notifiées à la **CNIL dans les 72h**
- **DPO** obligatoire si traitement à grande échelle de données sensibles

---

#### Chiffrement données

Protéger les données sensibles **au repos** et **en transit**.

##### En transit → TLS (voir section HTTPS & TLS)

##### Au repos — chiffrement applicatif

```typescript
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm'; // chiffrement authentifié
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // détecte la falsification
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(encoded: string): string {
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, 16);
  const authTag = buf.subarray(16, 32);
  const encrypted = buf.subarray(32);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

// Chiffrer un champ sensible dans l'entité TypeORM
@Entity()
export class Prospect {
  @Column({ transformer: { to: encrypt, from: decrypt } })
  ssn: string; // numéro de sécurité sociale — chiffré en BDD
}
```

##### Niveaux de chiffrement

| Niveau | Quoi | Outils |
|--------|------|--------|
| Transport | Données en transit réseau | TLS/HTTPS |
| Applicatif | Champs sensibles spécifiques | AES-256-GCM, `@Column transformer` |
| Disque | Volume complet | LUKS (Linux), AWS EBS encryption |
| BDD | Chiffrement transparent | pgcrypto (PostgreSQL) |

##### Points clés CDA

- **AES-256-GCM** = chiffrement authentifié (intégrité + confidentialité)
- La clé de chiffrement ne doit **jamais** être dans le code → variable d'env ou AWS KMS
- Chiffrer les champs vraiment sensibles : IBAN, NSS, données biométriques
- Le chiffrement disque protège les backups volés, pas les accès légitimes compromis
