"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import LoginForm from "@/components/auth/LoginForm";

type AuthView = "login" | "forgot";

type LoginModalContextValue = {
  open: boolean;
  view: AuthView;
  openLogin: () => void;
  openForgot: () => void;
  closeLogin: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function useLoginModal() {
  const value = useContext(LoginModalContext);
  if (!value) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return value;
}

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>("login");

  const openLogin = useCallback(() => {
    setView("login");
    setOpen(true);
  }, []);

  const openForgot = useCallback(() => {
    setView("forgot");
    setOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setOpen(false);
    setView("login");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLogin();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeLogin]);

  return (
    <LoginModalContext.Provider value={{ open, view, openLogin, openForgot, closeLogin }}>
      {children}
      <Suspense fallback={null}>
        <AuthQuerySync open={open} onOpenLogin={openLogin} onOpenForgot={openForgot} />
      </Suspense>
      {open ? <AuthModalDialog view={view} onClose={closeLogin} onSignIn={openLogin} onForgot={openForgot} /> : null}
    </LoginModalContext.Provider>
  );
}

function AuthQuerySync({
  open,
  onOpenLogin,
  onOpenForgot,
}: {
  open: boolean;
  onOpenLogin: () => void;
  onOpenForgot: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasLoginQuery = searchParams.get("login") !== null;
  const hasForgotQuery = searchParams.get("forgot") !== null;

  useEffect(() => {
    if (hasForgotQuery) onOpenForgot();
    else if (hasLoginQuery) onOpenLogin();
  }, [hasForgotQuery, hasLoginQuery, onOpenForgot, onOpenLogin]);

  useEffect(() => {
    if (!open && (hasLoginQuery || hasForgotQuery)) {
      router.replace(pathname, { scroll: false });
    }
  }, [open, hasLoginQuery, hasForgotQuery, pathname, router]);

  return null;
}

function AuthModalDialog({
  view,
  onClose,
  onSignIn,
  onForgot,
}: {
  view: AuthView;
  onClose: () => void;
  onSignIn: () => void;
  onForgot: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const isForgot = view === "forgot";

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={isForgot ? "Close reset password" : "Close sign in"}
        className="absolute inset-0 bg-[#081830]/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md animate-login-card rounded-3xl border border-white bg-white p-5 text-foreground shadow-[0_22px_60px_rgba(15,40,80,0.28)] sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <h2 id={titleId} className="pr-8 text-2xl font-semibold tracking-tight">
          {isForgot ? "Reset password" : "Sign in"}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-slate-600">
          {isForgot
            ? "Confirm the mobile number or email on the account, then enter the verification code."
            : "Investors can use a mobile number or email. Staff can use their admin email."}
        </p>
        {isForgot ? (
          <ForgotPasswordForm embedded onSignIn={onSignIn} />
        ) : (
          <LoginForm onForgotPassword={onForgot} />
        )}
      </div>
    </div>
  );
}
