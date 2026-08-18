// Thin Nodemailer wrapper. If SMTP env vars aren't configured (e.g. local
// dev without a mail provider), emails are logged to the console instead of
// throwing, so the rest of the app (password reset, notifications) keeps
// working without a hard dependency on email being set up.
const nodemailer = require("nodemailer");

let transporter = null;
let attemptedInit = false;

function getTransporter() {
  if (attemptedInit) return transporter;
  attemptedInit = true;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[email] SMTP not configured — emails will be logged, not sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || "no-reply@archpro.com";
  const t = getTransporter();

  if (!t) {
    console.log(`[email:not-sent] to=${to} subject="${subject}"\n${text || html}`);
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    await t.sendMail({ from, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendEmail };
