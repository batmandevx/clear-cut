"use client";

import { useCallback, useEffect, useState } from "react";
import { Hero } from "@/components/clearcut/Hero";
import { ArchitectureDiagram } from "@/components/clearcut/ArchitectureDiagram";
import { DataSourceCards } from "@/components/clearcut/DataSourceCards";
import { PipelineRunner } from "@/components/clearcut/PipelineRunner";
import { MetricsDashboard } from "@/components/clearcut/MetricsDashboard";
import { Charts } from "@/components/clearcut/Charts";
import { MatchedRecordsTable } from "@/components/clearcut/MatchedRecordsTable";
import { ExceptionList } from "@/components/clearcut/ExceptionList";
import { AuditTrail } from "@/components/clearcut/AuditTrail";
import { Footer } from "@/components/clearcut/Footer";
import type {
  DataPayload,
  ResultsPayload,
  ProgressEvent,
  PipelineMetricsVM,
  MatchedRecordVM,
  ExceptionRecordVM,
  AuditEntryVM,
} from "@/components/clearcut/types";
import { toast } from "sonner";

export default function Home() {
  const [data, setData] = useState<DataPayload | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progressLog, setProgressLog] = useState<ProgressEvent[]>([]);

  // Initial load: fetch data + latest results
  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  const loadResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const r = await fetch("/api/recon/results", { cache: "no-store" });
      if (r.ok) {
        const json = await r.json();
        setResults(json.run ? json : null);
      } else {
        setResults(null);
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadResults();
  }, [loadData, loadResults]);

  const runPipeline = useCallback(async () => {
    setIsRunning(true);
    setProgressLog([]);
    toast.info("Pipeline started", {
      description: "Running 4-stage reconciliation on the seeded dataset…",
    });
    try {
      const r = await fetch("/api/recon/run", { method: "POST", cache: "no-store" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? `HTTP ${r.status}`);
      }
      const json = await r.json();
      // json has { runId, report, progressLog }
      const report = json.report;
      setProgressLog(json.progressLog ?? []);
      const results: ResultsPayload = {
        run: {
          id: json.runId,
          startedAt: report.startedAt,
          finishedAt: report.finishedAt,
          status: "completed",
          durationMs: report.durationMs,
          totalRecords: report.metrics.totalRecords,
          matchedCount: report.metrics.matched,
          exceptionCount: report.metrics.exceptions,
          stage1: report.metrics.stage1,
          stage2: report.metrics.stage2,
          stage3: report.metrics.stage3,
          stage4: report.metrics.stage4,
        },
        matches: report.matchedRecords.map((m: MatchedRecordVM & { id?: string }) => ({
          ...m,
          id: m.id ?? `${m.orderId}-${m.stage}`,
        })),
        exceptions: report.exceptions.map((e: ExceptionRecordVM & { id?: string }) => ({
          ...e,
          id: e.id ?? e.recordRef,
        })),
        audit: report.auditTrail,
      };
      setResults(results);
      toast.success("Pipeline complete", {
        description: `${report.metrics.matched}/${report.metrics.totalRecords} matched · ${report.metrics.exceptions} honest exceptions · ${report.metrics.matchRatePct}% match rate`,
      });
      // Refresh data counts (lastRunId)
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Pipeline failed", {
        description: (err as Error).message,
      });
    } finally {
      setIsRunning(false);
    }
  }, [loadData]);

  const metrics: PipelineMetricsVM | null = results?.run
    ? {
        totalRecords: results.run.totalRecords,
        matched: results.run.matchedCount,
        exceptions: results.run.exceptionCount,
        stage1: results.run.stage1,
        stage2: results.run.stage2,
        stage3: results.run.stage3,
        stage4: results.run.stage4,
        matchRatePct:
          results.run.totalRecords > 0
            ? Math.round((results.run.matchedCount / results.run.totalRecords) * 1000) / 10
            : 0,
        durationMs: results.run.durationMs,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Hero onRun={runPipeline} isRunning={isRunning} />
        <ArchitectureDiagram />
        <DataSourceCards data={data} isLoading={dataLoading} />
        <PipelineRunner
          isRunning={isRunning}
          progressLog={progressLog}
          onRun={runPipeline}
          hasResults={!!results}
        />
        {metrics && <MetricsDashboard metrics={metrics} runId={results?.run.id ?? null} />}
        {metrics && <Charts metrics={metrics} />}
        {results && results.matches.length > 0 && (
          <MatchedRecordsTable matches={results.matches} />
        )}
        {results && results.exceptions.length > 0 && (
          <ExceptionList exceptions={results.exceptions} />
        )}
        {results && results.audit.length > 0 && <AuditTrail audit={results.audit} />}

        {/* Empty state */}
        {!results && !isRunning && !resultsLoading && (
          <section className="py-20">
            <div className="max-w-3xl mx-auto px-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to run</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Click <span className="text-emerald-300 font-medium">Run Reconciliation Pipeline</span> above
                to launch the 4-stage agentic pipeline on the seeded dataset of 61 orders,
                60 settlements, and 54 bank credits.
              </p>
              <button
                onClick={runPipeline}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                ▶ Run now
              </button>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
