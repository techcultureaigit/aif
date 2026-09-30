import { clientRows, saveClient } from "@/lib/admin-store";
import { authorizeAdmin } from "@/lib/admin-guard";
import { asRecord, jsonError, readJson } from "@/lib/http";
import type { ClientStatus } from "@/lib/types";

export async function GET() {
  const auth = await authorizeAdmin("admin", "clients");
  if (auth.response) return auth.response;
  return Response.json({ clients: clientRows() });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin("admin", "clients");
  if (auth.response) return auth.response;
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("Enter the client details.", 400);

  const text = (key: string) => (typeof body[key] === "string" ? body[key].trim() : "");
  const status: ClientStatus = body.status === "inactive" ? "inactive" : "active";
  const fullName = text("fullName");
  const email = text("email");
  const mobile = text("mobile");
  const pan = text("pan");
  if (!fullName || !email || !mobile || !pan) {
    return jsonError("Name, email, mobile, and PAN are required.", 400);
  }

  const result = saveClient(auth.user.name, {
    fullName,
    email,
    mobile,
    pan,
    dateOfBirth: text("dateOfBirth"),
    address: text("address"),
    nomineeName: text("nomineeName"),
    nomineeRelationship: text("nomineeRelationship"),
    bankName: text("bankName"),
    accountNumber: text("accountNumber"),
    ifsc: text("ifsc"),
    status,
    kra: body.kra === true,
  });
  if ("error" in result && result.error) return jsonError(result.error, 409);
  return Response.json(result);
}
