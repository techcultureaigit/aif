import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import DemoCredentials from "@/components/auth/DemoCredentials";
import LoginAside from "@/components/auth/LoginAside";
import LoginForm from "@/components/auth/LoginForm";
import { demoAdmins } from "@/lib/admin-store";
import { pageMetadata } from "@/config/projectmanager";
import { demoInvestors } from "@/lib/portal-store";

export const metadata: Metadata = pageMetadata("/login");

export default function LoginPage() {
  return (
    <>
      <DemoCredentials
        investors={demoInvestors.map((investor) => ({
          label: investor.email === "subham@techculture.ai" ? "Subham" : "Meera Kapoor",
          email: investor.email,
          password: investor.password,
        }))}
        staff={demoAdmins.map((person) => ({
          label: person.role,
          email: person.email,
          password: person.password,
        }))}
      />
      <AuthCard
        title="Sign in"
        description="Investors can use a mobile number or email. Staff can use their admin email."
        transparent
        aside={<LoginAside />}
      >
        <LoginForm />
      </AuthCard>
    </>
  );
}
