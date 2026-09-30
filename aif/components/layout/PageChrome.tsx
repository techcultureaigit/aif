"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApp } from "@/context/AppProvider";

type PageFlags = {
  showTopNav: boolean;
  showSidebar: boolean;
  showFooter: boolean;
};

export default function PageChrome({
  pages,
  topNav,
  sidebar,
  footer,
  children,
}: {
  pages: Record<string, PageFlags>;
  topNav: ReactNode;
  sidebar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const page = pages[pathname];
  const showTopNav = page ? page.showTopNav : true;
  const showSidebar = page ? page.showSidebar : false;
  const showFooter = page ? page.showFooter : true;
  const { sidebarOpen, toggleSidebar } = useApp();

  const homeBackground = pathname === "/";
  const loginBackground = pathname === "/login";

  const frame = (
    <>
      {showTopNav ? topNav : null}
      <div className="flex min-h-0 flex-1">
        {showSidebar ? sidebar : null}
        <div className="flex min-w-0 flex-1 flex-col">
          {showSidebar ? (
            <div className="flex h-14 items-center border-b border-border bg-background px-4 md:hidden">
              <button
                type="button"
                className="inline-flex flex-col justify-center gap-1"
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
                onClick={toggleSidebar}
              >
                <span className="block h-0.5 w-5 bg-foreground" />
                <span className="block h-0.5 w-5 bg-foreground" />
                <span className="block h-0.5 w-5 bg-foreground" />
              </button>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </>
  );

  if (showSidebar && !homeBackground && !loginBackground) {
    return (
      <div className="flex h-dvh overflow-hidden">
        {sidebar}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4 md:hidden">
            <button
              type="button"
              className="inline-flex flex-col justify-center gap-1"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              onClick={toggleSidebar}
            >
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {homeBackground ? (
        <div className="relative flex min-h-[110vh] flex-1 flex-col overflow-hidden">
          <img
            src="/backt.png"
            alt=""
            className="pointer-events-none absolute inset-x-0 top-0 h-[112%] w-full object-cover object-top"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,28,64,0.38)_0%,rgba(8,28,64,0.16)_34%,transparent_62%)]" />
          <div className="relative flex min-h-0 flex-1 flex-col">{frame}</div>
        </div>
      ) : loginBackground ? (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <img
            src="/backp.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(52,106,165,0.28)_0%,rgba(198,218,244,0.08)_48%,rgba(253,209,162,0.16)_100%)]" />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{frame}</div>
        </div>
      ) : (
        frame
      )}
      {showFooter ? footer : null}
    </div>
  );
}
