import type { Metadata } from "next";
import ClientForm from "@/components/admin/ClientForm";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Create client" };

export default function NewClientPage() {
  return (
    <div className="w-full">
      <PageHeader
        title="Create client"
        description="Onboard an investor with personal, bank, nominee, and PAN details."
      />
      <ClientForm />
    </div>
  );
}
