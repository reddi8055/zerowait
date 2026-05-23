import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

// ══════════════════════════════════════════════════════════════════
// WhatsApp client singleton — initialized once at server startup
// LocalAuth persists the session so you only scan QR once
// ══════════════════════════════════════════════════════════════════

let whatsappClient = null;
let whatsappReady  = false;

export function initWhatsApp() {
  console.log('\n[WhatsApp] 🚀 Initialising WhatsApp Web client...');

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
      ],
    },
  });

  // ── QR Code: scan once with WhatsApp on your phone ─────────────
  whatsappClient.on('qr', (qr) => {
    console.log('\n[WhatsApp] 📱 Scan this QR code with your WhatsApp app:');
    console.log('[WhatsApp] Open WhatsApp → Settings → Linked Devices → Link a Device\n');
    qrcode.generate(qr, { small: true });
  });

  // ── Ready ───────────────────────────────────────────────────────
  whatsappClient.on('ready', () => {
    whatsappReady = true;
    console.log('\n[WhatsApp] ✅ Client is ready! Messages will now be delivered.\n');
  });

  // ── Authenticated from saved session ───────────────────────────
  whatsappClient.on('authenticated', () => {
    console.log('[WhatsApp] 🔑 Authenticated via saved session (no QR scan needed).');
  });

  // ── Auth failure ────────────────────────────────────────────────
  whatsappClient.on('auth_failure', (msg) => {
    whatsappReady = false;
    console.error('[WhatsApp] ❌ Auth failed:', msg);
    console.error('[WhatsApp] 💡 Delete ".wwebjs_auth" folder and restart to re-scan QR.');
  });

  // ── Disconnected ────────────────────────────────────────────────
  whatsappClient.on('disconnected', (reason) => {
    whatsappReady = false;
    console.warn('[WhatsApp] ⚠️  Disconnected:', reason);
  });

  whatsappClient.initialize();
}

// ══════════════════════════════════════════════════════════════════
// Normalize phone → WhatsApp chat ID ("919876543210@c.us")
// Accepts: "9876543210", "+919876543210", "919876543210"
// ══════════════════════════════════════════════════════════════════
function toWhatsAppId(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}@c.us`;
  if (digits.length === 12 && digits.startsWith('91')) return `${digits}@c.us`;
  return `${digits}@c.us`; // fallback
}

// ══════════════════════════════════════════════════════════════════
// Print the developer Simulator Log when WhatsApp is not connected
// ══════════════════════════════════════════════════════════════════
function printSimulatorLog({ restaurantName, ownerPhone, customerPhone, bookingId }) {
  const ownerDisplay    = ownerPhone   ? `+91 ${ownerPhone.replace(/\D/g, '').slice(-10)}`   : 'Not Set';
  const customerDisplay = customerPhone ? `+91 ${customerPhone.replace(/\D/g, '').slice(-10)}` : 'Unknown';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         OWNER-CHANNEL SMS ROUTING SIMULATOR              ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  DISPATCHED SENDER : ${restaurantName} Business Line     `);
  console.log(`║                      (${ownerDisplay})                   `);
  console.log(`║  RECEIVING CUSTOMER: ${customerDisplay}                  `);
  console.log(`║  BOOKING ID        : ${bookingId}                        `);
  console.log(`║                                                           `);
  console.log(`║  MESSAGE CONTENT:                                         `);
  console.log(`║  Your table reservation at ${restaurantName} is          `);
  console.log(`║  fully confirmed! Show Booking ID ${bookingId}           `);
  console.log(`║  at the restaurant counter.                               `);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('[WhatsApp] 💡 To send real messages: scan the QR code shown at server startup.');
  console.log('[WhatsApp]    Open WhatsApp → Settings → Linked Devices → Link a Device\n');
}

// ══════════════════════════════════════════════════════════════════
// Send WhatsApp Message (safe — never throws)
// Falls back to developer simulator if session not ready
// ══════════════════════════════════════════════════════════════════
export async function sendWhatsAppConfirmation(phoneNumber, textBody, meta = {}) {
  const chatId = toWhatsAppId(phoneNumber);

  console.log('\n[WhatsApp] ─────────────────────────────────────────');
  console.log(`[WhatsApp] 📱 To customer: ${chatId}  (raw: "${phoneNumber}")`);

  let shouldFallback = !whatsappClient || !whatsappReady;

  if (!shouldFallback && meta.ownerPhone) {
    const loggedInNumber = whatsappClient.info?.wid?.user;
    const expectedNumber = meta.ownerPhone.replace(/\D/g, '');
    if (!loggedInNumber || !loggedInNumber.endsWith(expectedNumber)) {
      console.warn(`[WhatsApp] ⚠️ Session logged in as ${loggedInNumber || 'unknown'}, but restaurant owner is ${expectedNumber}. Falling back to Simulator log.`);
      shouldFallback = true;
    }
  }

  if (shouldFallback) {
    if (!whatsappClient || !whatsappReady) {
      console.warn('[WhatsApp] ⚠️  Session not active — falling back to Simulator log.');
    }
    printSimulatorLog({
      restaurantName: meta.restaurantName || 'Restaurant',
      ownerPhone:     meta.ownerPhone     || '',
      customerPhone:  phoneNumber,
      bookingId:      meta.bookingId      || 'N/A',
    });
    console.log('[WhatsApp] ─────────────────────────────────────────\n');
    return;
  }

  try {
    await whatsappClient.sendMessage(chatId, textBody);
    console.log(`[WhatsApp] ✅ Message delivered to ${chatId}`);
  } catch (err) {
    console.error(`[WhatsApp] ❌ Failed to send to ${chatId}:`, err.message);
    // Print simulator as fallback even when send fails
    printSimulatorLog({
      restaurantName: meta.restaurantName || 'Restaurant',
      ownerPhone:     meta.ownerPhone     || '',
      customerPhone:  phoneNumber,
      bookingId:      meta.bookingId      || 'N/A',
    });
  }
  console.log('[WhatsApp] ─────────────────────────────────────────\n');
}

export { whatsappReady };
