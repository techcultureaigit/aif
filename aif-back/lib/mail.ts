import { existsSync } from "node:fs";
import { createTransport } from "nodemailer";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function logoPath() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "../../aif-front/public/company.png"),
    join(here, "../assets/company.png"),
  ];
  return candidates.find((file) => existsSync(file)) ?? null;
}

function transport() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function fromAddress() {
  return process.env.MAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || "info@wealthdiscovery.in";
}

function layout(body: string) {
  const logo = logoPath();
  const image = logo
    ? `<img src="cid:company-logo" width="220" alt="Wealth Discovery Group" style="display:block;border:0;height:auto;max-width:220px;" />`
    : `<p style="margin:0;font-family:Segoe UI,Arial,sans-serif;font-size:18px;font-weight:700;color:#1B3C6C;">Wealth Discovery Group</p>`;
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F4F7FB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E6EDF5;border-radius:16px;">
          <tr><td style="height:6px;background:#F97316;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td align="center" style="padding:28px 32px 4px;">${image}</td></tr>
          <tr>
            <td style="padding:12px 32px 28px;font-family:Segoe UI,Arial,sans-serif;color:#16324F;font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 22px;background:#F8FAFC;border-top:1px solid #E6EDF5;font-family:Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.7;color:#7B8794;text-align:center;">
              Wealth Discovery Group<br />
              1206, 12th Floor, Kailash Building K.G. Marg. Connaught Place, Delhi, 110001<br />
              info@wealthdiscovery.in · 91 11 4344 4666
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function deliver(input: { to: string; subject: string; html: string; text: string }) {
  const mailer = transport();
  if (!mailer) {
    return { ok: false as const, error: "Email is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS on the API." };
  }
  const logo = logoPath();
  try {
    await mailer.sendMail({
      from: `"Wealth Discovery Group" <${fromAddress()}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: logo
        ? [{ filename: "company.png", path: logo, cid: "company-logo" }]
        : [],
    });
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The email could not be sent.";
    console.error("Mail send failed:", message);
    return { ok: false as const, error: message };
  }
}

export async function sendAccountCreatedMail(input: {
  investorName: string;
  tradingCode: string;
  email: string;
  password: string;
}) {
  const name = escapeHtml(input.investorName);
  const code = escapeHtml(input.tradingCode);
  const email = escapeHtml(input.email);
  const password = escapeHtml(input.password);
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;color:#1B3C6C;">Your account is ready</h1>
    <p style="margin:0 0 18px;color:#16324F;">Hello ${name}, your AIF Client Portal account has been created. Use the details below to sign in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E6EDF5;border-radius:12px;">
      <tr><td style="padding:14px 16px;font-size:13px;color:#7B8794;">AIF code</td><td style="padding:14px 16px;font-size:14px;font-weight:600;color:#16324F;">${code}</td></tr>
      <tr><td style="padding:0 16px 14px;font-size:13px;color:#7B8794;">User ID (email)</td><td style="padding:0 16px 14px;font-size:14px;font-weight:600;color:#16324F;">${email}</td></tr>
      <tr><td style="padding:0 16px 16px;font-size:13px;color:#7B8794;">Password</td><td style="padding:0 16px 16px;font-size:14px;font-weight:600;letter-spacing:0.04em;color:#1B3C6C;">${password}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#7B8794;">Sign in with this email and password. For security, change your password after the first sign-in.</p>
  `);
  const text = [
    "Your account is ready",
    "",
    `Hello ${input.investorName},`,
    "Your AIF Client Portal account has been created.",
    "",
    `AIF code: ${input.tradingCode}`,
    `User ID (email): ${input.email}`,
    `Password: ${input.password}`,
    "",
    "Sign in with this email and password. For security, change your password after the first sign-in.",
    "",
    "Wealth Discovery Group",
    "1206, 12th Floor, Kailash Building K.G. Marg. Connaught Place, Delhi, 110001",
  ].join("\n");
  return deliver({
    to: input.email,
    subject: "Your AIF Client Portal account credentials",
    html,
    text,
  });
}

export async function sendPasswordChangedMail(input: {
  investorName: string;
  tradingCode: string;
  email: string;
  password: string;
}) {
  const name = escapeHtml(input.investorName);
  const code = escapeHtml(input.tradingCode);
  const email = escapeHtml(input.email);
  const password = escapeHtml(input.password);
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;color:#1B3C6C;">Your password was updated</h1>
    <p style="margin:0 0 18px;color:#16324F;">Hello ${name}, an administrator updated your AIF Client Portal password. Use the details below to sign in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E6EDF5;border-radius:12px;">
      <tr><td style="padding:14px 16px;font-size:13px;color:#7B8794;">AIF code</td><td style="padding:14px 16px;font-size:14px;font-weight:600;color:#16324F;">${code}</td></tr>
      <tr><td style="padding:0 16px 14px;font-size:13px;color:#7B8794;">User ID (email)</td><td style="padding:0 16px 14px;font-size:14px;font-weight:600;color:#16324F;">${email}</td></tr>
      <tr><td style="padding:0 16px 16px;font-size:13px;color:#7B8794;">New password</td><td style="padding:0 16px 16px;font-size:14px;font-weight:600;letter-spacing:0.04em;color:#1B3C6C;">${password}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#7B8794;">If you did not expect this change, contact Wealth Discovery Group immediately.</p>
  `);
  const text = [
    "Your password was updated",
    "",
    `Hello ${input.investorName},`,
    "An administrator updated your AIF Client Portal password.",
    "",
    `AIF code: ${input.tradingCode}`,
    `User ID (email): ${input.email}`,
    `New password: ${input.password}`,
    "",
    "If you did not expect this change, contact Wealth Discovery Group immediately.",
    "",
    "Wealth Discovery Group",
    "1206, 12th Floor, Kailash Building K.G. Marg. Connaught Place, Delhi, 110001",
  ].join("\n");
  return deliver({
    to: input.email,
    subject: "Your AIF Client Portal password was updated",
    html,
    text,
  });
}

export async function sendPasswordOtpMail(input: { to: string; name: string; code: string }) {
  const name = escapeHtml(input.name || "Investor");
  const code = escapeHtml(input.code);
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;color:#1B3C6C;">Reset your password</h1>
    <p style="margin:0 0 18px;color:#16324F;">Hello ${name}, use this code to choose a new password for your AIF Client Portal account.</p>
    <p style="margin:0;padding:16px 12px;background:#F8FAFC;border:1px solid #E6EDF5;border-radius:12px;text-align:center;font-size:32px;font-weight:700;letter-spacing:0.28em;color:#1B3C6C;">${code}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#7B8794;">This code expires in 10 minutes. If you did not ask for a reset, you can ignore this email.</p>
  `);
  const text = [
    `Hello ${input.name || "Investor"},`,
    "",
    `Your AIF Client Portal password reset code is ${input.code}.`,
    "This code expires in 10 minutes.",
    "",
    "Wealth Discovery Group",
  ].join("\n");
  return deliver({
    to: input.to,
    subject: "Your AIF Client Portal password reset code",
    html,
    text,
  });
}
