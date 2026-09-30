import type { Metadata } from "next";
import ImportPipeline from "@/components/admin/ImportPipeline";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Imports" };

export default function ImportsPage() {
  return (
    <div className="w-full">
      <PageHeader
        title="CSV import"
        description="Upload a ledger or holdings file, review the rows, then commit the valid ones."
      />
      <ImportPipeline />
    </div>
  );
}
