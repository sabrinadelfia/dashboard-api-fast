/**
 * useAceiteFastReport.ts
 *
 * Custom hook that orchestrates all data-fetching calls for the
 * Aceite Fast Executive Report page.
 *
 * Responsibilities:
 *  - Owns the active DateFilterParams state.
 *  - Re-fetches all four calls in parallel whenever the filter changes.
 *  - Exposes loading, error, data, filter state, and setter to the consumer.
 *  - Provides a `refresh()` function to re-fetch on demand (same filter).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getExecutiveSummary,
  getPerformanceTable,
  getProcessFlowMetrics,
  getSlaAlerts,
} from '../services/aceiteFastService';
import { AceiteFastReportData, DateFilterParams } from '../types/aceiteFast.types';

// ---------------------------------------------------------------------------
// Default filter – last 7 days
// ---------------------------------------------------------------------------

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function defaultFilter(): DateFilterParams {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6); // today + 6 previous days = 7 days
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseAceiteFastReportResult {
  /** Consolidated report data; null while loading or on error */
  data: AceiteFastReportData | null;

  /** True during the initial or refreshed load */
  loading: boolean;

  /** Non-null if any service call failed */
  error: string | null;

  /** Currently active date filter */
  filter: DateFilterParams;

  /** Update the date filter — triggers an automatic re-fetch */
  setFilter: (f: DateFilterParams) => void;

  /** Trigger a manual re-fetch with the current filter */
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useAceiteFastReport(): UseAceiteFastReportResult {
  const [filter, setFilterState] = useState<DateFilterParams>(defaultFilter);
  const [data, setData] = useState<AceiteFastReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (activeFilter: DateFilterParams) => {
      setLoading(true);
      setError(null);

      try {
        // All four calls run in parallel to minimise total wait time.
        const [summary, processFlow, performanceTable, slaAlerts] =
          await Promise.all([
            getExecutiveSummary(activeFilter),
            getProcessFlowMetrics(activeFilter),
            getPerformanceTable(activeFilter),
            getSlaAlerts(activeFilter),
          ]);

        setData({ summary, processFlow, performanceTable, slaAlerts });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro desconhecido ao carregar o relatório.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch whenever the filter changes (including initial mount).
  useEffect(() => {
    fetchAll(filter);
  }, [filter, fetchAll]);

  const setFilter = useCallback((f: DateFilterParams) => {
    setFilterState(f);
  }, []);

  const refresh = useCallback(() => {
    fetchAll(filter);
  }, [filter, fetchAll]);

  return { data, loading, error, filter, setFilter, refresh };
}
