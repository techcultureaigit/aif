"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLoginModal } from "@/components/auth/LoginModal";

export default function LoginTrigger({
  children,
  className,
  href = "/?login=1",
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const { openLogin } = useLoginModal();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        openLogin();
      }}
    >
      {children}
    </Link>
  );
}
