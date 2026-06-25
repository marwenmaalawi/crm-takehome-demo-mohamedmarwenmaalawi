<!--
  creator: Mohamed Marwen Maalawi
  authors: Mohamed Marwen Maalawi
  data-owner: Mohamed-Marwen-Maalawi
-->

# FUTURE_EVOLUTION.md — Pistes d'évolution

> Ce qui a été **volontairement laissé de côté** pour respecter le périmètre 48 h, et
> comment l'ajouter proprement. Nommer ces exclusions, c'est transformer un « manque »
> en **décision de périmètre assumée**.
>
> Auteur : **Mohamed Marwen Maalawi** — © 2026.

---

## 0. Déjà livré en itération 2 (pour mémoire)

> Repères : ces éléments figuraient en évolution et sont désormais **implémentés**.
- ✅ **Timeline d'activités** (CALL/EMAIL/MEETING/NOTE) + règle « stagnante » fondée sur la
  **dernière activité**.
- ✅ **CRUD client complet** dans l'UI (liste, détail, création, édition, suppression protégée).
- ✅ **Flux « À traiter »** au dashboard (en retard / stagnantes / signatures à venir).
- ✅ **Prochaine action** (`nextStep` + échéance), **contact principal** B2B, **ancienneté** &
  **santé client** (dérivées).
- ✅ **Tests d'intégration** (Supertest) + **tests frontend** (Vitest/RTL).

## 1. Court terme (gains rapides)

- **Prévision pondérée** : `valeur × probabilité par étape`, avec probabilités
  paramétrables. Le modèle est déjà prêt (étape + montant) ; il suffit d'ajouter une
  table de probabilités et un champ au récap. *(Écarté au profit d'indicateurs
  actionnables sans hypothèses à calibrer — voir DECISIONS §4.)*
- **Entité `SalesRep`** : remplacer `ownerName` (texte libre) par une vraie référence pour
  activer un filtre « mon pipeline » et des analyses par commercial. **Reporté** car cela frôle
  la gestion d'utilisateurs (l'auth reste hors périmètre).
- **Seuils de stagnation par étape** : aujourd'hui un seuil plat de 14 j → seuils par étape
  (DECISIONS §3, option D).
- **Tri & recherche enrichis** : recherche plein-texte (PostgreSQL `tsvector`), tri multi-colonnes.
- **Tests e2e UI** (Playwright) en complément des tests d'intégration API et composants.

## 2. Moyen terme (produit)

- **Authentification & rôles** (Commercial / Manager) : aujourd'hui hors périmètre
  (outil interne de confiance). `ownerName` deviendrait une vraie relation `User`.
- **Entité `Task`** dédiée : remplacer `nextStep`/`nextStepDueAt` par des tâches assignables avec
  rappels et statut.
- **Contacts multiples** : passer du contact principal embarqué à une table `Contact` n:n.
- **Activités côté client** (pas seulement opportunité) + **soft delete / audit log**.
- **Notifications** : alertes (e-mail / in-app) quand une opportunité bascule « en retard »/« stagnante ».

## 3. Long terme (passage à l'échelle)

- **Multi-devise** (montant + code devise + taux historisé).
- **Multi-tenant** (cloisonnement par organisation).
- **Pagination par curseur** si les volumes deviennent importants (l'offset actuel
  suffit largement à cette échelle).
- **Cache du récap pipeline** (lecture fréquente, calcul stable) via une vue
  matérialisée ou un cache court.
- **Internationalisation complète** par segment de route (`/[locale]/…`) et
  externalisation des libellés.

---

## 4. Dette technique assumée

- Le filtre `problemOnly` côté SQL approxime la « stagnation » par un instant
  (`now − 14 j`) tandis que l'affichage utilise un calcul **au jour près** ; un écart
  d'un jour est possible en bordure. Acceptable pour un filtre ; à aligner via une
  fonction SQL si besoin de stricte cohérence.
- Pas de rate limiting ni de pagination des clients (volume faible attendu).

© 2026 **Mohamed Marwen Maalawi**.
