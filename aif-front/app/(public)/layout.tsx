import type { ReactNode } from "react";
import { LoginModalProvider } from "@/components/auth/LoginModal";
import PublicShell from "@/components/layout/PublicShell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <LoginModalProvider>
      <PublicShell>{children}</PublicShell>
    </LoginModalProvider>
  );
}
