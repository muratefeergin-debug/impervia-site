const nodemailer = require('nodemailer');

const MAIL_TO = process.env.MAIL_TO || 'info@theimperviagroup.com';

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const name = clean(body.name);
  const email = clean(body.email);
  const interest = clean(body.interest);

  if (!name || !email || !interest) {
    return res.status(400).json({ error: 'Name, email, and area of interest are required.' });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'Mail service is not configured.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Phone', body.phone],
    ['Company / Organisation', body.company],
    ['Country', body.country],
    ['Area of Interest', interest],
    ['Investment Range', body.investment],
    ['Preferred Contact Method', body.preferredContact],
    ['Message', body.message],
  ];

  const text = rows.map(([label, value]) => `${label}: ${clean(value) || '-'}`).join('\n');
  const htmlRows = rows
    .map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;"><strong>${escapeHtml(label)}</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(value) || '-'}</td></tr>`)
    .join('');

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: MAIL_TO,
    replyTo: email,
    subject: `Impervia Inquiry — ${interest}`,
    text,
    html: `<div style="font-family:Arial,sans-serif;color:#111;"><h2>New Impervia Website Inquiry</h2><table style="border-collapse:collapse;width:100%;max-width:720px;">${htmlRows}</table></div>`,
  });

  return res.status(200).json({ ok: true });
};
