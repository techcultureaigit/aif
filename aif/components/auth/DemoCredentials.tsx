"use client";

import { useState } from "react";

type Account = {
  label: string;
  email: string;
  password: string;
};

export default function DemoCredentials({
  investors,
  staff,
}: {
  investors: Account[];
  staff: Account[];
}) {
  const [open, setOpen] = useState(false);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setOpen(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-end px-6 pt-6 sm:px-8 lg:px-10">
      <div className="pointer-events-auto relative">
        <button
          type="button"
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#12357a] shadow-[0_4px_16px_rgba(8,24,56,0.18)]"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          Demo investors
        </button>
        {open ? (
          <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-white/70 bg-white/95 p-3 text-sm text-[#12357a] shadow-lg">
            <CredentialList title="Investors" accounts={investors} onCopy={copy} />
            <CredentialList title="Staff" accounts={staff} onCopy={copy} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CredentialList({
  title,
  accounts,
  onCopy,
}: {
  title: string;
  accounts: Account[];
  onCopy: (value: string) => void;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#12357a]/70">{title}</p>
      <ul className="mt-2 space-y-3">
        {accounts.map((account) => (
          <li key={account.email}>
            <p className="font-medium">{account.label}</p>
            <CredentialRow value={account.email} onCopy={onCopy} />
            <CredentialRow value={account.password} onCopy={onCopy} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CredentialRow({
  value,
  onCopy,
}: {
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="mt-1 flex items-center justify-between gap-3">
      <span className="min-w-0 truncate">{value}</span>
      <button
        type="button"
        className="shrink-0 rounded-full bg-[#2456c8] px-3 py-1 text-xs font-semibold text-white"
        onClick={() => void onCopy(value)}
      >
        Copy
      </button>
    </div>
  );
}
