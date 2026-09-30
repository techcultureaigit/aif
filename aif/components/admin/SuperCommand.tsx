"use client";

import LoadError from "@/components/ui/LoadError";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, formatInr } from "@/lib/format";
import { usePortalResource } from "@/lib/use-portal-resource";

type Command = {
  aum: number;
  failedImports: number;
  sent: number;
  scheduled: number;
  sessions: Array<{ staffId: string; name: string; role: string; at: string }>;
  imports: Array<{ id: string; fileName: string; status: string; failed: number; valid: number }>;
  audit: Array<{ id: string; at: string; actor: string; action: string; detail: string }>;
};

export default function SuperCommand() {
  const { data, status, reload } = usePortalResource<Command>("/api/admin/command");

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Super admin"
        title="Command center"
        description="Platform value, staff sign-ins, import failures, and high-privilege actions."
      />
      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : null}
      {status === "error" ? <LoadError onRetry={reload} /> : null}
      {status === "ready" && data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl bg-[var(--pm-card-blue-bg)] p-4 text-[var(--pm-card-blue-color)] shadow-[0_10px_24px_rgba(20,50,90,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide">Platform AUM</p>
              <p className="mt-2 text-2xl font-semibold">{formatInr(data.aum)}</p>
            </article>
            <article className="rounded-2xl bg-[var(--pm-card-gold-bg)] p-4 text-[var(--pm-card-gold-color)] shadow-[0_10px_24px_rgba(20,50,90,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide">Failed import rows</p>
              <p className="mt-2 text-2xl font-semibold">{data.failedImports}</p>
            </article>
            <article className="rounded-2xl bg-[var(--pm-card-lilac-bg)] p-4 text-[var(--pm-card-lilac-color)] shadow-[0_10px_24px_rgba(20,50,90,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide">Statement dispatch</p>
              <p className="mt-2 text-2xl font-semibold">{data.sent} sent</p>
              <p className="text-sm opacity-80">{data.scheduled} scheduled</p>
            </article>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4">
              <h2 className="text-sm font-medium text-primary">Staff sign-ins</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.sessions.length === 0 ? <li className="text-muted">No staff sessions yet.</li> : null}
                {data.sessions.map((session) => (
                  <li key={`${session.staffId}-${session.at}`}>
                    <p className="font-medium">{session.name}</p>
                    <p className="text-muted">{session.role} · {formatDate(session.at.slice(0, 10))}</p>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4">
              <h2 className="text-sm font-medium text-primary">Import queue</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.imports.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-2">
                    <span>{job.fileName}</span>
                    <StatusBadge tone={job.failed > 0 ? "warning" : "success"}>{job.failed > 0 ? `${job.failed} failed` : job.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4">
              <h2 className="text-sm font-medium text-primary">Critical actions</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.audit.map((entry) => (
                  <li key={entry.id}>
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-muted">{entry.actor} · {entry.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
