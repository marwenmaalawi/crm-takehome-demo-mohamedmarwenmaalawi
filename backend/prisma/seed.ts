import { PrismaClient, Prisma, ActivityType } from '@prisma/client';

/**
 * Seed — realistic, "alive on first launch" dataset:
 *  - ~8 clients (companies with a primary contact + individuals)
 *  - ~19 opportunities across every stage/status, with next steps & due dates
 *  - an activity history per opportunity (drives the timeline AND the "stalled" rule)
 * Deliberately covers overdue / stalled / both / healthy / won / lost cases so the
 * dashboard "attention" feed and KPIs are meaningful immediately.
 *
 * @author Mohamed Marwen Maalawi — © 2026
 */
const prisma = new PrismaClient();

const DAY = 86_400_000;
const today = new Date();
/** Date-only N days from today, stored at UTC midnight (matches @db.Date). */
const dayOffset = (n: number): Date => {
  const d = new Date(today.getTime() + n * DAY);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};
/** An instant N days ago. */
const daysAgo = (n: number): Date => new Date(today.getTime() - n * DAY);

type Act = { daysAgo: number; type: ActivityType; summary: string; author: string };

async function main(): Promise<void> {
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.client.deleteMany();

  const companies = await Promise.all(
    [
      { legalName: 'Atelier Dupont SAS', siren: '784671695', industry: 'Industrie', headcount: '51-200', ownerName: 'Camille Robert', email: 'contact@atelier-dupont.fr', contactName: 'Hélène Dupont', contactRole: 'Directrice achats', contactEmail: 'h.dupont@atelier-dupont.fr' },
      { legalName: 'Nordique Logistique', siren: '552100554', industry: 'Transport', headcount: '201-500', ownerName: 'Yanis Bernard', email: 'achats@nordique-log.fr', contactName: 'Thomas Roy', contactRole: 'Responsable flotte', contactEmail: 't.roy@nordique-log.fr' },
      { legalName: 'Studio Lumen', siren: '843217760', industry: 'Médias', headcount: '11-50', ownerName: 'Camille Robert', email: 'hello@studiolumen.fr', contactName: 'Sarah Benali', contactRole: 'Productrice', contactEmail: 's.benali@studiolumen.fr' },
      { legalName: 'Groupe Méridien', siren: '329187654', industry: 'Conseil', headcount: '500+', ownerName: 'Inès Moreau', email: 'rfp@meridien.com', contactName: 'Paul Girard', contactRole: 'CFO', contactEmail: 'p.girard@meridien.com' },
      { legalName: 'BioTerra Cosmétiques', siren: '901234562', industry: 'Cosmétique', headcount: '11-50', ownerName: 'Hugo Lefèvre', email: 'pro@bioterra.fr', contactName: 'Nadia Cherif', contactRole: 'Responsable production', contactEmail: 'n.cherif@bioterra.fr' },
    ].map((c) => prisma.client.create({ data: { type: 'COMPANY', phone: '+33 1 23 45 67 89', ...c } })),
  );

  const individuals = await Promise.all(
    [
      { firstName: 'Léa', lastName: 'Fontaine', ownerName: 'Inès Moreau', email: 'lea.fontaine@example.fr' },
      { firstName: 'Marc', lastName: 'Olivier', ownerName: 'Hugo Lefèvre', email: 'm.olivier@example.fr' },
      { firstName: 'Sophie', lastName: 'Nguyen', ownerName: 'Yanis Bernard', email: 's.nguyen@example.fr' },
    ].map((c) => prisma.client.create({ data: { type: 'INDIVIDUAL', phone: '+33 6 12 34 56 78', ...c } })),
  );

  const all = [...companies, ...individuals];
  const pick = (i: number) => all[i % all.length];

  type Spec = {
    title: string;
    clientIdx: number;
    amount: string;
    stage: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION';
    status: 'OPEN' | 'WON' | 'LOST';
    closeInDays: number;
    stageAgeDays: number;
    owner: string;
    nextStep?: string;
    nextStepInDays?: number;
    activities: Act[];
  };

  const specs: Spec[] = [
    // ---- Healthy open deals (recent activity, future close) ----
    {
      title: 'Refonte chaîne de production', clientIdx: 0, amount: '85000.00', stage: 'NEGOTIATION', status: 'OPEN',
      closeInDays: 12, stageAgeDays: 3, owner: 'Camille Robert', nextStep: 'Envoyer le contrat final', nextStepInDays: 2,
      activities: [
        { daysAgo: 30, type: 'MEETING', summary: 'Réunion de cadrage sur site', author: 'Camille Robert' },
        { daysAgo: 12, type: 'EMAIL', summary: 'Envoi de la proposition chiffrée', author: 'Camille Robert' },
        { daysAgo: 3, type: 'CALL', summary: 'Validation du périmètre, négociation du planning', author: 'Camille Robert' },
      ],
    },
    {
      title: 'Contrat maintenance annuel', clientIdx: 1, amount: '24000.00', stage: 'PROPOSAL', status: 'OPEN',
      closeInDays: 20, stageAgeDays: 5, owner: 'Yanis Bernard', nextStep: 'Relancer pour retour sur devis', nextStepInDays: 4,
      activities: [
        { daysAgo: 14, type: 'CALL', summary: 'Qualification du besoin de maintenance', author: 'Yanis Bernard' },
        { daysAgo: 5, type: 'EMAIL', summary: 'Devis envoyé', author: 'Yanis Bernard' },
      ],
    },
    {
      title: 'Campagne vidéo de marque', clientIdx: 2, amount: '15500.50', stage: 'QUALIFIED', status: 'OPEN',
      closeInDays: 30, stageAgeDays: 2, owner: 'Camille Robert', nextStep: 'Atelier créatif', nextStepInDays: 6,
      activities: [
        { daysAgo: 8, type: 'MEETING', summary: 'Présentation de la démarche créative', author: 'Camille Robert' },
        { daysAgo: 2, type: 'NOTE', summary: 'Budget confirmé par la productrice', author: 'Camille Robert' },
      ],
    },
    {
      title: 'Audit conseil stratégique', clientIdx: 3, amount: '120000.00', stage: 'NEW', status: 'OPEN',
      closeInDays: 45, stageAgeDays: 1, owner: 'Inès Moreau', nextStep: 'Cadrer le périmètre avec le CFO', nextStepInDays: 3,
      activities: [{ daysAgo: 1, type: 'CALL', summary: 'Prise de contact entrante via le site', author: 'Inès Moreau' }],
    },
    {
      title: 'Gamme soins bio — déploiement', clientIdx: 4, amount: '38000.00', stage: 'PROPOSAL', status: 'OPEN',
      closeInDays: 18, stageAgeDays: 6, owner: 'Hugo Lefèvre', nextStep: 'Présenter le plan de déploiement', nextStepInDays: 5,
      activities: [
        { daysAgo: 16, type: 'MEETING', summary: 'Visite de la ligne de production', author: 'Hugo Lefèvre' },
        { daysAgo: 6, type: 'EMAIL', summary: 'Proposition commerciale transmise', author: 'Hugo Lefèvre' },
      ],
    },
    {
      title: 'Accompagnement personnel', clientIdx: 5, amount: '4200.00', stage: 'QUALIFIED', status: 'OPEN',
      closeInDays: 25, stageAgeDays: 4, owner: 'Inès Moreau', nextStep: 'Envoyer la convention', nextStepInDays: 7,
      activities: [{ daysAgo: 4, type: 'CALL', summary: 'Définition des objectifs', author: 'Inès Moreau' }],
    },

    // ---- OVERDUE (past close date, still open; recent enough activity) ----
    {
      title: 'Extension entrepôt nord', clientIdx: 1, amount: '64000.00', stage: 'NEGOTIATION', status: 'OPEN',
      closeInDays: -8, stageAgeDays: 6, owner: 'Yanis Bernard', nextStep: 'Confirmer la date de signature', nextStepInDays: -2,
      activities: [
        { daysAgo: 10, type: 'MEETING', summary: 'Négociation des conditions', author: 'Yanis Bernard' },
        { daysAgo: 4, type: 'EMAIL', summary: 'Relance pour planifier la signature', author: 'Yanis Bernard' },
      ],
    },
    {
      title: 'Pack identité visuelle', clientIdx: 2, amount: '9800.00', stage: 'PROPOSAL', status: 'OPEN',
      closeInDays: -3, stageAgeDays: 4, owner: 'Camille Robert', nextStep: 'Obtenir la validation du devis', nextStepInDays: 0,
      activities: [{ daysAgo: 4, type: 'CALL', summary: 'Ajustement du périmètre graphique', author: 'Camille Robert' }],
    },
    {
      title: 'Prestation libérale Q2', clientIdx: 6, amount: '3100.00', stage: 'QUALIFIED', status: 'OPEN',
      closeInDays: -15, stageAgeDays: 9, owner: 'Hugo Lefèvre', nextStep: 'Reprendre contact', nextStepInDays: -10,
      activities: [{ daysAgo: 9, type: 'EMAIL', summary: 'Proposition envoyée, sans retour', author: 'Hugo Lefèvre' }],
    },

    // ---- STALLED (no activity for > 14 days, close date still ahead) ----
    {
      title: 'Renouvellement parc machines', clientIdx: 0, amount: '52000.00', stage: 'PROPOSAL', status: 'OPEN',
      closeInDays: 22, stageAgeDays: 21, owner: 'Camille Robert', nextStep: 'Relancer la directrice achats', nextStepInDays: -3,
      activities: [{ daysAgo: 21, type: 'EMAIL', summary: 'Devis transmis — en attente de retour', author: 'Camille Robert' }],
    },
    {
      title: 'Logiciel suivi flotte', clientIdx: 1, amount: '18750.00', stage: 'QUALIFIED', status: 'OPEN',
      closeInDays: 40, stageAgeDays: 31, owner: 'Yanis Bernard', nextStep: 'Reprogrammer une démo', nextStepInDays: -5,
      activities: [{ daysAgo: 31, type: 'MEETING', summary: 'Démo initiale réalisée', author: 'Yanis Bernard' }],
    },

    // ---- OVERDUE *and* STALLED ----
    {
      title: 'Déploiement multi-sites', clientIdx: 3, amount: '210000.00', stage: 'NEGOTIATION', status: 'OPEN',
      closeInDays: -20, stageAgeDays: 28, owner: 'Inès Moreau', nextStep: 'Escalader au sponsor', nextStepInDays: -18,
      activities: [{ daysAgo: 28, type: 'MEETING', summary: 'Dernier comité de pilotage', author: 'Inès Moreau' }],
    },
    {
      title: 'Ligne de production cosmétique', clientIdx: 4, amount: '74000.00', stage: 'PROPOSAL', status: 'OPEN',
      closeInDays: -5, stageAgeDays: 19, owner: 'Hugo Lefèvre', nextStep: 'Relancer la responsable production', nextStepInDays: -4,
      activities: [{ daysAgo: 19, type: 'EMAIL', summary: 'Proposition envoyée — silence radio', author: 'Hugo Lefèvre' }],
    },

    // ---- WON ----
    {
      title: 'Lot pièces détachées 2026', clientIdx: 0, amount: '46000.00', stage: 'NEGOTIATION', status: 'WON',
      closeInDays: -25, stageAgeDays: 25, owner: 'Camille Robert',
      activities: [
        { daysAgo: 40, type: 'MEETING', summary: 'Négociation finale', author: 'Camille Robert' },
        { daysAgo: 25, type: 'NOTE', summary: 'Bon de commande signé 🎉', author: 'Camille Robert' },
      ],
    },
    {
      title: 'Tournage spot publicitaire', clientIdx: 2, amount: '22000.00', stage: 'NEGOTIATION', status: 'WON',
      closeInDays: -10, stageAgeDays: 10, owner: 'Camille Robert',
      activities: [{ daysAgo: 10, type: 'NOTE', summary: 'Contrat signé', author: 'Camille Robert' }],
    },
    {
      title: 'Mission conseil RH', clientIdx: 3, amount: '88000.00', stage: 'NEGOTIATION', status: 'WON',
      closeInDays: -40, stageAgeDays: 40, owner: 'Inès Moreau',
      activities: [{ daysAgo: 40, type: 'NOTE', summary: 'Affaire gagnée', author: 'Inès Moreau' }],
    },
    {
      title: 'Coaching individuel', clientIdx: 5, amount: '2600.00', stage: 'NEGOTIATION', status: 'WON',
      closeInDays: -7, stageAgeDays: 7, owner: 'Inès Moreau',
      activities: [{ daysAgo: 7, type: 'NOTE', summary: 'Convention signée', author: 'Inès Moreau' }],
    },

    // ---- LOST ----
    {
      title: 'Appel d’offres transport', clientIdx: 1, amount: '99000.00', stage: 'NEGOTIATION', status: 'LOST',
      closeInDays: -30, stageAgeDays: 30, owner: 'Yanis Bernard',
      activities: [{ daysAgo: 30, type: 'NOTE', summary: 'Perdu face à un concurrent moins cher', author: 'Yanis Bernard' }],
    },
    {
      title: 'Refonte packaging', clientIdx: 4, amount: '17000.00', stage: 'PROPOSAL', status: 'LOST',
      closeInDays: -18, stageAgeDays: 18, owner: 'Hugo Lefèvre',
      activities: [{ daysAgo: 18, type: 'NOTE', summary: 'Projet reporté côté client', author: 'Hugo Lefèvre' }],
    },
  ];

  for (const s of specs) {
    const lastActivityAt =
      s.activities.length > 0
        ? daysAgo(Math.min(...s.activities.map((a) => a.daysAgo)))
        : null;

    await prisma.opportunity.create({
      data: {
        title: s.title,
        clientId: pick(s.clientIdx).id,
        amount: new Prisma.Decimal(s.amount),
        expectedCloseDate: dayOffset(s.closeInDays),
        stage: s.stage,
        status: s.status,
        ownerName: s.owner,
        nextStep: s.nextStep ?? null,
        nextStepDueAt: s.nextStepInDays !== undefined ? dayOffset(s.nextStepInDays) : null,
        stageChangedAt: daysAgo(s.stageAgeDays),
        lastActivityAt,
        activities: {
          create: s.activities.map((a) => ({
            type: a.type,
            summary: a.summary,
            occurredAt: daysAgo(a.daysAgo),
            authorName: a.author,
          })),
        },
      },
    });
  }

  const [clientCount, oppCount, actCount] = await Promise.all([
    prisma.client.count(),
    prisma.opportunity.count(),
    prisma.activity.count(),
  ]);
  console.log(`Seed terminé : ${clientCount} clients, ${oppCount} opportunités, ${actCount} activités.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
