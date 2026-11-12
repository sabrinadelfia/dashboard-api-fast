/**
 * aceiteFastService.ts
 *
 * Service layer for the Aceite Fast Executive Report.
 *
 * ARCHITECTURE NOTE:
 * ------------------
 * All functions in this file are designed to mirror a real REST API contract.
 * To connect a live SQL Server–backed API:
 *   1. Replace BASE_URL with the real endpoint.
 *   2. Uncomment the fetch() blocks (or swap in axios).
 *   3. Remove the `simulateLatency` calls and mocked return values.
 *
 * The TypeScript interfaces guarantee the shape remains identical between
 * the mock and the real implementation, so no consumer code changes.
 */

import {
  ApiResponse,
  DateFilterParams,
  ExecutiveSummaryDTO,
  PerformanceTableRowDTO,
  ProcessFlowStageDTO,
  SlaAlertDTO,
} from '../types/aceiteFast.types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Base URL of the Aceite Fast REST API.
 *
 * In production the URL is read from an environment variable provided by Vite:
 *   VITE_ACEITE_FAST_API_URL
 *
 * Example (.env):
 *   VITE_ACEITE_FAST_API_URL=https://api.suaempresa.local/aceite-fast
 *
 * Runtime access: `import.meta.env.VITE_ACEITE_FAST_API_URL`
 */
const BASE_URL: string =
  (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_ACEITE_FAST_API_URL) ||
  'https://api.internal.company.com/aceite-fast';

/** Simulated network latency in milliseconds (remove in production). */
const MOCK_LATENCY_MS = 600;

// ---------------------------------------------------------------------------
// Internal query-string builder
// ---------------------------------------------------------------------------

/**
 * Converts a DateFilterParams object into a URL query string.
 * e.g. { startDate: '2026-04-10', endDate: '2026-04-17' }
 *      → '?startDate=2026-04-10&endDate=2026-04-17'
 */
function buildQuery(filter: DateFilterParams): string {
  return `?startDate=${encodeURIComponent(filter.startDate)}&endDate=${encodeURIComponent(filter.endDate)}`;
}

