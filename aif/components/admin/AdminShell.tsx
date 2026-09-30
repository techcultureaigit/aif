"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Logo, { type BrandDisplay } from "@/components/layout/Logo";
import type { AdminUser } from "@/lib/types";

const links = [
  { href: "/admin", label: "Dashboard", module: "" },
  { href: "/admin/clients", label: "Client master", module: "clients" },
  { href: "/admin/imports", label: "Imports", module: "imports" },
  { href: "/admin/reports", label: "Reports", module: "reports" },
  { href: "/admin/users", label: "Staff directory", module: "users" },
  { href: "/admin/roles", label: "Role matrix", module: "users" },
  { href: "/admin/audit", label: "Audit trail", module: "audit" },
  { href: "/admin/schedules", label: "Schedules", module: "schedules" },
  { href: "/admin/platform", label: "Platform controls", module: "platform" },
];

export default function AdminShell({
  children,
  brand,
}: {
  children: ReactNode;
  brand: { name: string; logo: string; display: BrandDisplay };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/session");
        const data = (await response.json()) as { user: AdminUser | null };
        if (!active) return;
        setUser(data.user);
        if (!data.user) {
          setReady(true);
          router.replace("/admin/login");
          return;
        }
        const access = await fetch("/api/admin/access");
        const rights = (await access.json()) as { modules?: Record<string, boolean> };
        if (!active) return;
        setModules(rights.modules ?? {});
        setReady(true);
      } catch {
        if (!active) return;
        setReady(true);
        router.replace("/admin/login");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!ready || !user) {
    return <div className="h-dvh bg-[var(--pm-portal-page)]" />;
  }

  const visible = links.filter((link) => !link.module || modules[link.module] !== false);
  const title = pageTitle(pathname, user.role);

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "var(--pm-portal-page)" }}>
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border text-[var(--pm-portal-sidebar-text)] transition-transform md:static md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, var(--pm-portal-sidebar) 0%, var(--pm-portal-sidebar-end) 100%)",
        }}
      >
        <div className="px-4 py-4">
          <Link href="/admin" onClick={() => setMenuOpen(false)} className="inline-flex">
            <Logo name={brand.name} logo={brand.logo} display={brand.display} />
          </Link>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--pm-portal-sidebar-muted)]">
            {user.role === "superadmin" ? "Super admin" : "Admin panel"}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visible.map((link) => {
            const label = link.href === "/admin" && user.role === "superadmin" ? "Command center" : link.label;
            const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  active
                    ? "rounded-xl px-3 py-2 text-sm font-semibold"
                    : "rounded-xl px-3 py-2 text-sm text-[var(--pm-portal-sidebar-text)] hover:bg-[var(--pm-portal-page)]"
                }
                style={
                  active
                    ? { background: "var(--pm-nav-dashboard-bg)", color: "var(--pm-nav-dashboard-color)" }
                    : undefined
                }
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <p className="px-3 pb-2 text-xs text-[var(--pm-portal-sidebar-muted)]">
            {user.name}
            <span className="mt-0.5 block font-medium capitalize text-[var(--pm-portal-sidebar-text)]">
              {user.role === "superadmin" ? "Super admin" : "Admin"}
            </span>
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--pm-portal-sidebar-text)] hover:bg-[var(--pm-portal-page)]"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4 shadow-[0_8px_24px_rgba(79,70,229,0.06)] md:px-6"
          style={{ background: "var(--pm-portal-header)", color: "var(--pm-portal-header-text)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--pm-portal-page)] md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span className="block h-0.5 w-4 bg-foreground" />
              <span className="block h-0.5 w-4 bg-foreground" />
              <span className="block h-0.5 w-4 bg-foreground" />
            </button>
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--pm-nav-dashboard-bg)] text-[var(--pm-nav-dashboard-color)] sm:inline-flex">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 19V5M4 19h16" strokeLinecap="round" />
                <path d="M7 15l4-4 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                {user.role === "superadmin" ? "Super admin" : "Admin panel"}
              </p>
              <p className="truncate text-sm font-semibold">{title}</p>
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
              <p className="truncate text-xs text-muted">{user.role === "superadmin" ? "Super admin" : "Admin"}</p>
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">{children}</main>
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

function pageTitle(pathname: string, role: string) {
  if (pathname === "/admin") return role === "superadmin" ? "Command center" : "Dashboard";
  if (pathname === "/admin/clients/new") return "New client";
  if (pathname.startsWith("/admin/clients/") && pathname !== "/admin/clients") return "Client record";
  const link = links.find((item) => item.href !== "/admin" && pathname.startsWith(item.href));
  return link?.label ?? "Admin";
}
