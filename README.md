# AIF Wealth Discovery

Private investor portal for an Alternative Investment Fund. Investors sign in and see only their own portfolio, profile, ledger, holdings, and statements. Staff run the fund from an admin console: clients, imports, reports, and platform settings.

The repo has two parts:

| Folder | What it is |
| --- | --- |
| `aif` | Next.js frontend (React). Screens call the API through `aif/config/endapi.js`. |
| `server` | Node.js API (Express) on port 4000, written as routes, controllers, and functions. |

Data is stored in MongoDB Atlas, database `aif_wealthdiscovery`. The connection string lives in `aif/.env.local`. Allowed browser origins live in `server/.env` (`CORS_ORIGIN`).

## What is done

- Investor screens: dashboard, profile, ledger, holdings, and statement history, including statement PDF download.
- Sign in with mobile or email, sign out, and a forgot-password flow. The verification code is shown on screen because email and SMS are not connected yet.
- Staff sign in from the same login form when the email belongs to a staff account. A separate admin login page also exists at `/admin/login`.
- Admin console: dashboard, client master (create and edit), CSV import preview and commit for ledger and holdings, and statement report runs.
- Super admin console: command center, staff directory, role matrix, audit trail, statement schedules, and platform controls (KRA settings, securities, and a manual ledger override).
- Sessions are signed HTTP-only cookies. An investor can only read their own client code.
- Investor and staff records, securities, and platform state persist in MongoDB. Demo investors and staff are seeded on first run if those collections are empty.
- Every screen talks to the Node API. API paths are listed in `aif/config/endapi.js`.
- CORS origin is configured separately in `server/.env`, not in the MongoDB env file.

New clients created by staff get the starting password `123456`.

## Roles

There are **3 roles**: Investor, Admin, and Super admin.

### Investor

An investor is a fund client, not a staff user. After sign in they land on `/dashboard` and can only open their own records.

- View portfolio value, recent transactions, and the valuation trend.
- View profile and compliance flags such as KRA.
- View their ledger and holdings.
- View statement history and open or download a statement PDF.
- Reset their own password.

They cannot see other investors, and they cannot open the admin console.

### Admin

There is no default admin login. A super admin can add an admin from the staff directory.

An admin can use:

- **Dashboard** — fund overview.
- **Client master** — list clients, open a client, create a client, and edit client details.
- **Imports** — upload a ledger or holdings CSV, preview rows, and commit the file.
- **Reports** — queue a statement run for a client.

An admin cannot use staff directory, role matrix, audit trail, schedules, platform controls, or the manual ledger override. Those stay off even if someone edits the role matrix. A super admin can turn **clients**, **imports**, and **reports** on or off for the Admin role.

### Super admin

Default account: `superadmin@gmail.com` / `123456`.

A super admin can do everything an admin can do, plus:

- **Command center** — the admin home for this role.
- **Staff directory** — list staff, add a staff user, and change name, role, or suspended status.
- **Role matrix** — choose whether Admin can use clients, imports, and reports.
- **Audit trail** — filter actions by actor, action, and entity.
- **Schedules** — set how often statements are generated.
- **Platform controls** — KRA endpoint settings, the security master, and a manual ledger line with a reason.

Super admin access cannot be reduced from the role matrix.

## Run locally

1. Copy `aif/.env.example` to `aif/.env.local` and set `MONGODB_URI` and `MONGODB_DB`.
2. Copy `server/.env.example` to `server/.env` and set `CORS_ORIGIN` to the frontend origin, usually `http://localhost:3000`.
3. Start the API:

```bash
cd server
npm install
npm run dev
```

4. Start the frontend:

```bash
cd aif
npm install
npm run dev
```

Open `http://localhost:3000`. The API listens on `http://localhost:4000`.

There are no demo investor accounts. Staff create an investor from the admin console.

## Kahani

Ek alternative investment fund ka investor din bhar screen pe trade nahi karta. Paisa ek scheme mein pada rehta hai. Use sirf ek private jagah chahiye jahan woh dekh sake ki usne kitna lagaya, ab uski value kya hai, kaun se securities uske paas hain, aur fund ne jo statement banayi hai woh kahan hai. Aaj yeh jawab aksar email, PDF, ya office ke phone call mein pada hota hai.

Office ki problem isi ka doosra hissa hai. Client records, ledger lines, aur holdings files mein aate hain. Kisi ko unhe load karna hota hai, time pe statements bhejni hoti hain, aur galat number ko theek karna hota hai. Kisi aur ko yeh dekhna hota hai ki woh change kisne kiya. Office ka har insaan staff account nahi bana sakta, aur na hi books ko dobara likh sakta hai.

