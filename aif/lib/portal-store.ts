import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { identifierMatches } from "@/lib/identifier";
import type {
  Holding,
  LedgerRow,
  LedgerType,
  PortalData,
} from "@/lib/types";

export const demoInvestors = [
  {
    email: "subham@techculture.ai",
    mobile: "9810001122",
    password: "123456",
  },
  {
    email: "meera.demo@techculture.ai",
    mobile: "9898981122",
    password: "123456",
  },
];

export const demoInvestor = demoInvestors[0];

type Account = {
  salt: string;
  hash: Buffer;
  version: number;
  portal: PortalData;
};

const accounts = new Map<string, Account>();

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 32);
}

function passwordsMatch(password: string, salt: string, hash: Buffer) {
  const actual = hashPassword(password, salt);
  return actual.length === hash.length && timingSafeEqual(actual, hash);
}

function ledgerRows(
  entries: Array<{
    date: string;
    type: LedgerType;
    amount: number;
    narration: string;
  }>,
): LedgerRow[] {
  let balance = 0;
  return entries.map((entry, index) => {
    balance += entry.type === "credit" ? entry.amount : -entry.amount;
    return {
      id: `txn-${index + 1}`,
      date: entry.date,
      type: entry.type,
      amount: entry.amount,
      balance,
      narration: entry.narration,
    };
  });
}

function withPnl(
  rows: Array<Omit<Holding, "pnl">>,
): Holding[] {
  return rows.map((row) => ({
    ...row,
    pnl: row.marketValue - row.quantity * row.averageCost,
  }));
}

type PortalSeed = {
  password: string;
  profile: PortalData["profile"];
  ledger: Array<{
    date: string;
    type: LedgerType;
    amount: number;
    narration: string;
  }>;
  holdings: Array<Omit<Holding, "pnl">>;
  realizedPnl: number;
  statements: PortalData["statements"];
};

function buildPortal(seed: PortalSeed): PortalData {
  const ledger = ledgerRows(seed.ledger);
  const holdings = withPnl(seed.holdings);
  const investedCapital = ledger
    .filter(
      (row) =>
        row.type === "credit" &&
        row.narration.startsWith("Capital contribution"),
    )
    .reduce((sum, row) => sum + row.amount, 0);
  const currentValuation = holdings.reduce(
    (sum, row) => sum + row.marketValue,
    0,
  );
  const unrealizedPnl = holdings.reduce((sum, row) => sum + row.pnl, 0);

  return {
    profile: seed.profile,
    metrics: {
      totalPortfolioValue: currentValuation + seed.realizedPnl,
      investedCapital,
      currentValuation,
      realizedPnl: seed.realizedPnl,
      unrealizedPnl,
    },
    ledger,
    holdings,
    statements: seed.statements,
  };
}

const portalSeeds: PortalSeed[] = [
  {
    password: demoInvestors[0].password,
    profile: {
      tradingCode: "TC24018",
      fullName: "Subham",
      dateOfBirth: "1996-03-21",
      pan: "SBHPM4521K",
      mobile: demoInvestors[0].mobile,
      email: demoInvestors[0].email,
      fatherName: "Ramesh Kumar",
      motherName: "Sunita",
      maritalStatus: "Single",
      annualIncome: "10 to 25 Lakh",
      address: "B-14, Techculture House, Sector 62, Noida, UP, 201309",
      nomineeName: "Neha",
      nomineeRelationship: "Sister",
      kra: true,
      fatca: true,
      status: "active",
      bankName: "HDFC Bank",
      accountNumber: "50100123456789",
      ifsc: "HDFC0000621",
    },
    ledger: [
      {
        date: "2025-05-12",
        type: "credit",
        amount: 4000000,
        narration: "Capital contribution - Drawdown 1, Class A",
      },
      {
        date: "2025-06-30",
        type: "debit",
        amount: 50000,
        narration: "Management fee - quarter ended 30 Jun 2025",
      },
      {
        date: "2025-08-18",
        type: "credit",
        amount: 2000000,
        narration: "Capital contribution - Drawdown 2, Class A",
      },
      {
        date: "2025-09-30",
        type: "debit",
        amount: 75000,
        narration: "Management fee - quarter ended 30 Sep 2025",
      },
      {
        date: "2025-11-20",
        type: "debit",
        amount: 120000,
        narration: "Interim distribution - Income Opportunities Fund II",
      },
      {
        date: "2025-12-22",
        type: "credit",
        amount: 25000,
        narration: "Equalisation credit",
      },
      {
        date: "2026-02-16",
        type: "debit",
        amount: 90000,
        narration: "Distribution - Techculture Growth Fund I",
      },
      {
        date: "2026-03-31",
        type: "debit",
        amount: 72000,
        narration: "Management fee - quarter ended 31 Mar 2026",
      },
      {
        date: "2026-06-30",
        type: "debit",
        amount: 74000,
        narration: "Management fee - quarter ended 30 Jun 2026",
      },
    ],
    holdings: [
      {
        id: "tgf-i-a",
        identifier: "TGF-I-A",
        name: "Techculture Growth Fund I - Class A",
        quantity: 4500,
        averageCost: 1000,
        marketValue: 5130000,
      },
      {
        id: "iof-ii-b",
        identifier: "IOF-II-B",
        name: "Income Opportunities Fund II - Class B",
        quantity: 1500,
        averageCost: 1000,
        marketValue: 1620000,
      },
    ],
    realizedPnl: 210000,
    statements: [
      {
        id: "stmt-fy27-q1",
        period: "Q1 FY 2026-27 (Apr - Jun 2026)",
        issuedOn: "2026-07-15",
        fileName: "TC24018-FY27-Q1.pdf",
      },
      {
        id: "stmt-fy26-q4",
        period: "Q4 FY 2025-26 (Jan - Mar 2026)",
        issuedOn: "2026-04-15",
        fileName: "TC24018-FY26-Q4.pdf",
      },
      {
        id: "stmt-fy26-q3",
        period: "Q3 FY 2025-26 (Oct - Dec 2025)",
        issuedOn: "2026-01-15",
        fileName: "TC24018-FY26-Q3.pdf",
      },
    ],
  },
  {
    password: demoInvestors[1].password,
    profile: {
      tradingCode: "TC31044",
      fullName: "Meera Kapoor",
      dateOfBirth: "1992-11-02",
      pan: "MKRPA2281Q",
      mobile: demoInvestors[1].mobile,
      email: demoInvestors[1].email,
      fatherName: "Suresh Kapoor",
      motherName: "Kavita Kapoor",
      maritalStatus: "Married",
      annualIncome: "25 to 50 Lakh",
      address: "Flat 902, Palm Court, Gurugram, HR, 122002",
      nomineeName: "Arjun",
      nomineeRelationship: "Husband",
      kra: false,
      fatca: true,
      status: "active",
      bankName: "",
      accountNumber: "",
      ifsc: "",
    },
    ledger: [
      {
        date: "2025-04-08",
        type: "credit",
        amount: 9000000,
        narration: "Capital contribution - Drawdown 1, Class A",
      },
      {
        date: "2025-06-30",
        type: "debit",
        amount: 112500,
        narration: "Management fee - quarter ended 30 Jun 2025",
      },
      {
        date: "2025-09-04",
        type: "credit",
        amount: 3000000,
        narration: "Capital contribution - Drawdown 2, Class B",
      },
      {
        date: "2025-09-30",
        type: "debit",
        amount: 148000,
        narration: "Management fee - quarter ended 30 Sep 2025",
      },
      {
        date: "2025-12-11",
        type: "debit",
        amount: 350000,
        narration: "Interim distribution - Techculture Growth Fund I",
      },
      {
        date: "2026-01-19",
        type: "credit",
        amount: 48000,
        narration: "Equalisation credit",
      },
      {
        date: "2026-03-06",
        type: "debit",
        amount: 210000,
        narration: "Distribution - Income Opportunities Fund II",
      },
      {
        date: "2026-03-31",
        type: "debit",
        amount: 151000,
        narration: "Management fee - quarter ended 31 Mar 2026",
      },
      {
        date: "2026-06-30",
        type: "debit",
        amount: 154500,
        narration: "Management fee - quarter ended 30 Jun 2026",
      },
    ],
    holdings: [
      {
        id: "tgf-i-a",
        identifier: "TGF-I-A",
        name: "Techculture Growth Fund I - Class A",
        quantity: 9000,
        averageCost: 1000,
        marketValue: 10440000,
      },
      {
        id: "iof-ii-b",
        identifier: "IOF-II-B",
        name: "Income Opportunities Fund II - Class B",
        quantity: 3000,
        averageCost: 1000,
        marketValue: 3180000,
      },
    ],
    realizedPnl: 560000,
    statements: [
      {
        id: "stmt-fy27-q1",
        period: "Q1 FY 2026-27 (Apr - Jun 2026)",
        issuedOn: "2026-07-18",
        fileName: "TC31044-FY27-Q1.pdf",
      },
      {
        id: "stmt-fy26-q4",
        period: "Q4 FY 2025-26 (Jan - Mar 2026)",
        issuedOn: "2026-04-18",
        fileName: "TC31044-FY26-Q4.pdf",
      },
      {
        id: "stmt-fy26-q3",
        period: "Q3 FY 2025-26 (Oct - Dec 2025)",
        issuedOn: "2026-01-18",
        fileName: "TC31044-FY26-Q3.pdf",
      },
    ],
  },
];

