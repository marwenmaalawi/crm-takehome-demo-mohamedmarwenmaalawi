import type {
  ActivityDto,
  ApiError,
  ClientDto,
  CreateActivityDto,
  CreateClientDto,
  CreateOpportunityDto,
  ListClientsQuery,
  ListOpportunitiesQuery,
  OpportunityDto,
  OpportunityWithClientDto,
  Paginated,
  PipelineAttention,
  PipelineBoard,
  PipelineSummary,
  UpdateClientDto,
  UpdateOpportunityDto,
} from '@crm/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Error carrying the API's structured envelope, so the UI can show field-level issues. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: ApiError['details'],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body ?? {}) as ApiError;
    throw new ApiRequestError(res.status, err.message ?? 'Erreur API', err.details);
  }
  return body as T;
}

/* --------------------------------- reads --------------------------------- */

export function getPipelineSummary(): Promise<PipelineSummary> {
  return request<PipelineSummary>('/pipeline/summary');
}

export function getPipelineAttention(): Promise<PipelineAttention> {
  return request<PipelineAttention>('/pipeline/attention');
}

export function getPipelineBoard(): Promise<PipelineBoard> {
  return request<PipelineBoard>('/pipeline/board');
}

export function listOpportunities(
  query: Partial<ListOpportunitiesQuery>,
): Promise<Paginated<OpportunityDto>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });
  const qs = params.toString();
  return request<Paginated<OpportunityDto>>(`/opportunities${qs ? `?${qs}` : ''}`);
}

export function getOpportunity(id: string): Promise<OpportunityWithClientDto> {
  return request<OpportunityWithClientDto>(`/opportunities/${id}`);
}

export function getClients(query: Partial<ListClientsQuery> = {}): Promise<ClientDto[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });
  const qs = params.toString();
  return request<ClientDto[]>(`/clients${qs ? `?${qs}` : ''}`);
}

export function getClient(id: string): Promise<ClientDto> {
  return request<ClientDto>(`/clients/${id}`);
}

/* ------------------------------- mutations ------------------------------- */

export function createOpportunity(dto: CreateOpportunityDto): Promise<OpportunityDto> {
  return request<OpportunityDto>('/opportunities', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateOpportunity(id: string, dto: UpdateOpportunityDto): Promise<OpportunityDto> {
  return request<OpportunityDto>(`/opportunities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export function deleteOpportunity(id: string): Promise<void> {
  return request<void>(`/opportunities/${id}`, { method: 'DELETE' });
}

export function createClient(dto: CreateClientDto): Promise<ClientDto> {
  return request<ClientDto>('/clients', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateClient(id: string, dto: UpdateClientDto): Promise<ClientDto> {
  return request<ClientDto>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
}

export function deleteClient(id: string): Promise<void> {
  return request<void>(`/clients/${id}`, { method: 'DELETE' });
}

export function createActivity(opportunityId: string, dto: CreateActivityDto): Promise<ActivityDto> {
  return request<ActivityDto>(`/opportunities/${opportunityId}/activities`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
