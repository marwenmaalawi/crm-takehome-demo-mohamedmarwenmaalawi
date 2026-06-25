import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Integration tests — exercise the real HTTP surface against the database.
 * Requires the dev database to be running (docker compose up). Created records are
 * cleaned up afterwards; assertions are structural so they don't depend on seed counts.
 *
 * @author Mohamed Marwen Maalawi
 */
describe('CRM API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdClientIds: string[] = [];
  const createdOppIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.opportunity.deleteMany({ where: { id: { in: createdOppIds } } });
    await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('GET /api/health → 200', async () => {
    const res = await http().get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/pipeline/summary → recap shape', async () => {
    const res = await http().get('/api/pipeline/summary').expect(200);
    expect(typeof res.body.openTotalValue).toBe('string');
    expect(res.body.byStage).toHaveLength(4);
    expect(res.body).toHaveProperty('conversionRate');
  });

  it('GET /api/pipeline/attention → three actionable lists', async () => {
    const res = await http().get('/api/pipeline/attention').expect(200);
    expect(Array.isArray(res.body.overdue)).toBe(true);
    expect(Array.isArray(res.body.stalled)).toBe(true);
    expect(Array.isArray(res.body.upcomingSignatures)).toBe(true);
  });

  it('POST /api/opportunities with an invalid body → 400 with field details', async () => {
    const res = await http()
      .post('/api/opportunities')
      .send({ title: '', amount: '-5' })
      .expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('creates a client + opportunity, filters by clientId, then enforces delete rules', async () => {
    // Create a company client (201)
    const clientRes = await http()
      .post('/api/clients')
      .send({ type: 'COMPANY', legalName: 'E2E Test SAS', ownerName: 'QA Bot' })
      .expect(201);
    const clientId = clientRes.body.id as string;
    createdClientIds.push(clientId);

    // Create an opportunity for it (201)
    const oppRes = await http()
      .post('/api/opportunities')
      .send({
        title: 'E2E opportunity',
        clientId,
        amount: '12345.50',
        expectedCloseDate: '2099-12-31',
        stage: 'NEW',
        ownerName: 'QA Bot',
      })
      .expect(201);
    const oppId = oppRes.body.id as string;
    createdOppIds.push(oppId);
    expect(oppRes.body.amount).toBe('12345.50');
    expect(oppRes.body.problem.isProblem).toBe(false);

    // List filtered by clientId → paginated, contains our opportunity
    const listRes = await http().get(`/api/opportunities?clientId=${clientId}`).expect(200);
    expect(listRes.body.meta).toHaveProperty('total', 1);
    expect(listRes.body.data[0].id).toBe(oppId);

    // Detail embeds client + activities
    const detailRes = await http().get(`/api/opportunities/${oppId}`).expect(200);
    expect(detailRes.body.client.id).toBe(clientId);
    expect(Array.isArray(detailRes.body.activities)).toBe(true);

    // Logging an activity (201)
    await http()
      .post(`/api/opportunities/${oppId}/activities`)
      .send({ type: 'CALL', summary: 'Intro call', occurredAt: '2099-01-01T10:00:00Z', authorName: 'QA Bot' })
      .expect(201);

    // Deleting the client while it has an opportunity → 409
    await http().delete(`/api/clients/${clientId}`).expect(409);

    // Delete the opportunity (204), then the client (204)
    await http().delete(`/api/opportunities/${oppId}`).expect(204);
    await http().delete(`/api/clients/${clientId}`).expect(204);
    createdOppIds.pop();
    createdClientIds.pop();
  });

  it('GET /api/opportunities/:id with an unknown id → 404 envelope', async () => {
    const res = await http()
      .get('/api/opportunities/00000000-0000-0000-0000-000000000000')
      .expect(404);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
