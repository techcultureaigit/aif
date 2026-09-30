import { clientRecord, editClient } from "@/lib/admin-store";
import { authorizeAdmin } from "@/lib/admin-guard";
import { asRecord, jsonError, readJson } from "@/lib/http";
import type { ClientStatus } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const auth = await authorizeAdmin("admin", "clients");
  if (auth.response) return auth.response;
  const { code } = await params;
  const record = clientRecord(code);
  if (!record) return jsonError("Client not found.", 404);
  return Response.json(record);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const auth = await authorizeAdmin("admin", "clients");
  if (auth.response) return auth.response;
  const { code } = await params;
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("Enter the client details.", 400);

  const text = (key: string) => (typeof body[key] === "string" ? body[key].trim() : undefined);
  const status: ClientStatus | undefined =
    body.status === "active" || body.status === "inactive" ? body.status : undefined;
  const portal = editClient(auth.user.name, code, {
    fullName: text("fullName"),
    email: text("email"),
    mobile: text("mobile"),
    pan: text("pan")?.toUpperCase(),
    dateOfBirth: text("dateOfBirth"),
    address: text("address"),
    nomineeName: text("nomineeName"),
    nomineeRelationship: text("nomineeRelationship"),
    bankName: text("bankName"),
    accountNumber: text("accountNumber"),
    ifsc: text("ifsc")?.toUpperCase(),
    status,
    kra: typeof body.kra === "boolean" ? body.kra : undefined,
    fatca: typeof body.fatca === "boolean" ? body.fatca : undefined,
  });
  if (!portal) return jsonError("Client not found.", 404);
  return Response.json({ portal });
}
