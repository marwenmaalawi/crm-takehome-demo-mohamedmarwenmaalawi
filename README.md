<!--
  creator: Mohamed Marwen Maalawi
  authors: Mohamed Marwen Maalawi
  data-owner: Mohamed-Marwen-Maalawi
-->

# CRM Commercial — Module de suivi des opportunités

> Module CRM interne pour une équipe commerciale : gestion des **clients**
> (entreprises / particuliers), suivi des **opportunités** de vente, détection des
> affaires **en retard / stagnantes**, et **récapitulatif chiffré du pipeline**.
>
> Réalisé par **Mohamed Marwen Maalawi** — © 2026.

Stack : **NestJS · Prisma · PostgreSQL · Next.js (App Router) · TypeScript strict**.

---

## ✨ Aperçu

| | |
|---|---|
| **Tableau de bord** | KPI (valeur ouverte, exposition en retard / stagnante, conversion), répartition par étape, et un flux **« À traiter »** (en retard / stagnantes / signatures à venir). |
| **Liste des opportunités** | Filtres serveur (étape, statut, type de client, recherche), pagination serveur, **mise en avant visuelle** des affaires à problème. |
| **Détail opportunité** | Stepper d'étape, ancienneté, **prochaine action**, **timeline d'activités** (journaliser un appel/e-mail/RDV/note) et fiche client. |
| **Clients** | CRUD complet (entreprises / particuliers), contact principal B2B, **santé client** dérivée, opportunités rattachées. |
| **Création / édition** | Formulaires validés par le **même schéma Zod** que l'API. |
| **i18n** | Français par défaut, anglais disponible (bascule en bas de la barre latérale). |

Captures et raisonnement produit : voir [`DECISIONS.md`](./DECISIONS.md).

---

## 🚀 Démarrage rapide (< 5 min)

### Prérequis
- **Node.js 20+** et **npm 9+**
- **Docker** (pour PostgreSQL) — ou un PostgreSQL local accessible.

### Étapes

```bash
# 1. Tout préparer : copie des .env, install, DB, génération Prisma, migrations, seed
npm run setup

# 2. Lancer l'API (port 3001) et le front (port 3000)
npm run dev
```

`npm run setup` copie automatiquement les fichiers `.env` manquants — aucune étape
préalable. Puis ouvrir **http://localhost:3000**.

> ℹ️ La base (`take_home_crm_db`) tourne dans Docker sur le port hôte **5544** (et non
> 5432) pour ne pas entrer en conflit avec un PostgreSQL déjà présent. L'API écoute sur
> **3001**, le front sur **3000**.

Si `npm run setup` est lancé avant que PostgreSQL soit prêt, relancer simplement
`npm run db:migrate && npm run db:seed`.

---

## 🧱 Structure du dépôt (monorepo npm workspaces)

```
crm-takehome-demo-mohamedmarwenmaalawi/
├─ packages/contracts/   # @crm/contracts — schémas Zod + types, partagés back ↔ front
├─ backend/              # API NestJS
│  ├─ prisma/            # schema.prisma, migrations versionnées, seed.ts
│  └─ src/
│     ├─ domain/         # logique métier pure & testée (règle "problème", agrégation KPI)
│     ├─ common/         # pipe de validation Zod, filtre d'exception global
│     ├─ clients/ opportunities/ activities/ pipeline/  # modules métier
│     └─ prisma/         # service Prisma
│  └─ test/              # tests d'intégration (Supertest)
├─ frontend/             # Next.js App Router
│  ├─ app/               # routes (dashboard, opportunités, détail, formulaire)
│  ├─ components/        # UI (badges, table, filtres, formulaire, KPI…)
│  └─ lib/               # client API typé, i18n, formatage
├─ docker-compose.yml
├─ DECISIONS.md  ARCHITECTURE.md  FUTURE_EVOLUTION.md
└─ README.md
```

---

## 📜 Scripts (racine)

| Script | Rôle |
|---|---|
| `npm run setup` | Copie les `.env`, installe, démarre la DB, génère Prisma, migre, sème. |
| `npm run dev` | Lance API + front en parallèle. |
| `npm run build` | Construit contracts + backend + frontend. |
| `npm run lint` | Lint backend (ESLint) + frontend (next lint). |
| `npm test` | Tests unitaires backend + tests frontend (Vitest). |
| `npm run db:up` / `db:down` | Démarre / arrête PostgreSQL (Docker). |
| `npm run db:migrate` / `db:seed` | Applique les migrations / réinjecte le jeu de données. |

> Les tests d'**intégration** (Supertest, nécessitent la DB) : `npm -w backend run test:e2e`.

---

## 🧪 Tests

```bash
npm test                      # unitaires backend + frontend
npm -w backend run test:e2e   # intégration API (DB requise)
```

On cible la **logique qui se relit**, pas la couverture :
- **Domaine** : règle « en retard / stagnante » (bascule activité vs étape, bornes de seuil),
  agrégation pipeline (sommes sans dérive flottante, conversion).
- **Intégration** : création/validation, filtrage + pagination, agrégation, refus de suppression
  d'un client rattaché (409).
- **Frontend** : validation des formulaires (schéma Zod partagé), badges « à problème », santé client.

---

## 🔌 API (résumé)

Base : `http://localhost:3001/api`

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/health` | Sonde de vivacité. |
| `GET` | `/pipeline/summary` | Récapitulatif chiffré du pipeline. |
| `GET` | `/pipeline/attention` | Flux « À traiter » : en retard / stagnantes / signatures à venir. |
| `GET` | `/opportunities` | Liste filtrée + paginée (`stage`, `status`, `clientType`, `clientId`, `search`, `problemOnly`, `page`, `pageSize`, `sortBy`, `sortDir`). |
| `POST` | `/opportunities` | Création (201). |
| `GET` | `/opportunities/:id` | Détail + client + timeline d'activités. |
| `PATCH` | `/opportunities/:id` | Mise à jour partielle. |
| `DELETE` | `/opportunities/:id` | Suppression (204). |
| `GET` / `POST` | `/opportunities/:id/activities` | Liste / journalisation d'activités. |
| `GET` / `POST` | `/clients` | Liste (filtres `type`, `search`) / création. |
| `GET` / `PATCH` / `DELETE` | `/clients/:id` | Détail / mise à jour / suppression (409 si rattaché). |

Détails (payloads, codes HTTP, enveloppe d'erreur) : [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 📚 Documentation

- [`DECISIONS.md`](./DECISIONS.md) — hypothèses et arbitrages (le cœur de l'exercice).
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architecture, modèle de données, API, stratégies transverses.
- [`FUTURE_EVOLUTION.md`](./FUTURE_EVOLUTION.md) — pistes d'évolution assumées.

---

© 2026 **Mohamed Marwen Maalawi**.
