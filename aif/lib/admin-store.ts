import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  addGeneratedStatement,
  getPortal,
  importHoldingRows,
  importLedgerRows,
  isProfileIncomplete,
  knownSecurity,
  listPortals,
  listSecurities,
  saveSecurity,
  createClient,
  updateClientProfile,
} from "@/lib/portal-store";
import type { AdminRole, AdminUser, ClientStatus, PortalData } from "@/lib/types";

export type { AdminRole, AdminUser };

type StaffStatus = "active" | "suspended";

type StaffAccount = AdminUser & {
  salt: string;
  hash: Buffer;
  version: number;
  status: StaffStatus;
};

export type ImportKind = "ledger" | "holdings";

export type ImportJob = {
  id: string;
  type: ImportKind;
  fileName: string;
  status: "committed" | "failed";
  valid: number;
  failed: number;
  at: string;
  actor: string;
};

export type StatementRun = {
  id: string;
  clientCode: string;
  clientName: string;
  statementType: string;
  period: string;
  mode: "manual" | "scheduled";
  frequency: string;
  status: "generated" | "sent" | "scheduled";
  at: string;
  actor: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  userId: string;
  action: string;
  targetEntity: string;
  entityId: string;
  detail: string;
  clientCode: string;
};

export type ImportRow = {
  line: number;
  ok: boolean;
  errors: string[];
  values: Record<string, string>;
};

const staff = new Map<string, StaffAccount>();
const imports: ImportJob[] = [
  {
    id: "imp-seed-1",
    type: "ledger",
    fileName: "ledger-jun-2026.csv",
    status: "committed",
    valid: 4,
    failed: 1,
    at: "2026-06-30T10:15:00.000Z",
    actor: "Rohan Iyer",
  },
];
const runs: StatementRun[] = [
  {
    id: "run-seed-1",
    clientCode: "TC24018",
    clientName: "Subham",
    statementType: "Capital account",
    period: "Q1 FY 2026-27",
    mode: "scheduled",
    frequency: "monthly",
    status: "sent",
    at: "2026-07-15T09:00:00.000Z",
    actor: "System",
  },
];
const audit: AuditEntry[] = [
  {
    id: "aud-seed-1",
    at: "2026-06-30T10:15:00.000Z",
    actor: "Rohan Iyer",
    userId: "staff-ops",
    action: "Import committed",
    targetEntity: "import",
    entityId: "imp-seed-1",
    detail: "Ledger file ledger-jun-2026.csv",
    clientCode: "",
  },
];
const sessions: Array<{ staffId: string; name: string; role: AdminRole; at: string }> = [];
const modules = [
  "clients",
  "imports",
  "reports",
  "users",
  "audit",
  "schedules",
  "platform",
  "ledger",
] as const;
const roleAccess: Record<AdminRole, Record<(typeof modules)[number], boolean>> = {
  superadmin: {
    clients: true,
    imports: true,
    reports: true,
    users: true,
    audit: true,
    schedules: true,
    platform: true,
    ledger: true,
  },
  admin: {
    clients: true,
    imports: true,
    reports: true,
    users: false,
    audit: false,
    schedules: false,
    platform: false,
    ledger: false,
  },
};
const kraSettings = {
  endpoint: "https://kra.example/verify",
  token: "kra-demo-token",
  timeoutSeconds: 30,
};
const scheduleRules: Array<{
  id: string;
  frequency: "daily" | "weekly" | "monthly";
  target: string;
  retries: number;
  preventDuplicates: boolean;
}> = [
  {
    id: "sch-1",
    frequency: "monthly",
    target: "all-active",
    retries: 2,
    preventDuplicates: true,
  },
];

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 32);
}

function seedStaff(user: AdminUser, password: string) {
  const salt = randomBytes(16).toString("base64url");
  staff.set(user.id, {
    ...user,
    salt,
    hash: hashPassword(password, salt),
    version: 1,
    status: "active",
  });
}

