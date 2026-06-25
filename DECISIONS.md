<!--
  creator: Mohamed Marwen Maalawi
  authors: Mohamed Marwen Maalawi
  data-owner: Mohamed-Marwen-Maalawi
-->

# DECISIONS.md — Hypothèses et arbitrages

> Ce document explique **les choix assumés** face à un énoncé volontairement imprécis.
> Pour chaque zone grise : le contexte, les options envisagées, le choix retenu et **pourquoi**
> (y compris l'option écartée). C'est le cœur de l'exercice.
>
> Auteur : **Mohamed Marwen Maalawi** — © 2026.

---

## 0. Cadrage : ce que je n'ai volontairement PAS construit

L'énoncé évalue le **jugement** et la **maîtrise du périmètre** sur 48 h. J'ai donc tracé une
frontière explicite. Hors périmètre, assumé et justifié (voir aussi `FUTURE_EVOLUTION.md`) :

- **Authentification / RBAC** : outil interne, utilisateurs de confiance. L'ajouter aurait
  consommé un temps précieux sans servir le besoin métier exprimé (« suivi commercial d'une
  équipe interne »).
- **Multi-devise** : une seule devise (EUR). Le métier n'a mentionné qu'un « montant ».
- **Multi-tenant, temps réel, notifications e-mail, audit log** : non demandés, non construits.
- **Prévision pondérée (weighted forecast)** : documentée comme évolution future plutôt
  qu'implémentée maintenant (voir Décision 4).

> Nommer ces exclusions transforme un « manque » en **décision de périmètre**.

---

## 1. Modèle Client : entreprise vs particulier *(zone grise assignée)*

**Besoin :** « deux types de clients : des entreprises et des particuliers — pas tout à fait les
mêmes infos à saisir. »

### Options
- **A — Table unique + discriminant `type`** (retenue)
  Une table `Client`, un enum `type` (`COMPANY` | `INDIVIDUAL`), des colonnes spécifiques au type,
  une contrainte `CHECK` en base + une validation par type côté DTO.
  - *Pour :* jointure unique depuis `Opportunity`, filtrage par type trivial, juste dimensionné
    pour 48 h, une seule source de vérité.
  - *Contre :* quelques colonnes nullables ; l'invariant « les bons champs selon le type » doit
    être garanti par l'application **et** la contrainte `CHECK`.
- **B — Table de base + profils 1:1** (`Client` + `CompanyProfile` / `IndividualProfile`)
  - *Pour :* aucune colonne nullable, parfaitement normalisé.
  - *Contre :* plus de jointures et de code que le périmètre ne le justifie.
- **C — Deux tables séparées + FK polymorphe**
  - *Contre :* les FK polymorphes sont douloureuses sous Prisma/PostgreSQL (pas de FK réelle).
    Écartée.

### Décision : **Option A**.

### Champs retenus
| Champ | COMPANY | INDIVIDUAL | Commun |
|---|:--:|:--:|:--:|
| `email`, `phone`, `ownerName` | | | ✅ |
| `legalName` (raison sociale) | ✅ | | |
| `siren` (SIREN/identifiant) | ✅ (optionnel) | | |
| `industry` (secteur) | ✅ | | |
| `headcount` (tranche d'effectif) | ✅ | | |
| `firstName`, `lastName` | | ✅ | |

- **Nom d'affichage** dérivé : `COMPANY → legalName` ; `INDIVIDUAL → "firstName lastName"`.
- **Invariant garanti** par : (1) DTO discriminé selon `type` côté API, (2) contrainte `CHECK`
  en base imposant la présence des champs requis selon le `type`.

---

## 2. Étapes du pipeline & issue (gagné/perdu)

**Besoin :** « étape du pipeline ».

### Options
- **A — Enum `stage` + champ `status` séparé** (retenue)
  `stage` : `NEW → QUALIFIED → PROPOSAL → NEGOTIATION` ; `status` : `OPEN | WON | LOST`.
  - *Pour :* les KPI et la détection des « problèmes » ne s'appliquent **proprement** qu'aux
    opportunités `OPEN` ; le taux de conversion est immédiat ; on ne mélange pas « avancement »
    et « issue ».
  - *Contre :* deux champs au lieu d'un.
- **B — Enum unique incluant `WON`/`LOST` comme étapes terminales**
  - *Pour :* un seul champ, kanban classique.
  - *Contre :* brouille la notion de « valeur du pipeline » (les gagnés comptent-ils ?) et oblige
    de toute façon la règle « problème » à traiter les étapes terminales à part.

### Décision : **Option A**.
- Une opportunité `WON`/`LOST` n'est **jamais** « en problème » (elle est close).
- L'ordre des étapes est porté par l'enum et par un index d'affichage pour le tri kanban.

---

## 3. Règle « opportunité à problème » *(zone grise assignée)*

**Besoin :** « repérer vite les opportunités qui stagnent ou qui sont en retard ».
Deux notions distinctes → deux signaux distincts.

### Options
- **A — En retard + Stagnante basée sur la dernière _activité_** (retenue)
  - **OVERDUE** : `status = OPEN` **ET** `expectedCloseDate < aujourd'hui`.
  - **STALLED** : `status = OPEN` **ET** aucune **activité** depuis **14 jours**. On s'appuie sur
    `lastActivityAt` (dénormalisé depuis la timeline d'activités) ; **à défaut d'activité**, on
    retombe sur `stageChangedAt` (une affaire jamais touchée peut stagner).
  - *Pour :* deux badges explicables avec *raison* affichable (« En retard de 12 j »,
    « Stagnante depuis 21 j »). Définition métier juste : la stagnation, c'est l'absence
    d'**interaction**, pas seulement l'absence de changement d'étape.
  - *Contre :* nécessite la timeline d'activités et le champ dénormalisé `lastActivityAt`.
- **B — Uniquement basé sur `stageChangedAt`** (itération 1)
  - *Contre :* une affaire peut changer d'étape sans réelle activité, ou rester vivante sans
    changer d'étape → signal moins fidèle. (C'était le choix initial, remplacé par A.)
- **C — Uniquement basé sur la date** (en retard + « à échéance proche »)
  - *Contre :* ignore les affaires immobiles dont la date n'est pas encore passée.
- **D — Seuils de stagnation par étape**
  - *Pour :* plus réaliste. *Contre :* plus de paramètres à calibrer → reporté.

### Décision : **Option A**, seuil **plat de 14 jours** (constante documentée, ajustable).
- **Sémantique de date-only (fuseau `Europe/Paris`)** pour `expectedCloseDate` : on compare des
  *jours*, pas des instants, pour qu'une affaire ne bascule pas « en retard » à cause d'un fuseau.
- Calcul **dérivé** (jamais stocké) : l'état « problème » est recalculé à la lecture à partir de
  `status`, `expectedCloseDate`, `lastActivityAt`, `stageChangedAt`. Pas de désynchronisation.
- `lastActivityAt` est mis à jour (en avant uniquement) à chaque activité journalisée, dans une
  transaction → cohérence garantie, et filtrage SQL `problemOnly` efficace.
- *Évolution future :* seuils par étape (option D) — voir `FUTURE_EVOLUTION.md`.

---

## 4. Récap du pipeline (KPI) *(zone grise assignée)*

**Besoin :** « un petit récap chiffré du pipeline quelque part » + « repérer vite ».

### Option retenue : **un récap actionnable pour un manager commercial**
Endpoint d'agrégation unique renvoyant :
- **Valeur totale du pipeline ouvert** (somme des montants `OPEN`).
- **Nombre d'opportunités par étape**.
- **Valeur par étape**.
- **En retard** : nombre **et** valeur (exposition au risque).
- **Stagnantes** : nombre **et** valeur.
- **Taux de conversion** : `won / (won + lost)`.

S'y ajoute (itération 2) un **flux « À traiter »** (`GET /pipeline/attention`) : trois listes
actionnables et plafonnées — *en retard*, *stagnantes*, *signatures à venir (30 j)* — pour que le
tableau de bord ne soit pas seulement contemplatif mais **pilote l'action quotidienne** du commercial.

### Écarté pour maintenant
- **Prévision pondérée** (`montant × probabilité par étape`) et autres analyses : pertinent mais
  introduit des hypothèses de probabilité à calibrer → **documenté en évolution future**, pas
  implémenté. Cohérent avec le périmètre 48 h.

**Pourquoi ce choix :** le tableau de bord reste centré sur l'information *actionnable* (où est la
valeur, qu'est-ce qui dérape) sans sur-construire.

---

## 5. Décisions techniques transverses (prises et assumées)

| Sujet | Décision | Pourquoi |
|---|---|---|
| **Montant** | Prisma `Decimal` (pas `Float`) | Pas d'erreurs d'arrondi monétaire. |
| **Devise** | EUR unique | Le métier n'a parlé que d'« un montant ». |
| **Propriétaire** | `ownerName` (texte libre) sur l'opportunité | Permet le cadrage « commercial / manager » sans comptes utilisateurs. |
| **Suppression** | Hard delete (`204`) | Requêtes simples ; soft-delete listé en évolution future. |
| **Pagination** | Côté serveur, offset + métadonnées (`total`, `page`, `pageSize`, `totalPages`, `hasNext`) | La pagination serveur est inutile à l'UI sans le total. |
| **Filtres** | Par `stage`, `status`, `clientType`, + recherche par nom | Couvre l'exigence ; full-text différé. |
| **Tri** | Par `expectedCloseDate`, `amount`, `createdAt` (asc/desc) | Besoins de tri d'une liste commerciale. |
| **Contrat API typé** | Types partagés back ↔ front | Honore le « TypeScript strict » jusqu'à la frontière réseau. |
| **Erreurs** | Filtre d'exception global → enveloppe d'erreur unique `{ statusCode, error, message, details? }` | Gestion centralisée + contrat cohérent, sans fuite de stack. |
| **Codes HTTP** | `201` création, `200` lecture/maj, `204` suppression, `400` validation, `404` introuvable, `409` conflit | Sémantique REST cohérente, explicitement évaluée. |
| **i18n** | Français par défaut, anglais disponible | Le métier et l'énoncé sont en français. |
| **Seed** | ~8 clients (avec contact), ~19 opportunités (étapes/statuts variés, prochaines actions) et ~26 activités | Sans données, ni les KPI, ni la détection, ni la timeline ne sont démontrables au 1er lancement. |

---

## 6. Stratégie de tests (ciblée)

On ne teste pas les getters : on teste **la logique métier qui se relit**.
- **Unitaire (domaine pur)** : détection « problème » (overdue / stalled, y compris la bascule
  activité vs `stageChangedAt`), agrégation du pipeline (sommes sans dérive flottante, répartition,
  conversion).
- **Intégration (Supertest + DB)** : création d'opportunité (`201`) et validation (`400`),
  filtrage + pagination, agrégation, refus de suppression d'un client rattaché (`409`), `404`.
- **Frontend (Vitest + RTL)** : validation des formulaires (schéma Zod partagé), rendu des badges
  « à problème » et leur raison, dérivation de la santé client.

---

## 7. Itération 2 — Renforcement « produit CRM »

> Après une première itération CRUD + dashboard, ces décisions transforment le module en
> véritable outil de suivi commercial, **sans sortir du périmètre** (pas d'auth, pas d'infra).

### 7.1 Timeline d'activités
- **Décision :** table `Activity` (CALL / EMAIL / MEETING / NOTE) rattachée à l'opportunité
  (`onDelete: Cascade`), endpoints imbriqués `…/opportunities/:id/activities`.
- **Alternatives :** activités aussi sur le client (reporté) ; pas d'activités (rejeté — c'est le
  cœur d'un CRM).
- **Trade-off :** un peu plus de modèle, mais c'est ce qui distingue un CRM d'un stockage de fiches.
- **Lien :** alimente la règle « stagnante » (§3) et le suivi de la relation.

### 7.2 Notes vs activités
- **Décision :** `notes` reste un champ de **description libre** de l'opportunité ; l'**historique
  d'interactions** vit dans les activités. Deux usages distincts, pas de migration destructive.

### 7.3 Prochaine action
- **Décision :** champs `nextStep` (texte) + `nextStepDueAt` (date) sur l'opportunité.
- **Alternative :** entité `Task` dédiée → reportée (sur-dimensionné pour 48 h).
- **Valeur :** matérialise le « quoi faire ensuite », visible au détail et exploitable par le dashboard.

### 7.4 Contact principal (B2B)
- **Décision :** champs `contactName` / `contactRole` / `contactEmail` sur le client **entreprise**.
- **Alternative :** table `Contact` n:n → reportée (un seul contact suffit ici).

### 7.5 Alertes = dérivées (non stockées)
- **Décision :** le flux « À traiter » est **calculé à la lecture** (overdue / stalled / signatures
  imminentes). **Pas** de table d'alertes ni de cron.
- **Trade-off :** pas d'historique d'alerte, mais zéro désynchronisation et zéro infra.

### 7.6 Ancienneté & santé client (dérivées)
- **Décision :** `daysInStage` / `daysSinceLastActivity` calculés à la lecture ; **santé client**
  (sain / à risque / inactif) dérivée des opportunités du client. Indicateurs CRM classiques, gratuits.

### 7.7 Propriétaire commercial — entité reportée
- **Décision :** on **conserve `ownerName` en texte libre**. Une vraie entité `SalesRep` (filtre
  « mon pipeline », analyses par commercial) est **volontairement reportée** : elle frôle la gestion
  d'utilisateurs/auth, explicitement hors périmètre. Voir `FUTURE_EVOLUTION.md`.

---

*Document rédigé par Mohamed Marwen Maalawi — © 2026.*

---

## 8. Itération 3 — Pipeline board, responsive UX, polish pass

### 8.1 Pipeline board — vue Kanban en lecture seule

**Décision :** page `/pipeline` affichant les opportunités **ouvertes** (`OPEN`) groupées par étape,
avec totaux de valeur par colonne. La vue est **en lecture seule** : pas de drag-and-drop.

- **Alternatives :**
  - DnD kanban (P2, délibérément reporté) : utile, mais introduit une complexité d'état
    non justifiable en 48 h. Le changement d'étape via le formulaire d'édition est suffisant.
  - Afficher WON/LOST dans le kanban : écarté — mélanger les statuts ouverts et clos noie
    le pipeline actif.
- **Trade-off :** le kanban read-only donne la vue « où en est    mon pipeline » sans la dette technique du DnD..

### 8.2 Seuil de stagnation — 14 jours

**Seuil retenu : 14 jours d'inactivité** (absence d'activité journalisée ; à défaut, absence de
changement d'étape).

- **Alternatives envisagées :**
  - 30 jours (valeur « intuitive ») : trop permissif pour un CRM actif — une affaire peut mourir
    en silence en moins d'un mois. 30 jours revient à valider l'inaction.
  - Seuils par étape (ex. 7 j en NEGOTIATION, 21 j en NEW) : plus réaliste métier, documenté
    en évolution future.
- **Décision : 14 jours**, constante nommée (`STALL_THRESHOLD_DAYS`) localisée dans le domaine,
  ajustable sans réécriture. Aligné dans les tests unitaires, le dashboard, les labels i18n et
  le présent document.

### 8.3 Stratégie responsive — cibles prioritaires

**Cibles primaires : 1366×768 (laptop standard) et 1920×1080 (desktop)**. Ces deux résolutions
couvrent l'essentiel des machines de travail sur lesquelles le projet sera évalué.

| Breakpoint | Comportement attendu |
|---|---|
| `< sm` (< 640 px) | Card-list au lieu des tableaux, formulaires 1 colonne, sidebar ☰ |
| `sm–lg` (640–1024 px) | Formulaires 2 colonnes, tableaux compacts |
| `lg` (1024 px+) | Sidebar fixe verticale visible |
| `xl` (1280 px+) | Colonnes masquées révélées (Next step, Aging, Owner) |
| `3xl` (1920 px+) | Densité augmentée, paddings plus larges |

- **Anti-pattern évité :** padding excessif sur grand écran (look « site marketing »). L'app
  doit rester un outil de travail CRM, pas une landing page.
- **Formulaires :** `.form-shell` (full-width mobile, max-w-3xl sm+) avec des sections séparées
  par des diviseurs, et une barre d'actions sticky en bas sur mobile.
- **Filtres :** collapsibles sur mobile (toggle « Filtres ▼ ») avec compteur de filtres actifs,
  inline sur desktop.
- **Tableaux :** deux modes — table desktop (sm+, stretched-link + hover affordance) et card-list
  mobile. Pas de scroll horizontal sur petits écrans.

---

*Document rédigé par Mohamed Marwen Maalawi — © 2026.*