/** Returns a human-readable label for the selected date range. */
export function buildPeriodLabel(filter: DateFilterParams): string {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  return `${fmt(filter.startDate)} a ${fmt(filter.endDate)}`;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/**
 * Simulates async network latency for the mock layer.
 * DELETE this function when connecting to a real API.
 */
function simulateLatency(ms: number = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic fetch wrapper.
 * Uncomment and adapt when replacing mocked data with real HTTP calls.
 *
 * async function apiFetch<T>(path: string): Promise<T> {
 *   const response = await fetch(`${BASE_URL}${path}`, {
 *     method: 'GET',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       Authorization: `Bearer ${getAuthToken()}`,
 *     },
 *   });
 *   if (!response.ok) {
 *     throw new Error(`API error ${response.status}: ${response.statusText}`);
 *   }
 *   const envelope: ApiResponse<T> = await response.json();
 *   if (!envelope.success) {
 *     throw new Error(envelope.message ?? 'Unknown API error');
 *   }
 *   return envelope.data;
 * }
 */

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_SUMMARY: ExecutiveSummaryDTO = {
  periodLabel: 'Últimos 7 dias',
  generatedAt: new Date().toISOString(),
  totalReceived: 1_482,
  totalSentToSFA: 1_237,
  totalInQueue: 245,
  newCustomers: 318,
  averageSlaHours: 4.6,
  slaComplianceRate: 91.4,
};

const MOCK_PROCESS_FLOW: ProcessFlowStageDTO[] = [
  {
    order: 1,
    stageCode: 'RECEIVED',
    stageName: 'Recebido do Simplifique',
    quantity: 1_482,
    averageTimeHours: 0.5,
  },
  {
    order: 2,
    stageCode: 'TREATED',
    stageName: 'Tratado',
    quantity: 1_380,
    averageTimeHours: 1.8,
  },
  {
    order: 3,
    stageCode: 'SENT_SFA',
    stageName: 'Enviado para SFA',
    quantity: 1_237,
    averageTimeHours: 0.3,
  },
  {
    order: 4,
    stageCode: 'RETURNED',
    stageName: 'Retornado para Simplifique',
    quantity: 143,
    averageTimeHours: 2.1,
  },
];

const MOCK_PERFORMANCE_TABLE: PerformanceTableRowDTO[] = [
  {
    stage: 'Recebido do Simplifique',
    quantity: 1_482,
    averageTimeHours: 0.5,
    percentageOfTotal: 100,
    previousQuantity: 1_310,
  },
  {
    stage: 'Tratado',
    quantity: 1_380,
    averageTimeHours: 1.8,
    percentageOfTotal: 93.1,
    previousQuantity: 1_205,
  },
  {
    stage: 'Validação Salesforce',
    quantity: 1_350,
    averageTimeHours: 0.9,
    percentageOfTotal: 91.1,
    previousQuantity: 1_180,
  },
  {
    stage: 'Enviado para SFA',
    quantity: 1_237,
    averageTimeHours: 0.3,
    percentageOfTotal: 83.5,
    previousQuantity: 1_100,
  },
  {
    stage: 'Retornado para Simplifique',
    quantity: 143,
    averageTimeHours: 2.1,
    percentageOfTotal: 9.6,
    previousQuantity: 110,
  },
  {
    stage: 'Em fila / Não tratado',
    quantity: 245,
    averageTimeHours: 6.2,
    percentageOfTotal: 16.5,
    previousQuantity: 205,
  },
];

const MOCK_SLA_ALERTS: SlaAlertDTO[] = [
  {
    document: '12.345.678/0001-99',
    companyName: 'Empresa Alpha Ltda.',
    currentStage: 'Tratado',
    hoursWaiting: 9.5,
    slaLimit: 8,
    severity: 'critical',
  },
  {
    document: '98.765.432/0001-10',
    companyName: 'Beta Comércio S.A.',
    currentStage: 'Validação Salesforce',
    hoursWaiting: 7.8,
    slaLimit: 8,
    severity: 'warning',
  },
  {
    document: '55.111.222/0001-33',
    companyName: 'Gama Serviços ME',
    currentStage: 'Recebido do Simplifique',
    hoursWaiting: 12.1,
    slaLimit: 6,
    severity: 'critical',
  },
  {
    document: '77.888.999/0001-44',
    companyName: 'Delta Indústria Ltda.',
    currentStage: 'Em fila / Não tratado',
    hoursWaiting: 7.2,
    slaLimit: 8,
    severity: 'warning',
  },
  {
    document: '33.444.555/0001-77',
    companyName: 'Épsilon Soluções S.A.',
    currentStage: 'Tratado',
    hoursWaiting: 10.3,
    slaLimit: 8,
    severity: 'critical',
  },
];

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Retrieves the executive summary KPIs.
 *
 * Real endpoint: GET /api/aceite-fast/executive-summary?startDate=&endDate=
 */
export async function getExecutiveSummary(
  filter: DateFilterParams
): Promise<ExecutiveSummaryDTO> {
  await simulateLatency();

  // ----- REPLACE with real call -----
  // return apiFetch<ExecutiveSummaryDTO>(`/executive-summary${buildQuery(filter)}`);
  // ----------------------------------

  // Mock: override the period label with the selected range.
  void filter; // consumed by real call; suppress TS unused-var warning in mock
  return {
    ...MOCK_SUMMARY,
    periodLabel: buildPeriodLabel(filter),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves ordered list of process flow stages with volume/time metrics.
 *
 * Real endpoint: GET /api/aceite-fast/process-flow?startDate=&endDate=
 */
export async function getProcessFlowMetrics(
  filter: DateFilterParams
): Promise<ProcessFlowStageDTO[]> {
  await simulateLatency();

  // ----- REPLACE with real call -----
  // return apiFetch<ProcessFlowStageDTO[]>(`/process-flow${buildQuery(filter)}`);
  // ----------------------------------

  void filter;
  return [...MOCK_PROCESS_FLOW].sort((a, b) => a.order - b.order);
}

/**
 * Retrieves per-stage performance breakdown for the table section.
 *
 * Real endpoint: GET /api/aceite-fast/performance-table?startDate=&endDate=
 */
export async function getPerformanceTable(
  filter: DateFilterParams
): Promise<PerformanceTableRowDTO[]> {
  await simulateLatency();

  // ----- REPLACE with real call -----
  // return apiFetch<PerformanceTableRowDTO[]>(`/performance-table${buildQuery(filter)}`);
  // ----------------------------------

  void filter;
  return MOCK_PERFORMANCE_TABLE;
}

/**
 * Retrieves CNPJs that are breaching or close to breaching their SLA.
 *
 * Real endpoint: GET /api/aceite-fast/sla-alerts?startDate=&endDate=
 */
export async function getSlaAlerts(
  filter: DateFilterParams
): Promise<SlaAlertDTO[]> {
  await simulateLatency();

  // ----- REPLACE with real call -----
  // return apiFetch<SlaAlertDTO[]>(`/sla-alerts${buildQuery(filter)}`);
  // ----------------------------------

  void filter;
  return MOCK_SLA_ALERTS;
}
