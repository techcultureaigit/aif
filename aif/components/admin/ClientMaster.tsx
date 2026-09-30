"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import LoadError from "@/components/ui/LoadError";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatInr } from "@/lib/format";
import { usePortalResource } from "@/lib/use-portal-resource";
import type { ClientStatus } from "@/lib/types";

type ClientRow = {
  code: string;
  name: string;
  mobile: string;
  email: string;
  status: ClientStatus;
  kra: boolean;
  incomplete: boolean;
  aum: number;
};

export default function ClientMaster() {
  const { data, status, reload } = usePortalResource<{ clients: ClientRow[] }>("/api/admin/clients");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | ClientStatus>("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.clients ?? []).filter((client) => {
      const matchesStatus = filter === "all" || client.status === filter;
      const matchesQuery =
        !needle ||
        client.name.toLowerCase().includes(needle) ||
        client.code.toLowerCase().includes(needle) ||
        client.email.toLowerCase().includes(needle) ||
        client.mobile.includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [data, query, filter]);

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Clients"
        title="Client master"
        description="Search investors and open a 360 view of profile, holdings, ledger, and compliance."
        action={
          <Link
            href="/admin/clients/new"
            className="inline-flex shrink-0 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[var(--pm-primary)]"
          >
            Create client
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4 shadow-[0_10px_24px_rgba(20,50,90,0.05)]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search code, name, mobile, or email"
          className="w-full max-w-sm rounded-xl border border-border bg-white px-3 py-2 text-sm"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as "all" | ClientStatus)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {status === "loading" ? <Skeleton className="h-64" /> : null}
      {status === "error" ? <LoadError onRetry={reload} /> : null}
      {status === "ready" ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--pm-card-blue-bg)] text-xs uppercase tracking-wide text-[var(--pm-card-blue-color)]">
              <tr>
                <th className="px-3 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Mobile</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">AUM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((client) => (
                <tr key={client.code} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <Link href={`/admin/clients/${client.code}`} className="font-medium text-primary">
                      {client.code}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{client.name}</td>
                  <td className="px-3 py-3">{client.mobile}</td>
                  <td className="px-3 py-3">{client.email}</td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={client.status === "active" ? "success" : "neutral"}>{client.status}</StatusBadge>
                    {!client.kra ? <span className="ml-2"><StatusBadge tone="warning">KRA pending</StatusBadge></span> : null}
                  </td>
                  <td className="px-3 py-3 text-right">{formatInr(client.aum)}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">No clients match this search.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
