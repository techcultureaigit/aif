"use client";

import type { ReactNode } from "react";
import LoadError from "@/components/ui/LoadError";
import PortalBanner from "@/components/ui/PortalBanner";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { usePortalResource } from "@/lib/use-portal-resource";
import { formatDob } from "@/lib/format";
import type { InvestorProfile } from "@/lib/types";

type ProfileResponse = {
  clientCode: string;
  profile: InvestorProfile;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

const sectionTones = {
  blue: "bg-[var(--pm-card-blue-bg)] text-[var(--pm-card-blue-color)]",
  gold: "bg-[var(--pm-card-gold-bg)] text-[var(--pm-card-gold-color)]",
  lilac: "bg-[var(--pm-card-lilac-bg)] text-[var(--pm-card-lilac-color)]",
  mint: "bg-[var(--pm-card-mint-bg)] text-[var(--pm-card-mint-color)]",
} as const;

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: keyof typeof sectionTones;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl p-4 shadow-[0_10px_24px_rgba(20,50,90,0.05)] ${sectionTones[tone]}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export default function ProfileCard() {
  const { data, status, reload } = usePortalResource<ProfileResponse>(
    "/api/portal/profile",
  );

  return (
    <div className="w-full">
      <PortalBanner
        eyebrow="Investor profile"
        title="Profile and compliance"
        description="Verified investor details, nominee, and regulatory status from the client master record."
      />

      {status === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : null}

      {status === "error" ? <LoadError onRetry={reload} /> : null}

      {status === "ready" && data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Basic details" tone="blue">
            <Field label="Trading code" value={data.profile.tradingCode} />
            <Field label="Full name" value={data.profile.fullName} />
            <Field label="Date of birth" value={formatDob(data.profile.dateOfBirth)} />
            <Field label="PAN" value={data.profile.pan} />
          </Section>
          <Section title="Contact" tone="gold">
            <Field label="Mobile number" value={data.profile.mobile} />
            <Field label="Email" value={data.profile.email} />
          </Section>
          <Section title="Family and income" tone="lilac">
            <Field label="Father's name" value={data.profile.fatherName} />
            <Field label="Mother's name" value={data.profile.motherName} />
            <Field label="Marital status" value={data.profile.maritalStatus} />
            <Field label="Annual income" value={data.profile.annualIncome} />
          </Section>
          <Section title="Address" tone="mint">
            <div className="sm:col-span-2">
              <Field label="Registered address and pincode" value={data.profile.address} />
            </div>
          </Section>
          <Section title="Nominee and compliance" tone="blue">
            <Field
              label="Nominee"
              value={`${data.profile.nomineeName} (${data.profile.nomineeRelationship})`}
            />
            <div>
              <dt className="text-xs text-muted">KRA status</dt>
              <dd className="mt-1">
                <StatusBadge tone={data.profile.kra ? "success" : "warning"}>
                  {data.profile.kra ? "Verified" : "Pending"}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">FATCA status</dt>
              <dd className="mt-1">
                <StatusBadge tone={data.profile.fatca ? "success" : "warning"}>
                  {data.profile.fatca ? "Yes" : "No"}
                </StatusBadge>
              </dd>
            </div>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