function seedAccount(seed: PortalSeed) {
  const portal = buildPortal(seed);
  const salt = randomBytes(16).toString("base64url");
  accounts.set(portal.profile.tradingCode, {
    salt,
    hash: hashPassword(seed.password, salt),
    version: 1,
    portal,
  });
}

portalSeeds.forEach(seedAccount);

function accountForIdentifier(identifier: string) {
  for (const account of accounts.values()) {
    if (identifierMatches(account.portal.profile, identifier)) return account;
  }
  return null;
}

export function authenticate(identifier: string, password: string) {
  const account = accountForIdentifier(identifier);
  if (!account) return null;
  if (!passwordsMatch(password, account.salt, account.hash)) return null;
  return account;
}

export function findClientCode(identifier: string) {
  return accountForIdentifier(identifier)?.portal.profile.tradingCode ?? null;
}

export function getPortal(clientCode: string) {
  return accounts.get(clientCode)?.portal ?? null;
}

export function getPasswordVersion(clientCode: string) {
  return accounts.get(clientCode)?.version ?? null;
}

export function updatePassword(clientCode: string, password: string) {
  const account = accounts.get(clientCode);
  if (!account) return false;
  const salt = randomBytes(16).toString("base64url");
  account.salt = salt;
  account.hash = hashPassword(password, salt);
  account.version += 1;
  return true;
}

type SecurityRecord = { name: string; isin: string };

const securities = new Map<string, SecurityRecord>([
  ["TGF-I-A", { name: "Techculture Growth Fund I - Class A", isin: "INF204K01AIF" }],
  ["IOF-II-B", { name: "Income Opportunities Fund II - Class B", isin: "INF204K01IOF" }],
]);

export function knownSecurity(identifier: string) {
  return securities.get(identifier.trim().toUpperCase())?.name ?? null;
}

export function listSecurities() {
  return [...securities.entries()].map(([identifier, record]) => ({
    identifier,
    name: record.name,
    isin: record.isin,
  }));
}

export function saveSecurity(input: { identifier: string; name: string; isin: string }) {
  const identifier = input.identifier.trim().toUpperCase();
  if (!identifier || !input.name.trim()) return null;
  securities.set(identifier, { name: input.name.trim(), isin: input.isin.trim().toUpperCase() });
  return { identifier, name: input.name.trim(), isin: input.isin.trim().toUpperCase() };
}

export function isProfileIncomplete(profile: PortalData["profile"]) {
  return (
    !profile.pan.trim() ||
    !profile.mobile.trim() ||
    !profile.email.trim() ||
    !profile.nomineeName.trim() ||
    !profile.bankName.trim() ||
    !profile.accountNumber.trim() ||
    !profile.ifsc.trim()
  );
}

