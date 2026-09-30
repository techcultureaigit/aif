"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SessionSecurity from "@/components/session/SessionSecurity";
import { primaryButtonClass } from "@/components/ui/classes";
import { useApp } from "@/context/AppProvider";

const pages: Record<string, { title: string; tone: string }> = {
  "/dashboard": { title: "Dashboard", tone: "dashboard" },
  "/profile": { title: "Profile", tone: "profile" },
  "/ledger": { title: "Ledger", tone: "ledger" },
  "/holdings": { title: "Holdings", tone: "holdings" },
  "/statements": { title: "Statements", tone: "statements" },
};

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, ready, sessionExpired, acknowledgeSessionExpiry } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user && !sessionExpired) {
      router.replace("/login");
    }
  }, [ready, user, sessionExpired, router]);

  if (sessionExpired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-ended-title"
          className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg"
        >
          <h2 id="session-ended-title" className="text-lg font-semibold">
            Session ended
          </h2>
          <p className="mt-2 text-sm text-muted">
            You were signed out after a period of inactivity.
          </p>
          <button
            type="button"
            className={`${primaryButtonClass} mt-6 w-full`}
            onClick={() => {
              acknowledgeSessionExpiry();
              router.replace("/login");
            }}
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  if (!ready || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
        Checking your session...
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SessionSecurity />
      <header
        className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4 shadow-[0_8px_24px_rgba(79,70,229,0.06)] md:px-6"
        style={{ background: "var(--pm-portal-header)", color: "var(--pm-portal-header-text)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: `var(--pm-nav-${pages[pathname]?.tone ?? "dashboard"}-bg)`,
              color: `var(--pm-nav-${pages[pathname]?.tone ?? "dashboard"}-color)`,
            }}
          >
            <PageGlyph tone={pages[pathname]?.tone ?? "dashboard"} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Client portal</p>
            <p className="truncate text-sm font-semibold">{pages[pathname]?.title ?? "Portal"}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[var(--pm-portal-page)] py-1.5 pl-1.5 pr-3">
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--pm-banner-from), var(--pm-banner-to))" }}
          >
            {initials(user.name)}
          </span>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.clientCode}</p>
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6" style={{ background: "var(--pm-portal-page)" }}>
        {children}
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PageGlyph({ tone }: { tone: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true,
  } as const;
  if (tone === "profile") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "ledger") {
    return (
      <svg {...common}>
        <path d="M8 7h11M8 12h11M8 17h11" strokeLinecap="round" />
        <path d="M4 7h.01M4 12h.01M4 17h.01" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "holdings") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    );
  }
  if (tone === "statements") {
    return (
      <svg {...common}>
        <path d="M8 3h6l5 5v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 19V5M4 19h16" strokeLinecap="round" />
      <path d="M7 15l4-4 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
