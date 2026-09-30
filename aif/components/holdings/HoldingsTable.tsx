"use client";

import EmptyState from "@/components/ui/EmptyState";
import LoadError from "@/components/ui/LoadError";
import PortalBanner from "@/components/ui/PortalBanner";
import PnlValue from "@/components/ui/PnlValue";
import Skeleton from "@/components/ui/Skeleton";
import { formatInr, formatQuantity } from "@/lib/format";
import { usePortalResource } from "@/lib/use-portal-resource";
import type { Holding } from "@/lib/types";

type HoldingsResponse = {
  clientCode: string;
  rows: Holding[];
};

export default function HoldingsTable() {
  const { data, status, reload } = usePortalResource<HoldingsResponse>(
    "/api/portal/holdings",
  );

  return (
    <div className="w-full">
      <PortalBanner
        eyebrow="Fund units"
        title="Holdings"
        description="Scheme units currently allotted to your trading code, with cost and market value."
      />

      {status === "loading" ? <Skeleton className="h-64" /> : null}
      {status === "error" ? <LoadError onRetry={reload} /> : null}

      {status === "ready" && data && data.rows.length === 0 ? (
        <EmptyState
          title="No holdings yet"
          body="When units are allotted to your account, they will be listed here."
        />
      ) : null}

      {status === "ready" && data && data.rows.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-[0_10px_24px_rgba(20,50,90,0.05)]">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">Fund holdings for {data.clientCode}</caption>
            <thead className="bg-[var(--pm-card-lilac-bg)] text-xs uppercase tracking-wide text-[var(--pm-card-lilac-color)]">
              <tr>
                <th scope="col" className="px-3 py-3 font-medium">Security identifier</th>
                <th scope="col" className="px-3 py-3 font-medium">Name</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Quantity</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Avg cost</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Market value</th>
                <th scope="col" className="px-3 py-3 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-3 font-medium">{row.identifier}</td>
                  <td className="min-w-56 px-3 py-3">{row.name}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                    {formatQuantity(row.quantity)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                    {formatInr(row.averageCost)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                    {formatInr(row.marketValue)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <PnlValue value={row.pnl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
