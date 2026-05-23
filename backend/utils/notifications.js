import nodemailer from 'nodemailer';
import { sendWhatsAppConfirmation } from './whatsapp.js';

// ══════════════════════════════════════════════════════════════════
// UTILITY: Calculate Waiting Time
// Peak 7 PM – 9 PM → "15-20 mins waiting time"
// All other times  → "0 mins - Table Ready"
// ══════════════════════════════════════════════════════════════════
export function calculateWaitingTime(bookingTime, currentWaitTime = 0) {
  try {
    let wait = Number(currentWaitTime) || 0;
    const hour = new Date(bookingTime).getHours();
    
    // Add base wait time during peak hours if it's currently low
    if (hour >= 19 && hour < 21 && wait < 15) {
      wait = 15;
    }
    
    if (wait > 0) return `${wait} mins waiting time`;
  } catch { /* fall through */ }
  return '0 mins - Table Ready';
}

// ══════════════════════════════════════════════════════════════════
// NODEMAILER: Central Gmail transporter (system-level credentials)
// ══════════════════════════════════════════════════════════════════
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,   // central system Gmail account
      pass: process.env.EMAIL_PASS,   // 16-char App Password
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// EMAIL HTML TEMPLATE — Restaurant-branded
// ══════════════════════════════════════════════════════════════════
function buildEmailHtml({ customerName, restaurantName, city, bookingTime, waitingTimeStatus, bookingId }) {
  const formattedDate = bookingTime
    ? new Date(bookingTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })
    : 'As scheduled';

  const isReady    = waitingTimeStatus.includes('Ready');
  const waitColor  = isReady ? '#16a34a' : '#d97706';
  const waitBg     = isReady ? '#f0fdf4' : '#fffbeb';
  const waitBorder = isReady ? '#bbf7d0' : '#fde68a';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Booking Confirmed — ${restaurantName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

  <!-- HEADER: Uses restaurant name as the brand -->
  <tr>
    <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:44px 40px 36px;text-align:center;">
      <p style="margin:0 0 10px;font-size:32px;">🍽️</p>
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Booking Confirmed at ${restaurantName}!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
        📍 ${city || 'Your city'}
      </p>
    </td>
  </tr>

  <!-- GREETING -->
  <tr><td style="padding:28px 40px 8px;">
    <p style="margin:0;font-size:17px;color:#1e293b;">Hi <strong>${customerName}</strong> 👋</p>
    <p style="margin:10px 0 0;font-size:15px;color:#64748b;line-height:1.65;">
      Your reservation at <strong>${restaurantName}</strong> is confirmed. Here's your booking summary:
    </p>
  </td></tr>

  <!-- BOOKING DETAILS TABLE -->
  <tr><td style="padding:20px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;font-size:14px;">
      <tr style="background:#f8fafc;">
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;width:38%;
            font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">
          Booking ID
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
          <code style="font-size:13px;font-weight:700;color:#0f172a;background:#f1f5f9;padding:2px 8px;border-radius:4px;">
            ${bookingId}
          </code>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;background:#f8fafc;
            font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">
          Customer
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1e293b;">
          ${customerName}
        </td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;
            font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">
          Restaurant
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1e293b;">
          ${restaurantName}
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;background:#f8fafc;
            font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">
          Location
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1e293b;">
          📍 ${city || 'N/A'}
        </td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:14px 20px;
            font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">
          Date &amp; Time
        </td>
        <td style="padding:14px 20px;font-weight:600;color:#1e293b;">🕐 ${formattedDate}</td>
      </tr>
    </table>
  </td></tr>

  <!-- WAIT TIME HIGHLIGHT -->
  <tr><td style="padding:8px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:${waitBg};border:1px solid ${waitBorder};border-radius:12px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;font-size:12px;font-weight:700;color:${waitColor};
            text-transform:uppercase;letter-spacing:1px;">Estimated Waiting Time</p>
        <p style="margin:10px 0 0;font-size:24px;font-weight:900;color:${waitColor};">
          ⏱ ${waitingTimeStatus}
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- BOOKING ID BADGE -->
  <tr><td style="padding:16px 40px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1px solid #fed7aa;border-radius:12px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#9a3412;
            text-transform:uppercase;letter-spacing:1px;">Show at restaurant counter</p>
        <p style="margin:8px 0 4px;font-family:monospace;font-size:18px;font-weight:900;
            color:#ea580c;letter-spacing:3px;">${bookingId}</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Powered by <strong style="color:#f97316;">ZeroWait</strong> — Skip the queue, enjoy the food! 🚀
    </p>
    <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
      Have questions? Reply to this email and ${restaurantName} will assist you directly.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════════
// EXPORT: Send B2B Dynamic Email Confirmation
// FROM display name = restaurant brand
// REPLY-TO         = restaurant.ownerEmail (owner's inbox)
// TO               = customerEmail
// ══════════════════════════════════════════════════════════════════
export async function sendConfirmationEmail({ ownerEmail, restaurantName, customerEmail, ...rest }) {
  console.log('\n[Email] ─────────────────────────────────────────');
  console.log(`[Email] 📧 To customer: ${customerEmail}`);
  console.log(`[Email] 🏠 From brand:  "${restaurantName}" | Reply-To: ${ownerEmail || '(not set)'}`);

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_')) {
    console.error('[Email] ❌ EMAIL_USER not configured in .env — skipping.');
    console.log('[Email] ─────────────────────────────────────────\n');
    return;
  }
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'abcdefghijklmnop') {
    console.error('[Email] ❌ EMAIL_PASS not configured in .env — skipping.');
    console.error('[Email] 💡 Generate a Gmail App Password → https://myaccount.google.com/apppasswords');
    console.log('[Email] ─────────────────────────────────────────\n');
    return;
  }

  try {
    const transporter = createTransporter();

    console.log('[Email] 🔌 Verifying Gmail SMTP...');
    await transporter.verify();
    console.log('[Email] ✅ SMTP OK — sending...');

    const mailOptions = {
      // Branded sender — appears as the restaurant, sent via your central Gmail
      from:    `"${restaurantName}" <${process.env.EMAIL_USER}>`,
      // If customer replies → goes straight to the owner's inbox
      replyTo: ownerEmail || process.env.EMAIL_USER,
      to:      customerEmail,
      subject: `Booking Confirmed at ${restaurantName}! 🍽️`,
      html:    buildEmailHtml({ restaurantName, ...rest }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Sent! Message-ID: ${info.messageId}`);
    console.log(`[Email] 📬 Reply-To set to: ${mailOptions.replyTo}`);
  } catch (err) {
    console.error(`[Email] ❌ FAILED — ${err.code || err.name}: ${err.message}`);
    if (err.code === 'EAUTH')       console.error('[Email] 🔑 Wrong Gmail credentials. Use a 16-char App Password.');
    if (err.responseCode === 535)   console.error('[Email] 🔑 SMTP 535 — re-check EMAIL_USER and EMAIL_PASS.');
    if (err.code === 'ECONNREFUSED') console.error('[Email] 🌐 Connection refused — check internet/firewall/port 587.');
  }
  console.log('[Email] ─────────────────────────────────────────\n');
}

// ══════════════════════════════════════════════════════════════════
// EXPORT: Send B2B Dynamic WhatsApp Confirmation
// Sends to customerPhone via the active WhatsApp session
// Falls back to a developer simulator log if session not ready
// ══════════════════════════════════════════════════════════════════
export async function sendConfirmationWhatsApp({
  ownerPhone,
  customerPhone,
  customerName,
  restaurantName,
  bookingTime,
  waitingTimeStatus,
  bookingId,
}) {
  const formattedTime = bookingTime
    ? new Date(bookingTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'your scheduled time';

  const message =
    `🍽️ *Booking Confirmed — ${restaurantName}!*\n\n` +
    `Hi *${customerName}*,\n` +
    `Your table is confirmed for *${formattedTime}*.\n\n` +
    `📋 *Booking ID:* \`${bookingId}\`\n` +
    `⏱ *Estimated Wait:* ${waitingTimeStatus}\n\n` +
    `Show your Booking ID at the restaurant counter. See you soon! 🚀\n` +
    `— *${restaurantName}*`;

  // Attempt real WhatsApp send (delegates to singleton client)
  await sendWhatsAppConfirmation(customerPhone, message, {
    ownerPhone,
    restaurantName,
    customerName,
    bookingId,
  });
}
