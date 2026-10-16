import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMetadata } from "@/config/projectmanager";

export const metadata: Metadata = pageMetadata("/forgot-password");

export default function ForgotPasswordPage() {
  redirect("/?forgot=1");
}
