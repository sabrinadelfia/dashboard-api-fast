/**
 * AceiteFastReport.tsx
 *
 * Executive Operational Report – "Relatório Aceite Fast"
 *
 * This is the top-level page component. It:
 *  - Fetches all report data via the `useAceiteFastReport` hook.
 *  - Renders a structured, print-friendly corporate report.
 *  - Contains no hardcoded business data; everything flows from the service layer.
 *
 * To connect a live backend, update `aceiteFastService.ts`.
 * No changes to this component are required for that migration.
 */

import React, { useState } from 'react';
import { useAceiteFastReport } from '../hooks/useAceiteFastReport';
import {
  DateFilterParams,
  ExecutiveSummaryDTO,
  PerformanceTableRowDTO,
  ProcessFlowStageDTO,
  SlaAlertDTO,
} from '../types/aceiteFast.types';
import styles from './AceiteFastReport.module.css';

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Format a number with Brazilian thousand-separator. */
function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

/** Format a decimal number with fixed precision. */
function fmtDecimal(n: number, decimals = 1): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format an ISO date-time string to Brazilian locale. */
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Compute the delta label between current and previous period. */
function deltaLabel(
  current: number,
  previous: number | undefined
): React.ReactNode {
  if (previous === undefined) return null;
  const diff = current - previous;
  const className = diff >= 0 ? styles.deltaPositive : styles.deltaNegative;
  const sign = diff >= 0 ? '+' : '';
  return (
    <span className={className}>
      {' '}
      ({sign}
      {fmt(diff)} vs. período anterior)
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ── Date Filter Bar ─────────────────────────────────────────────────────────

/** Preset period options for quick selection */
const PRESETS: { label: string; days: number }[] = [
  { label: 'Hoje',         days: 0 },
  { label: 'Últimos 7 dias',  days: 6 },
  { label: 'Últimos 15 dias', days: 14 },
  { label: 'Últimos 30 dias', days: 29 },
];

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface DateFilterBarProps {
  filter: DateFilterParams;
  loading: boolean;
  onApply: (f: DateFilterParams) => void;
}

function DateFilterBar({ filter, loading, onApply }: DateFilterBarProps): JSX.Element {
  // Local draft — only committed when the user clicks "Aplicar"
  const [draft, setDraft] = useState<DateFilterParams>(filter);
  const [presetActive, setPresetActive] = useState<number | null>(6); // default: 7 days

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const next: DateFilterParams = { startDate: toISODate(start), endDate: toISODate(end) };
    setDraft(next);
    setPresetActive(days);
    onApply(next);
  }

  function handleApply() {
    if (!draft.startDate || !draft.endDate) return;
    if (draft.startDate > draft.endDate) return;
    setPresetActive(null);
    onApply(draft);
  }

  const isInvalid =
    !draft.startDate || !draft.endDate || draft.startDate > draft.endDate;

  return (
    <div className={styles.filterBar}>
      {/* Preset buttons */}
      <div className={styles.filterPresets}>
        {PRESETS.map((p) => (
          <button
            key={p.days}
            className={`${styles.presetButton} ${
              presetActive === p.days ? styles.presetButtonActive : ''
            }`}
            onClick={() => applyPreset(p.days)}
            disabled={loading}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range inputs */}
      <div className={styles.filterInputs}>
        <label className={styles.filterLabel}>
          De
          <input
            type="date"
            className={styles.filterInput}
            value={draft.startDate}
            max={draft.endDate || toISODate(new Date())}
            onChange={(e) => {
              setDraft((d) => ({ ...d, startDate: e.target.value }));
              setPresetActive(null);
            }}
            disabled={loading}
          />
        </label>

        <label className={styles.filterLabel}>
          Até
          <input
            type="date"
            className={styles.filterInput}
            value={draft.endDate}
            min={draft.startDate}
            max={toISODate(new Date())}
            onChange={(e) => {
              setDraft((d) => ({ ...d, endDate: e.target.value }));
              setPresetActive(null);
            }}
            disabled={loading}
          />
        </label>

        <button
          className={styles.filterApplyButton}
          onClick={handleApply}
          disabled={loading || isInvalid}
        >
          {loading ? 'Carregando…' : 'Aplicar'}
        </button>
      </div>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

interface ReportHeaderProps {
  summary: ExecutiveSummaryDTO;
}

function ReportHeader({ summary }: ReportHeaderProps): JSX.Element {
  return (
    <header className={styles.reportHeader}>
      <div className={styles.headerTop}>
        <span className={styles.companyName}>
          {/* Replace with actual company name or pass as prop */}
          Organização · Área de Operações Comerciais
        </span>
        <div className={styles.reportMeta}>
          <div>Período de referência: {summary.periodLabel}</div>
          <div>Gerado em: {fmtDateTime(summary.generatedAt)}</div>
          <div>Fonte: API Aceite Fast / SQL Server</div>
        </div>
      </div>

      <h1 className={styles.reportTitle}>Relatório Aceite Fast</h1>
      <p className={styles.reportSubtitle}>
        Resumo operacional do processo – visão executiva
      </p>

      <hr className={styles.headerDivider} />
    </header>
  );
}

// ── Executive Summary ────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  note?: string;
  isCompliance?: boolean;
}

function SummaryCard({
  label,
  value,
  note,
  isCompliance,
}: SummaryCardProps): JSX.Element {
  return (
    <div
      className={`${styles.summaryCard} ${isCompliance ? styles.summaryCardCompliance : ''}`}
    >
      <div className={styles.summaryCardLabel}>{label}</div>
      <div className={styles.summaryCardValue}>{value}</div>
      {note && <div className={styles.summaryCardNote}>{note}</div>}
    </div>
  );
}

interface ExecutiveSummarySectionProps {
  summary: ExecutiveSummaryDTO;
}

function ExecutiveSummarySection({
  summary,
}: ExecutiveSummarySectionProps): JSX.Element {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>1. Resumo Executivo</h2>
      <p className={styles.sectionSubtitle}>
        Indicadores-chave do período — {summary.periodLabel}
      </p>

      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Total CNPJs recebidos do Simplifique"
          value={fmt(summary.totalReceived)}
          note="Entradas no pipeline Aceite Fast"
        />
        <SummaryCard
          label="Total enviados para o SFA"
          value={fmt(summary.totalSentToSFA)}
          note="Encaminhados com sucesso"
        />
        <SummaryCard
          label="Em fila / não tratados"
          value={fmt(summary.totalInQueue)}
          note="Aguardando processamento"
        />
        <SummaryCard
          label="Clientes novos (não existentes no Salesforce)"
          value={fmt(summary.newCustomers)}
          note="CNPJs identificados como novos"
        />
        <SummaryCard
          label="SLA médio (em horas)"
          value={`${fmtDecimal(summary.averageSlaHours)}h`}
          note="Tempo médio de processamento"
        />
        <SummaryCard
          label="Taxa de conformidade SLA"
          value={`${fmtDecimal(summary.slaComplianceRate)}%`}
          note="Registros processados dentro do prazo"
          isCompliance
        />
      </div>
    </section>
  );
}

// ── Process Flow ─────────────────────────────────────────────────────────────

interface ProcessFlowSectionProps {
  stages: ProcessFlowStageDTO[];
}

function ProcessFlowSection({ stages }: ProcessFlowSectionProps): JSX.Element {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>2. Fluxo do Processo</h2>
      <p className={styles.sectionSubtitle}>
        Etapas do pipeline Aceite Fast — volume e tempo médio por estágio
      </p>

      <div className={styles.processFlow}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.stageCode}>
            {/* Arrow between stages */}
            {index > 0 && (
              <div className={styles.flowArrow} aria-hidden="true">
                ›
              </div>
            )}

            <div className={styles.flowStage}>
              <div className={styles.flowStageNumber}>
                Etapa {stage.order}
              </div>
              <div className={styles.flowStageName}>{stage.stageName}</div>
              <div className={styles.flowStageStat}>{fmt(stage.quantity)}</div>
              <div className={styles.flowStageTime}>
                Tempo médio: {fmtDecimal(stage.averageTimeHours)}h
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

// ── Performance Table ─────────────────────────────────────────────────────────

interface PerformanceTableSectionProps {
  rows: PerformanceTableRowDTO[];
}

function PerformanceTableSection({
  rows,
}: PerformanceTableSectionProps): JSX.Element {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>3. Desempenho por Etapa</h2>
      <p className={styles.sectionSubtitle}>
        Distribuição de volume e tempo de processamento por estágio do processo
      </p>

      <table className={styles.performanceTable}>
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Quantidade</th>
            <th>Tempo Médio (h)</th>
            <th>% do Total</th>
            <th className={styles.tableBarCell}>Volume Relativo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stage}>
              <td>{row.stage}</td>
              <td>
                {fmt(row.quantity)}
                {deltaLabel(row.quantity, row.previousQuantity)}
              </td>
              <td>{fmtDecimal(row.averageTimeHours)}h</td>
              <td>{fmtDecimal(row.percentageOfTotal)}%</td>
              <td className={styles.tableBarCell}>
                <div className={styles.tableBar}>
                  <div
                    className={styles.tableBarFill}
                    style={{ width: `${Math.min(row.percentageOfTotal, 100)}%` }}
                    role="presentation"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── SLA Alerts ───────────────────────────────────────────────────────────────

interface SlaAlertsSectionProps {
  alerts: SlaAlertDTO[];
}

function SlaAlertsSection({ alerts }: SlaAlertsSectionProps): JSX.Element {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>4. Monitoramento de SLA</h2>
      <p className={styles.alertsIntro}>
        Registros que excedem ou estão próximos do limite de SLA acordado.
        {criticalCount > 0 && (
          <strong> {criticalCount} crítico(s)</strong>
        )}
        {criticalCount > 0 && warningCount > 0 && ' e '}
        {warningCount > 0 && (
          <strong> {warningCount} em atenção</strong>
        )}{' '}
        identificado(s) no período.
      </p>

      <table className={styles.alertsTable}>
        <thead>
          <tr>
            <th>CNPJ</th>
            <th>Empresa</th>
            <th>Etapa Atual</th>
            <th>Aguardando (h)</th>
            <th>Limite SLA (h)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            return (
              <tr key={`${alert.document}-${alert.currentStage}`}>
                <td>
                  <code>{alert.document}</code>
                </td>
                <td>{alert.companyName}</td>
                <td>{alert.currentStage}</td>
                <td
                  className={isCritical ? styles.slaExceeded : undefined}
                >
                  {fmtDecimal(alert.hoursWaiting)}h
                </td>
                <td>{fmtDecimal(alert.slaLimit)}h</td>
                <td>
                  <span
                    className={`${styles.severityBadge} ${
                      isCritical
                        ? styles.severityCritical
                        : styles.severityWarning
                    }`}
                  >
                    {isCritical ? 'Crítico' : 'Atenção'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

/** Report build identifier — in production replace with CI build hash or version constant. */
const REPORT_VERSION = 'v1.0.0';

function ReportFooter(): JSX.Element {
  return (
    <footer className={styles.reportFooter}>
      <div className={styles.footerGrid}>
        <div className={styles.footerDisclaimer}>
          As informações contidas neste relatório são de uso interno e
          confidencial. Os dados refletem o estado do sistema no momento da
          geração do relatório e podem não representar a situação em tempo real.
          Para esclarecimentos, contacte a equipe de Operações Comerciais.
        </div>
        <div className={styles.footerMeta}>
          <div>Fonte de dados: API Aceite Fast / SQL Server</div>
          <div>Sistema: Plataforma de Onboarding Comercial</div>
          <div>Versão do relatório: {REPORT_VERSION}</div>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

/**
 * AceiteFastReport
 *
 * Top-level page component for the Aceite Fast Executive Report.
 *
 * Usage:
 *   <AceiteFastReport />
 *
 * Data source: configured via `aceiteFastService.ts`.
 * To switch from mocked to real data, update that file only.
 */
export function AceiteFastReport(): JSX.Element {
  const { data, loading, error, filter, setFilter, refresh } =
    useAceiteFastReport();

  // ── Loading overlay (first load — show skeleton page) ─────────────────────
  const showFullLoader = loading && !data;

  if (showFullLoader) {
    return (
      <div className={styles.reportPage}>
        <div className={styles.stateContainer}>
          <p className={styles.stateMessage}>
            Carregando relatório, por favor aguarde…
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className={styles.reportPage}>
        <div className={styles.stateContainer}>
          <p className={styles.errorMessage}>
            Erro ao carregar o relatório:{' '}
            {error ?? 'Dados indisponíveis.'}
          </p>
          <button className={styles.retryButton} onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  const { summary, processFlow, performanceTable, slaAlerts } = data!;

  return (
    <div className={styles.reportPage}>
      {/*
        Filter + print actions bar — hidden when printing.
      */}
      <div className={styles.controlBar}>
        {/* Date filter */}
        <DateFilterBar
          filter={filter}
          loading={loading}
          onApply={setFilter}
        />

        {/* Print / refresh actions */}
        <div className={styles.printBar}>
          <button
            className={styles.printButton}
            onClick={() => window.print()}
          >
            Imprimir / Exportar PDF
          </button>
          <button
            className={styles.printButton}
            onClick={refresh}
            disabled={loading}
          >
            {loading ? 'Atualizando…' : 'Atualizar dados'}
          </button>
        </div>
      </div>

      {/* Loading overlay while already showing data */}
      {loading && (
        <div className={styles.refreshingBanner}>
          Atualizando dados…
        </div>
      )}

      {/* ── 1. Header ───────────────────────────────────────────── */}
      <ReportHeader summary={summary} />

      {/* ── 2. Executive Summary ────────────────────────────────── */}
      <ExecutiveSummarySection summary={summary} />

      {/* ── 3. Process Flow ─────────────────────────────────────── */}
      <ProcessFlowSection stages={processFlow} />

      {/* ── 4. Performance Table ────────────────────────────────── */}
      <PerformanceTableSection rows={performanceTable} />

      {/* ── 5. SLA Alerts ───────────────────────────────────────── */}
      <SlaAlertsSection alerts={slaAlerts} />

      {/* ── 6. Footer ───────────────────────────────────────────── */}
      <ReportFooter />
    </div>
  );
}

export default AceiteFastReport;
