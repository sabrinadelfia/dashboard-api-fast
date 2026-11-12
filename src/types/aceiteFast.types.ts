/**
 * aceiteFast.types.ts
 *
 * Data Transfer Object (DTO) definitions for the Aceite Fast Executive Report.
 * These interfaces mirror the shape of payloads returned by the backend REST API
 * (SQL Server–backed). Field names use camelCase as per API contract convention.
 *
 * When connecting to a real backend, replace the mocked service with actual
 * fetch/axios calls that return data conforming to these interfaces.
 */

// ---------------------------------------------------------------------------
// Shared / primitives
// ---------------------------------------------------------------------------

/** ISO-8601 date-time string, e.g. "2026-04-17T10:30:00Z" */
export type ISODateString = string;

// ---------------------------------------------------------------------------
// Date filter
// ---------------------------------------------------------------------------

/**
 * Parameters sent to every API endpoint to scope results to a date range.
 * Both fields are ISO-8601 date strings (date-only format: "YYYY-MM-DD").
 * Mapped to query params: ?startDate=2026-04-10&endDate=2026-04-17
 */
export interface DateFilterParams {
  /** Inclusive start of the period (YYYY-MM-DD) */
  startDate: string;

  /** Inclusive end of the period (YYYY-MM-DD) */
  endDate: string;
}

// ---------------------------------------------------------------------------
// Section 1 – Executive Summary
// ---------------------------------------------------------------------------

/**
 * High-level KPIs for the Aceite Fast process.
 * Returned by: GET /api/aceite-fast/executive-summary?period=last7days
 */
export interface ExecutiveSummaryDTO {
  /** Reference period label shown on the report (e.g. "Últimos 7 dias") */
  periodLabel: string;

  /** Date/time this snapshot was generated on the server */
  generatedAt: ISODateString;

  /** Total CNPJ records received from Simplifique */
  totalReceived: number;

  /** Total records successfully forwarded to SFA */
  totalSentToSFA: number;

  /** Records still in queue / not yet processed */
  totalInQueue: number;

  /** CNPJs identified as new customers (not found in Salesforce) */
  newCustomers: number;

  /** Average SLA time across all processed records, in hours */
  averageSlaHours: number;

  /** Percentage of records processed within the agreed SLA window */
  slaComplianceRate: number; // 0–100
}

// ---------------------------------------------------------------------------
// Section 2 – Process Flow
// ---------------------------------------------------------------------------

/**
 * Represents a single step / stage in the Aceite Fast pipeline.
 * Returned by: GET /api/aceite-fast/process-flow?period=last7days
 */
export interface ProcessFlowStageDTO {
  /** Unique sortable order index */
  order: number;

  /** Display name shown in the flow diagram */
  stageName: string;

  /** Internal stage code used by the backend (e.g. "RECEIVED", "TREATED") */
  stageCode: string;

  /** Number of records currently at / having passed through this stage */
  quantity: number;

  /** Average time records spend at this stage, in hours */
  averageTimeHours: number;
}

// ---------------------------------------------------------------------------
// Section 3 – Performance Table
// ---------------------------------------------------------------------------

/**
 * A single row in the detailed performance breakdown table.
 * Returned by: GET /api/aceite-fast/performance-table?period=last7days
 */
export interface PerformanceTableRowDTO {
  /** Stage display name */
  stage: string;

  /** Total count of records processed at this stage */
  quantity: number;

  /** Average time in hours at this stage */
  averageTimeHours: number;

  /** Percentage of total volume this stage represents (0–100) */
  percentageOfTotal: number;

  /** Optional: previous period count to allow delta comparison */
  previousQuantity?: number;
}

// ---------------------------------------------------------------------------
// Section 4 – SLA Alerts
// ---------------------------------------------------------------------------

/**
 * A single CNPJ that has breached or is close to breaching its SLA.
 * Returned by: GET /api/aceite-fast/sla-alerts
 */
export interface SlaAlertDTO {
  /** CNPJ document number (formatted: XX.XXX.XXX/XXXX-XX) */
  document: string;

  /** Company / customer name */
  companyName: string;

  /** Stage where the record is currently awaiting action */
  currentStage: string;

  /** How many hours the record has been waiting at the current stage */
  hoursWaiting: number;

  /** Maximum allowed hours for this stage before SLA breach */
  slaLimit: number;

  /** Severity derived from hoursWaiting / slaLimit ratio */
  severity: 'warning' | 'critical';
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

/**
 * Generic wrapper used by the backend for all endpoints.
 * Enables uniform error handling and metadata extraction.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: ISODateString;
}

// ---------------------------------------------------------------------------
// Aggregated report payload (convenience type for the hook)
// ---------------------------------------------------------------------------

export interface AceiteFastReportData {
  summary: ExecutiveSummaryDTO;
  processFlow: ProcessFlowStageDTO[];
  performanceTable: PerformanceTableRowDTO[];
  slaAlerts: SlaAlertDTO[];
}
