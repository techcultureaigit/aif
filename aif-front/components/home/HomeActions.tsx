"use client";

import Link from "next/link";
import LoginTrigger from "@/components/auth/LoginTrigger";
import { useApp } from "@/context/AppProvider";

const actionClass =
  "inline-flex items-center gap-2 rounded-full bg-[#2456c8] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1d4bb3]";

export default function HomeActions() {
  const { user, ready } = useApp();

  if (!ready) return <div className="mt-4 h-10" />;

  const label = (
    <>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M5.5 19.2c1.4-2.6 3.7-3.9 6.5-3.9s5.1 1.3 6.5 3.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {user ? "Open portal" : "Sign in"}
      <span aria-hidden="true">→</span>
    </>
  );

  return (
    <div className="mt-4">
      {user ? (
        <Link href="/dashboard" className={actionClass}>
          {label}
        </Link>
      ) : (
        <LoginTrigger className={actionClass}>{label}</LoginTrigger>
      )}
    </div>
  );
}
