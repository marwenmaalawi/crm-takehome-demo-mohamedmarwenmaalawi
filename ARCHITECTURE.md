<!--
  creator: Mohamed Marwen Maalawi
  authors: Mohamed Marwen Maalawi
  data-owner: Mohamed-Marwen-Maalawi
-->

# ARCHITECTURE.md

> Vue d'ensemble technique du module CRM. Les **choix produit/métier** sont dans
> [`DECISIONS.md`](./DECISIONS.md) ; ce document décrit **comment** c'est construit.
>
> Auteur : **Mohamed Marwen Maalawi** — © 2026.

---

## 1. Vue d'ensemble

Monorepo **npm workspaces** en trois paquets :

```
@crm/contracts  ──►  backend (NestJS)
       │
       └──────────►  frontend (Next.js)
```

- **`@crm/contracts`** : schémas **Zod** + types inférés. **Source unique de vérité**
  des contrats. Importé par l'API (validation des requêtes) **et** par le front
  (validation des formulaires + typage des réponses). Conséquence directe : le back
  et le front **ne peuvent pas diverger** sur la forme des données.
- **`backend`** : API REST NestJS modulaire, Prisma/PostgreSQL.
- **`frontend`** : Next.js App Router (Server Components pour la lecture, Client
  Components pour l'interactivité).

### Pourquoi ce découpage
La principale source de bugs full-stack est la **dérive de types à la frontière
réseau**. En partageant les schémas Zod, on obtient à la fois la validation runtime
(API + formulaires) et les types statiques, sans duplication.

---

## 2. Backend (NestJS)

### Modules
| Module | Responsabilité |
|---|---|
| `PrismaModule` | Service Prisma global (cycle de vie connect/disconnect). |
| `ClientsModule` | CRUD clients (création discriminée entreprise/particulier, suppression protégée). |
| `OpportunitiesModule` | CRUD opportunités, liste filtrée/paginée. |
| `ActivitiesModule` | Timeline d'activités imbriquée sous l'opportunité ; met à jour `lastActivityAt`. |
| `PipelineModule` | Agrégation (récap pipeline) + flux « À traiter » (`/pipeline/attention`). |
| `common/` | Pipe de validation Zod, filtre d'exception global. |
| `domain/` | **Logique métier pure** (sans framework), testée unitairement. |

### Le « domaine » isolé et testé
La logique sensible vit dans `src/domain/`, en **fonctions pures** :
- `opportunity-problem.ts` → `assessProblem()` : règle « en retard / stagnante ».
- `pipeline-summary.ts` → `computePipelineSummary()` : agrégation du pipeline.
- `date.util.ts` : comparaisons **en jours calendaires** (`Europe/Paris`).

Ces fonctions sont réutilisées **à l'identique** par la liste, le détail et
l'agrégation → pas de divergence de règle, et des tests rapides sans base de données.

### Stratégie de validation
Un `ZodValidationPipe` applique le schéma `@crm/contracts` à chaque corps de requête
et aux query params. Les erreurs Zod deviennent des `400` avec le détail par champ.

### Stratégie d'erreurs (centralisée)
Un `AllExceptionsFilter` global traduit toute exception en **une seule enveloppe** :

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Opportunité introuvable",
  "details": [{ "path": "amount", "message": "Montant invalide" }],
  "path": "/api/opportunities/…",
  "timestamp": "2026-06-23T20:42:05.540Z"
}
```

Mapping : `HttpException` → tel quel ; erreurs Prisma → codes cohérents
(`P2025` → 404, `P2002` → 409, `P2003` → 400) ; inconnu → 500 (sans fuite de stack).

### Codes HTTP
`201` création · `200` lecture/maj · `204` suppression · `400` validation ·
`404` introuvable · `409` conflit.

---

## 3. Modèle de données

> Schéma : [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma).
> Migrations versionnées dans `backend/prisma/migrations/`.

### `clients`
Table unique avec discriminant `type` (`COMPANY` | `INDIVIDUAL`) — voir DECISIONS §1.

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `type` | enum `ClientType` | discriminant |
| `email`, `phone`, `ownerName` | varchar | communs (`ownerName` requis) |
| `legalName`, `siren`, `industry`, `headcount` | varchar? | **COMPANY** |
| `contactName`, `contactRole`, `contactEmail` | varchar? | **COMPANY** — contact principal |
| `firstName`, `lastName` | varchar? | **INDIVIDUAL** |
| `createdAt`, `updatedAt` | timestamp | |

- **Index** : `type` (filtrage liste).
- **Contrainte `CHECK`** (`clients_type_fields_check`) : garantit `legalName` pour une
  entreprise, `firstName` + `lastName` pour un particulier. Double défense :
  DTO discriminé **et** base.

### `opportunities`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `title` | varchar | |
| `amount` | **Decimal(14,2)** | EUR, jamais flottant |
| `expectedCloseDate` | **date** | date seule (sémantique jour) |
| `stage` | enum `OpportunityStage` | NEW → QUALIFIED → PROPOSAL → NEGOTIATION |
| `status` | enum `OpportunityStatus` | OPEN / WON / LOST |
| `ownerName` | varchar | responsable commercial |
| `notes` | varchar? | description libre |
| `nextStep`, `nextStepDueAt` | varchar? / date? | prochaine action et son échéance |
| `stageChangedAt` | timestamp | repli pour la règle « stagnante » |
| `lastActivityAt` | timestamp? | **dénormalisé** depuis les activités → règle « stagnante » + filtre |
| `clientId` | uuid (FK → clients) | `onDelete: Restrict` |
| `createdAt`, `updatedAt` | timestamp | |

- **Index** : `status`, `stage`, `expectedCloseDate`, `clientId`, `nextStepDueAt`.
- **Relation** : un client → plusieurs opportunités ; une opportunité → un client, et **plusieurs activités**.
- **`stageChangedAt`** n'est mis à jour **que** lorsque `stage` change réellement.
- **`lastActivityAt`** n'avance qu'à la hausse, mis à jour dans la même transaction que l'activité.

### `activities`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `type` | enum `ActivityType` | CALL / EMAIL / MEETING / NOTE |
| `summary` | varchar | résumé de l'interaction |
| `occurredAt` | timestamp | date de l'interaction |
| `authorName` | varchar | auteur |
| `opportunityId` | uuid (FK → opportunities) | `onDelete: Cascade` |

- **Index** : `(opportunityId, occurredAt)` (lecture de la timeline).

---

## 4. API REST

Base : `/api`. Pagination, filtres, tri **côté serveur**.

### `GET /opportunities`
Query (validés par `listOpportunitiesQuerySchema`) :
`page`, `pageSize` (≤100), `stage`, `status`, `clientType`, `search`,
`problemOnly`, `sortBy` (`expectedCloseDate|amount|createdAt`), `sortDir`.

Réponse :
```json
{
  "data": [ { "...": "OpportunityDto", "problem": { "isProblem": true, "flags": ["OVERDUE"], "reasons": ["En retard de 12 j"] } } ],
  "meta": { "page": 1, "pageSize": 20, "total": 19, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

L'état « problème » est **calculé à la lecture** (jamais stocké) → pas de
désynchronisation possible.

### `GET /pipeline/summary`
```json
{
  "openTotalValue": "718350.50", "openCount": 13,
  "byStage": [ { "stage": "NEW", "count": 1, "value": "120000.00" }, "…" ],
  "overdue": { "count": 5, "value": "360900.00" },
  "stalled": { "count": 4, "value": "354750.00" },
  "conversionRate": 0.6667, "wonCount": 4, "lostCount": 2,
  "generatedAt": "…"
}
```

### `GET /pipeline/attention`
Flux « À traiter » : trois listes plafonnées d'`OpportunityDto`.
```json
{ "overdue": [ "…" ], "stalled": [ "…" ], "upcomingSignatures": [ "…" ] }
```

### Activités
`GET /opportunities/:id/activities` · `POST /opportunities/:id/activities` (201). La création
journalise l'interaction **et** fait avancer `lastActivityAt` de l'opportunité (transaction).

### Mutations
`POST /opportunities` (201) · `PATCH /opportunities/:id` · `DELETE /opportunities/:id` (204).
Clients : `POST /clients` (201) · `PATCH /clients/:id` · `DELETE /clients/:id` (`409` si des
opportunités y sont rattachées). Validation par les schémas Zod partagés (PATCH partiel).

---

## 5. Frontend (Next.js App Router)

- **Server Components** pour le tableau de bord, la liste et le détail : récupération
  des données côté serveur, `loading.tsx` et `error.tsx` natifs pour les états de
  chargement et d'erreur, `not-found.tsx` pour les 404.
- **Les filtres pilotent l'URL** (`searchParams`) → le serveur refait le fetch :
  idiome App Router, état partageable/bookmarkable, pagination cohérente.
- **Client Components** pour l'interactivité : formulaire (`react-hook-form` +
  `zodResolver(createOpportunitySchema)`), filtres, pagination, bascule de langue.
- **Client API typé** (`lib/api.ts`) : lève une `ApiRequestError` portant l'enveloppe
  d'erreur, ce qui permet de remonter les erreurs **champ par champ** sur le formulaire.

### i18n
Dictionnaires FR/EN dans `lib/i18n.ts` ; locale résolue côté serveur via cookie
(`lib/server-locale.ts`), bascule côté client. **Français par défaut.**

### Design system
Tailwind, jetons définis dans `tailwind.config.ts` : canvas neutre, un accent de
marque, et des couleurs sémantiques (rouge = en retard, ambre = stagnante,
vert = gagnée). Les opportunités à problème reçoivent un **liseré + une teinte** et
des badges avec **raison** au survol.

Primitives CSS documentées dans `globals.css` (`@layer components`) :
- `.form-shell` — wrapper responsive des formulaires (full-width mobile, max-w-3xl sm+).
- `.form-section` / `.form-section-title` — sections avec séparateur.
- `.form-actions` — barre d'actions sticky sur mobile, inline sur sm+.
- `.row-clickable` — rows de tableau clicables avec hover affordance explicite.
- `.filter-bar` / `.filter-row` — barre de filtres.

### Responsive strategy (cibles : 1366px et 1080p)

| Breakpoint | Comportement |
|---|---|
| `< sm` (< 640 px) | Card-list (pas de table), formulaires 1 col, sidebar ☰ |
| `sm–lg` | Formulaires 2 col, table compacte |
| `lg` | Sidebar fixe verticale |
| `xl` (1280+) | Colonnes Next step / Aging / Owner visibles |
| `3xl` (1920+) | Paddings plus larges, densité accrue |

Les tableaux utilisent deux modes de rendu distincts : un `<table>` pour sm+, une
card-list pour mobile. Pas de scroll horizontal sur petits écrans.

---

## 6. Décisions transverses (rappel)

| Sujet | Choix |
|---|---|
| Montant | `Decimal` (cents en interne pour les agrégats) |
| Dates « en retard » | jour calendaire, `Europe/Paris` |
| Devise | EUR unique |
| Auth | hors périmètre (assumé) |
| Suppression | hard delete |
| Tests | logique métier pure (problème + agrégation) |

Détails et alternatives écartées : [`DECISIONS.md`](./DECISIONS.md).
