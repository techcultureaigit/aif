import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMetadata } from "@/config/projectmanager";

export const metadata: Metadata = pageMetadata("/login");

export default function LoginPage() {
  redirect("/?login=1");
}
