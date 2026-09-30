"use client";

import { useState } from "react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/classes";
import StatusBadge from "@/components/ui/StatusBadge";

type ImportKind = "ledger" | "holdings";
type PreviewRow = { line: number; ok: boolean; errors: string[]; values: Record<string, string> };

const samples: Record<ImportKind, string> = {
  ledger: "clientCode,date,type,amount,narration\nTC24018,2026-09-30,credit,25000,Equalisation credit",
  holdings: "clientCode,identifier,quantity,averageCost,marketValue\nTC24018,TGF-I-A,4500,1000,5130000",
};

export default function ImportPipeline() {
  const [type, setType] = useState<ImportKind>("ledger");
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [counts, setCounts] = useState({ valid: 0, failed: 0 });
  const [report, setReport] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function readFile(file: File) {
    setFileName(file.name);
    setCsv(await file.text());
    setRows(null);
    setReport("");
  }

  async function preview() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "preview", type, csv, fileName }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      rows?: PreviewRow[];
      valid?: number;
      failed?: number;
      message?: string;
    };
    setPending(false);
    if (!response.ok || !data.rows) {
      setMessage(data.message ?? "The file could not be checked.");
      return;
    }
    setRows(data.rows);
    setCounts({ valid: data.valid ?? 0, failed: data.failed ?? 0 });
  }

  async function commit() {
    setPending(true);
    const response = await fetch("/api/admin/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "commit", type, csv, fileName }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      job?: { valid: number; failed: number };
      errorReport?: string;
      message?: string;
    };
    setPending(false);
    if (!response.ok || !data.job) {
      setMessage(data.message ?? "The import could not be committed.");
      return;
    }
    setReport(data.errorReport ?? "");
    setMessage(`Committed ${data.job.valid} rows. ${data.job.failed} rows were logged as errors.`);
  }

  return (
    <div className="w-full space-y-4">
      <section className="rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4">
        <h2 className="text-sm font-medium text-primary">1. Upload and type</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className={labelClass}>Import type</span>
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as ImportKind);
                setRows(null);
              }}
              className={inputClass}
            >
              <option value="ledger">Ledger</option>
              <option value="holdings">Holdings</option>
            </select>
          </label>
          <label className="text-sm">
            <span className={labelClass}>CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className={inputClass}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void readFile(file);
              }}
            />
          </label>
        </div>
        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={5}
          placeholder={samples[type]}
          className={`${inputClass} mt-4 font-mono text-xs`}
        />
        <button type="button" onClick={() => void preview()} className={`${primaryButtonClass} mt-4`} disabled={pending || !csv.trim()}>
          Check file
        </button>
      </section>

      {rows ? (
        <section className="rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4">
          <h2 className="text-sm font-medium text-primary">2. Preview and mapping</h2>
          <p className="mt-2 text-sm text-muted">{counts.valid} rows ready · {counts.failed} rows failed</p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--pm-card-blue-color)]">
                <tr>
                  <th className="px-2 py-2">Line</th>
                  <th className="px-2 py-2">Result</th>
                  <th className="px-2 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.line} className="border-t border-border">
                    <td className="px-2 py-2">{row.line}</td>
                    <td className="px-2 py-2">
                      <StatusBadge tone={row.ok ? "success" : "danger"}>{row.ok ? "Valid" : "Failed"}</StatusBadge>
                    </td>
                    <td className="px-2 py-2">{row.ok ? Object.values(row.values).join(" · ") : row.errors.join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => void commit()} className={`${primaryButtonClass} mt-4`} disabled={pending || counts.valid === 0}>
            Commit valid rows
          </button>
        </section>
      ) : null}

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {report.trim().split("\n").length > 1 ? (
        <section className="rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4">
          <h2 className="text-sm font-medium text-primary">3. Error log</h2>
          <a
            className={`${secondaryButtonClass} mt-3`}
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(report)}`}
            download="import-errors.csv"
          >
            Download error report
          </a>
        </section>
      ) : null}
    </div>
  );
}