function refreshMetrics(portal: PortalData) {
  const investedCapital = portal.ledger
    .filter(
      (row) =>
        row.type === "credit" &&
        row.narration.startsWith("Capital contribution"),
    )
    .reduce((sum, row) => sum + row.amount, 0);
  const currentValuation = portal.holdings.reduce(
    (sum, row) => sum + row.marketValue,
    0,
  );
  const unrealizedPnl = portal.holdings.reduce((sum, row) => sum + row.pnl, 0);
  portal.metrics = {
    ...portal.metrics,
    investedCapital,
    currentValuation,
    unrealizedPnl,
    totalPortfolioValue: currentValuation + portal.metrics.realizedPnl,
  };
}

export function listPortals() {
  return [...accounts.values()].map((account) => account.portal);
}

export function createClient(input: {
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
  status: PortalData["profile"]["status"];
  kra: boolean;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const code = `TC${String(accounts.size + 24018).padStart(5, "0")}`;
  if ([...accounts.values()].some((account) => account.portal.profile.email.toLowerCase() === email)) {
    return { error: "An investor with this email already exists." as const };
  }
  const portal = buildPortal({
    password: input.password,
    realizedPnl: 0,
    ledger: [],
    holdings: [],
    statements: [],
    profile: {
      tradingCode: code,
      fullName: input.fullName.trim(),
      dateOfBirth: input.dateOfBirth,
      pan: input.pan.trim().toUpperCase(),
      mobile: input.mobile.trim(),
      email,
      fatherName: "",
      motherName: "",
      maritalStatus: "",
      annualIncome: "",
      address: input.address.trim(),
      nomineeName: input.nomineeName.trim(),
      nomineeRelationship: input.nomineeRelationship.trim(),
      kra: input.kra,
      fatca: false,
      status: input.status,
      bankName: input.bankName.trim(),
      accountNumber: input.accountNumber.trim(),
      ifsc: input.ifsc.trim().toUpperCase(),
    },
  });
  const salt = randomBytes(16).toString("base64url");
  accounts.set(code, {
    salt,
    hash: hashPassword(input.password, salt),
    version: 1,
    portal,
  });
  return { portal };
}

export function updateClientProfile(
  clientCode: string,
  patch: Partial<PortalData["profile"]>,
) {
  const account = accounts.get(clientCode);
  if (!account) return null;
  const next = { ...account.portal.profile, ...patch, tradingCode: clientCode };
  account.portal.profile = next;
  return account.portal;
}

export function importLedgerRows(
  clientCode: string,
  rows: Array<{ date: string; type: "debit" | "credit"; amount: number; narration: string }>,
) {
  const account = accounts.get(clientCode);
  if (!account) return false;
  let balance = account.portal.ledger.at(-1)?.balance ?? 0;
  rows.forEach((row, index) => {
    balance += row.type === "credit" ? row.amount : -row.amount;
    account.portal.ledger.push({
      id: `imp-${account.portal.ledger.length + 1}-${index}`,
      date: row.date,
      type: row.type,
      amount: row.amount,
      balance,
      narration: row.narration,
    });
  });
  refreshMetrics(account.portal);
  return true;
}

export function importHoldingRows(
  clientCode: string,
  rows: Array<{
    identifier: string;
    name: string;
    quantity: number;
    averageCost: number;
    marketValue: number;
  }>,
) {
  const account = accounts.get(clientCode);
  if (!account) return false;
  rows.forEach((row) => {
    const identifier = row.identifier.toUpperCase();
    const existing = account.portal.holdings.find((item) => item.identifier === identifier);
    const next = {
      identifier,
      name: row.name,
      quantity: row.quantity,
      averageCost: row.averageCost,
      marketValue: row.marketValue,
      pnl: row.marketValue - row.quantity * row.averageCost,
    };
    if (existing) {
      Object.assign(existing, next);
    } else {
      account.portal.holdings.push({ id: identifier.toLowerCase(), ...next });
    }
  });
  refreshMetrics(account.portal);
  return true;
}

export function addGeneratedStatement(
  clientCode: string,
  statement: PortalData["statements"][number],
) {
  const account = accounts.get(clientCode);
  if (!account) return false;
  account.portal.statements.unshift(statement);
  return true;
}

export function toSessionUser(clientCode: string) {
  const portal = getPortal(clientCode);
  if (!portal) return null;
  return {
    name: portal.profile.fullName,
    email: portal.profile.email,
    mobile: portal.profile.mobile,
    clientCode: portal.profile.tradingCode,
  };
}