Isi liye hum yeh project bana rahe hain. AIF Wealth Discovery fund house ka woh private room hai. Investor sign in karta hai aur sirf apna fund dekhta hai. Admin client book sambhalta hai, files import karta hai, aur statements queue karta hai. Super admin decide karta hai ki admin kya chhoo sakta hai, audit trail padhta hai, aur ledger badalne wale controls apne paas rakhta hai. Is repo ke do folders usi room ke do taraf hain: `aif` woh screens hain jo log use karte hain, aur `server` woh desk hai jo records rakhta hai.

## Super admin workflow

Sign in at `/login` or `/admin/login` with `superadmin@gmail.com` and password `123456`. The console opens at `/admin`. Every page below is available to this role. Super admin access cannot be turned off from the role matrix.

### `/admin` — Command center

The home page after sign in.

- See platform AUM, failed import rows, and statement dispatch (sent and scheduled).
- See recent staff sign-ins, the import queue, and high-privilege actions.

Platform AUM is the total money the fund is managing across every investor. AUM means assets under management.

On the Command center it is the sum of each investor’s portfolio value. One investor’s value is the market value of their holdings plus any realized profit or loss already booked. With no investors in the system, that total is ₹0.

-----
Each ledger or holdings import is checked row by row. A row counts as failed when it is missing something required, such as the investor, the date, the particulars, or an amount greater than zero. Valid rows are committed. Failed rows are only logged.

The Command center adds those failed counts from every import. The 1 on your screen comes from the sample job ledger-jun-2026.csv, which was stored with 4 valid rows and 1 failed row.
----Statement dispatch

Statement dispatch is how many investor statements the fund has produced or queued.

Sent counts statement runs that are already done. That includes a PDF generated now from Reports, and any run marked sent. The 1 sent on your screen is the sample capital-account statement for Subham, period Q1 FY 2026-27.
Scheduled counts runs that are still waiting. Those come from Schedule delivery on the Reports page, set to daily, weekly, or monthly. Yours shows 0 scheduled because nothing is waiting.

### `/admin/clients` — Client master

- Search investors by client code, name, mobile, or email.
- Open a client record.
- Go to create client.

### `/admin/clients/new` — Create client

- Add an investor: name, email, 10-digit mobile, PAN, date of birth (must be 18 or older), and address.
- Add one or more nominees with a relationship.
- Add bank details: account holder, account number, IFSC, bank name, city, account type, UPI, MICR, DP order id, and primary flag.
- Set status and KRA. The new investor can sign in with password `123456`.

### `/admin/clients/[code]` — Client record

Open one investor and work through the tabs.

- **Profile** — edit name, email, mobile, PAN, date of birth, address, and active or inactive status.
- **Bank** — read the saved bank accounts and update the primary bank name, account number, and IFSC.
- **Nominee** — read nominees and update the primary nominee name and relationship.
- **KRA** — mark KRA verified and FATCA complete.
- **Documents, holdings, ledger, portfolio, reports, statements, audit** — read that investor’s records. Holdings and ledger change from Imports or the ledger override, not from these tabs.

### `/admin/imports` — Imports

- **Ledger** — upload Excel, TXT, JSON, PDF, or an image (JPG, PNG, WEBP). Match the investor name in the file, or pick the client. Preview the rows, then commit the valid ones. Error rows can be downloaded.
- **Holdings** — upload a CSV, preview, then commit the valid rows.

### `/admin/reports` — Reports and statements

- Pick a client, statement type (capital account, holdings, or portfolio), and a period.
- Generate a PDF record now, or schedule daily, weekly, or monthly delivery.
- Read the statement run history.

### `/admin/nav` — NAV

- Add the fund NAV for a date. The date cannot be in the future. Saving the same date again replaces that day’s NAV.
- Read the NAV history, including who added each value. The latest date is the NAV investors see. Market value on holdings is units × that NAV.

### `/admin/users` — Staff directory

- List staff accounts.
- Create a staff user with name, email, password, and role (Admin or Super admin).
- Edit a staff name or role.
- Suspend or activate a staff account. A super admin cannot suspend their own account.

### `/admin/roles` — Role matrix

- See that Super admin is allowed on every module.
- Turn **clients**, **imports**, **reports**, and **NAV** on or off for the Admin role, then confirm the save.
- Staff directory, audit, schedules, platform controls, and the ledger override stay super-admin only.

### `/admin/audit` — Audit trail

- Filter actions by person, action, and the record that changed.
- Read who did what, including staff logins, client changes, imports, role changes, and ledger overrides.

### `/admin/schedules` — Statement schedules

- Read saved schedules.
- Save a new one: daily, weekly, or monthly; target `all-active` or one client code; retry count; and whether duplicate sends are blocked.

### `/admin/platform` — Platform controls

- Save the KRA provider settings.
- Add a security to the security master (symbol, name, ISIN).
- Post a manual ledger line for a client (date, debit or credit, amount, narration) and confirm it with a reason. This writes the investor’s ledger and is recorded in the audit trail.
