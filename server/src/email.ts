import nodemailer from 'nodemailer';

type SendOtpParams = {
  to: string;
  otp: string;
  subject: string;
  contextLine: string;
};

export async function sendOtpEmail({ to, otp, subject, contextLine }: SendOtpParams) {
  const mode = (process.env.EMAIL_MODE || 'console').toLowerCase();

  if (mode === 'console') {
    // eslint-disable-next-line no-console
    console.log(`[OTP:${subject}] To=${to} OTP=${otp} (${contextLine})`);
    return;
  }

  const user = process.env.SMTP_USER || process.env.OUTLOOK_USER;
  const pass = process.env.SMTP_PASS || process.env.OUTLOOK_PASS;
  const host = process.env.SMTP_HOST || (user?.includes('@outlook') || user?.includes('@adventz.com') ? 'smtp.office365.com' : undefined);
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const from = process.env.SMTP_FROM || (user ? `Zuari Travel Desk <${user}>` : 'Zuari Travel Desk <no-reply@zuari.local>');

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP configuration (SMTP_HOST/SMTP_USER/SMTP_PASS) or (OUTLOOK_USER/OUTLOOK_PASS)');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text: `${contextLine}\n\nYour OTP is: ${otp}\n\nThis code expires soon. If you did not request this, you can ignore this email.`,
  });
}