seedStaff(
  {
    id: "staff-super",
    name: "Anika Shah",
    email: "admin@techculture.ai",
    role: "superadmin",
  },
  "123456",
);
seedStaff(
  {
    id: "staff-ops",
    name: "Rohan Iyer",
    email: "ops@techculture.ai",
    role: "admin",
  },
  "123456",
);

export const demoAdmins = [
  { email: "admin@techculture.ai", password: "123456", role: "Super admin" },
  { email: "ops@techculture.ai", password: "123456", role: "Admin" },
];

function passwordsMatch(password: string, salt: string, hash: Buffer) {
  const actual = hashPassword(password, salt);
  return actual.length === hash.length && timingSafeEqual(actual, hash);
}

export function authenticateStaff(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const account = [...staff.values()].find((item) => item.email === normalized);
  if (!account || !passwordsMatch(password, account.salt, account.hash)) return null;
  if (account.status === "suspended") return "suspended" as const;
  return account;
}

export function getStaff(id: string) {
  return staff.get(id) ?? null;
}

export function staffVersion(id: string) {
  return staff.get(id)?.version ?? null;
}

export function toAdminUser(id: string): AdminUser | null {
  const account = staff.get(id);
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  };
}

function stamp() {
  return new Date().toISOString();
}

export function recordAudit(entry: {
  actor: string;
  action: string;
  detail: string;
  clientCode?: string;
  userId?: string;
  targetEntity?: string;
  entityId?: string;
  at?: string;
}) {
  audit.unshift({
    id: `aud-${audit.length + 1}`,
    at: entry.at ?? stamp(),
    actor: entry.actor,
    userId: entry.userId ?? "",
    action: entry.action,
    targetEntity: entry.targetEntity ?? "system",
    entityId: entry.entityId ?? entry.clientCode ?? "",
    detail: entry.detail,
    clientCode: entry.clientCode ?? "",
  });
}

export function noteStaffLogin(account: StaffAccount) {
  sessions.unshift({
    staffId: account.id,
    name: account.name,
    role: account.role,
    at: stamp(),
  });
  sessions.splice(12);
  recordAudit({
    actor: account.name,
    userId: account.id,
    action: "Staff login",
    targetEntity: "staff",
    entityId: account.id,
    detail: account.email,
  });
}

export function adminOverview() {
  const portals = listPortals();
  const active = portals.filter((item) => item.profile.status === "active").length;
  const pendingKra = portals.filter((item) => item.profile.status === "active" && !item.profile.kra).length;
  const incomplete = portals.filter((item) => isProfileIncomplete(item.profile)).length;
  const aum = portals.reduce((sum, item) => sum + item.metrics.totalPortfolioValue, 0);
  return {
    active,
    inactive: portals.length - active,
    pendingKra,
    incomplete,
    aum,
    imports: imports.slice(0, 5),
    runs: runs.slice(0, 5),
  };
}

export function clientRows() {
  return listPortals().map((portal) => ({
    code: portal.profile.tradingCode,
    name: portal.profile.fullName,
    mobile: portal.profile.mobile,
    email: portal.profile.email,
    status: portal.profile.status,
    kra: portal.profile.kra,
    incomplete: isProfileIncomplete(portal.profile),
    aum: portal.metrics.totalPortfolioValue,
  }));
}

export function clientRecord(code: string) {
  const portal = getPortal(code);
  if (!portal) return null;
  return {
    portal,
    incomplete: isProfileIncomplete(portal.profile),
    documents: [
      {
        name: "PAN",
        status: portal.profile.pan ? "On file" : "Missing",
      },
      {
        name: "KRA",
        status: portal.profile.kra ? "Verified" : "Pending",
      },
      {
        name: "Bank proof",
        status: portal.profile.accountNumber ? "On file" : "Missing",
      },
      ...portal.statements.map((statement) => ({
        name: statement.fileName,
        status: "Issued",
      })),
    ],
    audit: audit.filter((entry) => entry.clientCode === code),
  };
}

