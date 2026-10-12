import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'mail.privateemail.com';
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER || 'info@numelixa.com';
const pass = process.env.SMTP_PASSWORD || '';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!pass) throw new Error('SMTP_NOT_CONFIGURED');
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter.sendMail({ from: `NUMELIXA <${user}>`, to, subject, html });
}

export function emailLayout(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#111827"><b style="font-size:24px">NUMELIXA</b><h1>${title}</h1><div>${body}</div><hr><small>Support: info@numelixa.com</small></div>`;
}
