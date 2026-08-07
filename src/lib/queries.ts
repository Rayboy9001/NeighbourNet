import { queryOptions } from "@tanstack/react-query";
import { fetchReports, fetchReport, type ReportCategory } from "@/lib/reports";

/** Shared cache keys + options so every screen reuses the same fetched data. */
export const reportsQuery = (filters: { category?: ReportCategory; limit?: number } = {}) =>
  queryOptions({
    queryKey: ["reports", filters.category ?? "all", filters.limit ?? null],
    queryFn: () => fetchReports(filters),
    staleTime: 60_000,
  });

export const reportQuery = (id: string) =>
  queryOptions({
    queryKey: ["report", id],
    queryFn: () => fetchReport(id),
    staleTime: 60_000,
  });