export function saveClient(
  actor: string,
  input: {
    fullName: string;
    email: string;
    mobile: string;
    pan: string;
    dateOfBirth: string;
    address: string;
    nomineeName: string;
    nomineeRelationship: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    status: ClientStatus;
    kra: boolean;
  },
) {
  const created = createClient({ ...input, password: "123456" });
  if ("error" in created) return created;
  recordAudit({
    actor,
    action: "Client created",
    detail: created.portal.profile.fullName,
    clientCode: created.portal.profile.tradingCode,
  });
  return { code: created.portal.profile.tradingCode };
}

export function editClient(
  actor: string,
  code: string,
  patch: Partial<PortalData["profile"]>,
) {
  const clean = Object.fromEntries(
    Object.entries(patch).filter((entry) => entry[1] !== undefined),
  ) as Partial<PortalData["profile"]>;
  const portal = updateClientProfile(code, clean);
  if (!portal) return null;
  recordAudit({
    actor,
    action: "Client updated",
    detail: portal.profile.fullName,
    clientCode: code,
  });
  return portal;
}

function cell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value) return value;
  }
  return "";
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((item) => item.trim());
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

export function previewImport(type: ImportKind, csv: string): ImportRow[] {
  return parseCsv(csv).map((values, index) => {
    const errors: string[] = [];
    const code = cell(values, "clientcode", "client_code", "code");
    if (!getPortal(code)) errors.push("Unknown client code.");
    if (type === "ledger") {
      const entryType = cell(values, "type").toLowerCase();
      const amount = Number(cell(values, "amount"));
      if (entryType !== "debit" && entryType !== "credit") errors.push("Type must be debit or credit.");
      if (!Number.isFinite(amount) || amount <= 0) errors.push("Amount must be greater than zero.");
      if (!cell(values, "date")) errors.push("Date is required.");
      if (!cell(values, "narration")) errors.push("Narration is required.");
    } else {
      const identifier = cell(values, "identifier", "security").toUpperCase();
      if (!knownSecurity(identifier)) errors.push("Security is not in the fund list.");
      const quantity = Number(cell(values, "quantity"));
      const averageCost = Number(cell(values, "averagecost", "average_cost"));
      const marketValue = Number(cell(values, "marketvalue", "market_value"));
      if (!Number.isFinite(quantity) || quantity <= 0) errors.push("Quantity must be greater than zero.");
      if (!Number.isFinite(averageCost) || averageCost < 0) errors.push("Average cost is invalid.");
      if (!Number.isFinite(marketValue) || marketValue < 0) errors.push("Market value is invalid.");
    }
    return { line: index + 2, ok: errors.length === 0, errors, values };
  });
}

export function commitImport(actor: string, type: ImportKind, fileName: string, csv: string) {
  const rows = previewImport(type, csv);
  const valid = rows.filter((row) => row.ok);
  const grouped = new Map<string, ImportRow[]>();
  valid.forEach((row) => {
    const code = cell(row.values, "clientcode", "client_code", "code");
    const list = grouped.get(code) ?? [];
    list.push(row);
    grouped.set(code, list);
  });

  grouped.forEach((group, code) => {
    if (type === "ledger") {
      importLedgerRows(
        code,
        group.map((row) => ({
          date: cell(row.values, "date"),
          type: cell(row.values, "type").toLowerCase() as "debit" | "credit",
          amount: Number(cell(row.values, "amount")),
          narration: cell(row.values, "narration"),
        })),
      );
    } else {
      importHoldingRows(
        code,
        group.map((row) => {
          const identifier = cell(row.values, "identifier", "security").toUpperCase();
          return {
            identifier,
            name: knownSecurity(identifier) ?? identifier,
            quantity: Number(cell(row.values, "quantity")),
            averageCost: Number(cell(row.values, "averagecost", "average_cost")),
            marketValue: Number(cell(row.values, "marketvalue", "market_value")),
          };
        }),
      );
    }
  });

  const job: ImportJob = {
    id: `imp-${imports.length + 1}`,
    type,
    fileName: fileName || `${type}.csv`,
    status: valid.length > 0 ? "committed" : "failed",
    valid: valid.length,
    failed: rows.length - valid.length,
    at: stamp(),
    actor,
  };
  imports.unshift(job);
  recordAudit({
    actor,
    action: "Import committed",
    detail: `${job.fileName}: ${job.valid} valid, ${job.failed} failed`,
    clientCode: "",
  });

  const errorReport = ["line,error", ...rows.filter((row) => !row.ok).map((row) => `${row.line},"${row.errors.join("; ")}"`)].join("\n");
  return { job, rows, errorReport };
}

export function recentImports() {
  return imports;
}

export function statementRuns() {
  return runs;
}

export function queueStatement(input: {
  actor: string;
  clientCode: string;
  statementType: string;
  period: string;
  mode: "manual" | "scheduled";
  frequency: string;
}) {
  const portal = getPortal(input.clientCode);
  if (!portal) return null;
  const at = stamp();
  if (input.mode === "manual") {
    addGeneratedStatement(input.clientCode, {
      id: `stmt-${Date.now()}`,
      period: input.period,
      issuedOn: at.slice(0, 10),
      fileName: `${input.clientCode}-${input.statementType.replace(/\s+/g, "-")}.pdf`,
    });
  }
  const run: StatementRun = {
    id: `run-${runs.length + 1}`,
    clientCode: input.clientCode,
    clientName: portal.profile.fullName,
    statementType: input.statementType,
    period: input.period,
    mode: input.mode,
    frequency: input.mode === "scheduled" ? input.frequency : "",
    status: input.mode === "scheduled" ? "scheduled" : "generated",
    at,
    actor: input.actor,
  };
  runs.unshift(run);
  recordAudit({
    actor: input.actor,
    action: input.mode === "scheduled" ? "Statement scheduled" : "Statement generated",
    detail: `${input.statementType} ${input.period}`,
    clientCode: input.clientCode,
  });
  return run;
}

export function commandCenter() {
  const portals = listPortals();
  const failedImports = imports.reduce((sum, job) => sum + job.failed, 0);
  const sent = runs.filter((run) => run.status === "sent" || run.status === "generated").length;
  const scheduled = runs.filter((run) => run.status === "scheduled").length;
  return {
    aum: portals.reduce((sum, item) => sum + item.metrics.totalPortfolioValue, 0),
    sessions: sessions.slice(0, 6),
    imports: imports.slice(0, 6),
    failedImports,
    sent,
    scheduled,
    audit: audit.slice(0, 8),
  };
}

export function listStaff() {
  return [...staff.values()].map((account) => ({
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    status: account.status,
  }));
}

export function updateStaff(
  actor: AdminUser,
  id: string,
  patch: { name?: string; role?: AdminRole; status?: StaffStatus },
) {
  const account = staff.get(id);
  if (!account) return { error: "Staff account not found." as const };
  if (actor.id === id && patch.status === "suspended") {
    return { error: "You cannot suspend your own account." as const };
  }
  if (patch.name) account.name = patch.name.trim();
  if (patch.role) account.role = patch.role;
  if (patch.status) account.status = patch.status;
  recordAudit({
    actor: actor.name,
    userId: actor.id,
    action: patch.status === "suspended" ? "Staff suspended" : "Staff updated",
    targetEntity: "staff",
    entityId: account.id,
    detail: `${account.name} · ${account.role} · ${account.status}`,
  });
  return {
    user: { id: account.id, name: account.name, email: account.email, role: account.role, status: account.status },
  };
}

export function createStaff(actor: string, input: { name: string; email: string; role: AdminRole; password: string }) {
  const email = input.email.trim().toLowerCase();
  if ([...staff.values()].some((account) => account.email === email)) {
    return { error: "A staff account with this email already exists." as const };
  }
  const user: AdminUser = {
    id: `staff-${staff.size + 1}`,
    name: input.name.trim(),
    email,
    role: input.role,
  };
  seedStaff(user, input.password);
  recordAudit({
    actor,
    action: "Staff created",
    detail: `${user.name} (${user.role})`,
    clientCode: "",
  });
  return { user };
}

export function listAudit(filters?: { actor?: string; action?: string; entity?: string }) {
  const actor = filters?.actor?.trim().toLowerCase() ?? "";
  const action = filters?.action?.trim().toLowerCase() ?? "";
  const entity = filters?.entity?.trim().toLowerCase() ?? "";
  return audit.filter((entry) => {
    if (actor && !entry.actor.toLowerCase().includes(actor) && !entry.userId.toLowerCase().includes(actor)) return false;
    if (action && !entry.action.toLowerCase().includes(action)) return false;
    if (entity && !entry.targetEntity.toLowerCase().includes(entity) && !entry.entityId.toLowerCase().includes(entity)) return false;
    return true;
  });
}

export function roleCan(role: AdminRole, moduleName: string) {
  return roleAccess[role][moduleName as (typeof modules)[number]] === true;
}

export function accessFor(role: AdminRole) {
  return { role, modules: roleAccess[role] };
}

export function roleMatrix() {
  return { modules: [...modules], roles: roleAccess };
}

const lockedAdminModules = new Set(["users", "audit", "schedules", "platform", "ledger"]);

export function saveAdminPermissions(actor: AdminUser, next: Record<string, boolean>) {
  modules.forEach((moduleName) => {
    if (lockedAdminModules.has(moduleName)) {
      roleAccess.admin[moduleName] = false;
      return;
    }
    if (typeof next[moduleName] === "boolean") roleAccess.admin[moduleName] = next[moduleName];
  });
  recordAudit({
    actor: actor.name,
    userId: actor.id,
    action: "Role permissions updated",
    targetEntity: "role",
    entityId: "admin",
    detail: "Admin module access changed",
  });
  return roleMatrix();
}

export function platformState() {
  return { kra: kraSettings, securities: listSecurities(), schedules: scheduleRules };
}

export function saveKra(actor: AdminUser, input: { endpoint: string; token: string; timeoutSeconds: number }) {
  kraSettings.endpoint = input.endpoint.trim();
  kraSettings.token = input.token.trim();
  kraSettings.timeoutSeconds = input.timeoutSeconds;
  recordAudit({
    actor: actor.name,
    userId: actor.id,
    action: "KRA settings updated",
    targetEntity: "integration",
    entityId: "kra",
    detail: kraSettings.endpoint,
  });
  return kraSettings;
}

export function addSecurity(actor: AdminUser, input: { identifier: string; name: string; isin: string }) {
  const saved = saveSecurity(input);
  if (!saved) return null;
  recordAudit({
    actor: actor.name,
    userId: actor.id,
    action: "Security master updated",
    targetEntity: "security",
    entityId: saved.identifier,
    detail: `${saved.name} · ${saved.isin}`,
  });
  return saved;
}

export function saveSchedule(
  actor: AdminUser,
  input: { frequency: "daily" | "weekly" | "monthly"; target: string; retries: number; preventDuplicates: boolean },
) {
  const rule = { id: `sch-${scheduleRules.length + 1}`, ...input, target: input.target.trim() || "all-active" };
  scheduleRules.unshift(rule);
  recordAudit({
    actor: actor.name,
    userId: actor.id,
    action: "Statement schedule saved",
    targetEntity: "schedule",
    entityId: rule.id,
    detail: `${rule.frequency} · ${rule.target} · retries ${rule.retries}`,
  });
  return rule;
}

export function overrideLedger(
  actor: AdminUser,
  input: { clientCode: string; date: string; type: "debit" | "credit"; amount: number; narration: string; reason: string },
) {
  const ok = importLedgerRows(input.clientCode, [
    { date: input.date, type: input.type, amount: input.amount, narration: `Override: ${input.narration}` },
  ]);
  if (!ok) return null;
  recordAudit({
    actor: actor.name,
    userId: actor.id,
    action: "Ledger override",
    targetEntity: "ledger",
    entityId: input.clientCode,
    clientCode: input.clientCode,
    detail: `${input.reason} · ${input.type} ${input.amount}`,
  });
  return { ok: true };
}
