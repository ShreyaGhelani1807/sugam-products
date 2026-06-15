const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

// Escapes the five HTML-significant characters so user-supplied values cannot
// inject markup/script into the HTML emails that land in customer/admin inboxes.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Sends an email and reports success/failure so callers can audit it.
// Never throws — a notification failure must not break the order flow — but it
// returns { sent: false } and logs loudly so missing/broken email is visible.
async function sendEmail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    if (process.env.NODE_ENV === 'production') {
      // Email is the only notification channel; silent drops are unacceptable.
      console.error(`[Email NOT SENT] GMAIL_USER/GMAIL_PASS missing in production. To: ${to}, Subject: ${subject}`);
    } else {
      console.log(`[Email MOCK] To: ${to}, Subject: ${subject}`);
    }
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await transporter.sendMail({ from: `"Sugam Products" <${process.env.GMAIL_USER}>`, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error(`[Email Error] Failed to send "${subject}" to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

function orderConfirmationHtml(order) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#ea580c">Order Confirmed! 🎉</h2>
      <p>Hi ${escapeHtml(order.customer?.name)},</p>
      <p>Your order <strong>#${order.id.slice(-8).toUpperCase()}</strong> has been placed successfully.</p>
      <p><strong>Total:</strong> ₹${escapeHtml(order.totalAmount)}</p>
      <p>We'll keep you updated by email as your order progresses.</p>
      <p>Thank you for choosing Sugam Products!</p>
    </div>
  `;
}

module.exports = { sendEmail, orderConfirmationHtml, escapeHtml };
