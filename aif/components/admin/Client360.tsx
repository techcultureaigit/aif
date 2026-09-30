"use client";

import { FormEvent, useState } from "react";
import LoadError from "@/components/ui/LoadError";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { inputClass, labelClass, primaryButtonClass } from "@/components/ui/classes";
import { formatDate, formatInr, formatQuantity } from "@/lib/format";
import { usePortalResource } from "@/lib/use-portal-resource";
import type { PortalData } from "@/lib/types";

const tabs = [
  "Profile",
  "Bank",
  "Nominee",
  "KRA",
  "Documents",
  "Holdings",
  "Ledger",
  "Portfolio",
  "Reports",
  "Statements",
  "Audit",
] as const;

type RecordResponse = {
  portal: PortalData;
  incomplete: boolean;
  documents: Array<{ name: string; status: string }>;
  audit: Array<{ id: string; at: string; actor: string; action: string; detail: string }>;
};

export default function Client360({ code }: { code: string }) {
  const { data, status, reload } = usePortalResource<RecordResponse>(`/api/admin/clients/${code}`);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Profile");
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/clients/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...Object.fromEntries(form.entries()),
        kra: form.get("kra") === "on",
        fatca: form.get("fatca") === "on",
      }),
    });
    setMessage(response.ok ? "Client record updated." : "The update could not be saved.");
    if (response.ok) reload();
  }

  const profile = data?.portal.profile;

  return (
    <div className="w-full">
      <PageHeader
        title={profile ? `${profile.fullName} · ${profile.tradingCode}` : "Client 360"}
        description="Profile, bank, nominee, compliance, holdings, ledger, and audit history."
      />
      {status === "loading" ? <Skeleton className="h-80" /> : null}
      {status === "error" ? <LoadError onRetry={reload} /> : null}
      {status === "ready" && data && profile ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge tone={profile.status === "active" ? "success" : "neutral"}>{profile.status}</StatusBadge>
            <StatusBadge tone={profile.kra ? "success" : "warning"}>{profile.kra ? "KRA verified" : "KRA pending"}</StatusBadge>
            {data.incomplete ? <StatusBadge tone="danger">Incomplete profile</StatusBadge> : null}
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={
                  tab === item
                    ? "rounded-full bg-primary px-3 py-1.5 text-sm text-white"
                    : "rounded-full bg-white px-3 py-1.5 text-sm text-muted shadow-[0_4px_12px_rgba(20,50,90,0.05)]"
                }
              >
                {item}
              </button>
            ))}
          </div>
          {message ? <p className="mb-3 text-sm text-primary">{message}</p> : null}
          {tab === "Profile" ? (
            <form onSubmit={save} className="grid gap-4 rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4 sm:grid-cols-2">
              <Field name="fullName" label="Full name" defaultValue={profile.fullName} />
              <Field name="email" label="Email" defaultValue={profile.email} />
              <Field name="mobile" label="Mobile" defaultValue={profile.mobile} />
              <Field name="pan" label="PAN" defaultValue={profile.pan} />
              <Field name="dateOfBirth" label="Date of birth" defaultValue={profile.dateOfBirth} />
              <Field name="address" label="Address" defaultValue={profile.address} />
              <label className="text-sm">
                <span className={labelClass}>Status</span>
                <select name="status" defaultValue={profile.status} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <button type="submit" className={`${primaryButtonClass} sm:col-span-2 sm:w-fit`}>Save profile</button>
            </form>
          ) : null}
          {tab === "Bank" ? (
            <form onSubmit={save} className="grid gap-4 rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4 sm:grid-cols-2">
              <Field name="bankName" label="Bank" defaultValue={profile.bankName} />
              <Field name="accountNumber" label="Account number" defaultValue={profile.accountNumber} />
              <Field name="ifsc" label="IFSC" defaultValue={profile.ifsc} />
              <button type="submit" className={`${primaryButtonClass} sm:col-span-2 sm:w-fit`}>Save bank</button>
            </form>
          ) : null}
          {tab === "Nominee" ? (
            <form onSubmit={save} className="grid gap-4 rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4 sm:grid-cols-2">
              <Field name="nomineeName" label="Nominee" defaultValue={profile.nomineeName} />
              <Field name="nomineeRelationship" label="Relationship" defaultValue={profile.nomineeRelationship} />
              <button type="submit" className={`${primaryButtonClass} sm:col-span-2 sm:w-fit`}>Save nominee</button>
            </form>
          ) : null}
          {tab === "KRA" ? (
            <form onSubmit={save} className="rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] p-4">
              <label className="flex items-center gap-2 text-sm">
                <input name="kra" type="checkbox" defaultChecked={profile.kra} />
                KRA verified
              </label>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input name="fatca" type="checkbox" defaultChecked={profile.fatca} />
                FATCA complete
              </label>
              <button type="submit" className={`${primaryButtonClass} mt-4`}>Save compliance</button>
            </form>
          ) : null}
          {tab === "Documents" ? <SimpleList rows={data.documents.map((item) => `${item.name} — ${item.status}`)} /> : null}
          {tab === "Holdings" ? (
            <SimpleList rows={data.portal.holdings.map((row) => `${row.identifier} · ${row.name} · ${formatQuantity(row.quantity)} · ${formatInr(row.marketValue)}`)} />
          ) : null}
          {tab === "Ledger" ? (
            <SimpleList rows={data.portal.ledger.map((row) => `${formatDate(row.date)} · ${row.type} · ${formatInr(row.amount)} · ${row.narration}`)} />
          ) : null}
          {tab === "Portfolio" ? (
            <SimpleList
              rows={[
                `Total value ${formatInr(data.portal.metrics.totalPortfolioValue)}`,
                `Invested capital ${formatInr(data.portal.metrics.investedCapital)}`,
                `Current valuation ${formatInr(data.portal.metrics.currentValuation)}`,
                `Realized P&L ${formatInr(data.portal.metrics.realizedPnl)}`,
                `Unrealized P&L ${formatInr(data.portal.metrics.unrealizedPnl)}`,
              ]}
            />
          ) : null}
          {tab === "Reports" || tab === "Statements" ? (
            <SimpleList rows={data.portal.statements.map((row) => `${row.period} · ${row.fileName} · ${formatDate(row.issuedOn)}`)} />
          ) : null}
          {tab === "Audit" ? (
            <SimpleList rows={data.audit.map((row) => `${formatDate(row.at.slice(0, 10))} · ${row.actor} · ${row.action} · ${row.detail}`)} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="text-sm">
      <span className={labelClass}>{label}</span>
      <input name={name} defaultValue={defaultValue} className={inputClass} />
    </label>
  );
}

function SimpleList({ rows }: { rows: string[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Nothing recorded yet.</p>;
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)] text-sm">
      {rows.map((row) => (
        <li key={row} className="px-4 py-3">{row}</li>
      ))}
    </ul>
  );
}
