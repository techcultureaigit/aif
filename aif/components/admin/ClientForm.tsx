"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass } from "@/components/ui/classes";

const fields = [
  ["fullName", "Full name"],
  ["email", "Email"],
  ["mobile", "Mobile"],
  ["pan", "PAN"],
  ["dateOfBirth", "Date of birth"],
  ["address", "Address"],
  ["nomineeName", "Nominee"],
  ["nomineeRelationship", "Nominee relationship"],
  ["bankName", "Bank name"],
  ["accountNumber", "Account number"],
  ["ifsc", "IFSC"],
] as const;

export default function ClientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, kra: form.get("kra") === "on" }),
    });
    const data = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    setPending(false);
    if (!response.ok || !data.code) {
      setError(data.message ?? "The client could not be created.");
      return;
    }
    router.push(`/admin/clients/${data.code}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_10px_24px_rgba(20,50,90,0.05)] sm:grid-cols-2">
      {fields.map(([name, label]) => (
        <label key={name} className="text-sm">
          <span className={labelClass}>{label}</span>
          <input name={name} required={name === "fullName" || name === "email" || name === "mobile" || name === "pan"} className={inputClass} />
        </label>
      ))}
      <label className="text-sm">
        <span className={labelClass}>Status</span>
        <select name="status" className={inputClass} defaultValue="active">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm sm:mt-7">
        <input name="kra" type="checkbox" />
        KRA verified
      </label>
      {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {pending ? "Saving..." : "Create client"}
        </button>
        <p className="mt-2 text-xs text-muted">The investor can sign in with password 123456.</p>
      </div>
    </form>
  );
}
