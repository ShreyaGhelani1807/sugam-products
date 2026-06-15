// Standalone payment reconciliation runner (for cron / manual use):
//   node scripts/reconcile.js            # detect + repair
//   node scripts/reconcile.js --dry-run  # report only, no repair
//
// Designed to run on a schedule (e.g. Railway cron every 15 minutes). When it
// finds paid-but-unrecorded orders or errors, it prints a clear [RECONCILE
// ALERT] line, emails the admin, and exits non-zero so the platform/monitor
// can flag the run.
require('dotenv').config();
const { reconcilePayments } = require('../src/services/reconciliationService');
const { sendEmail } = require('../src/utils/email');

(async () => {
  const repair = !process.argv.includes('--dry-run');
  try {
    const report = await reconcilePayments({ repair });
    console.log(JSON.stringify(report, null, 2));

    const { paidButUnrecorded, repaired, errors } = report.summary;
    const needsAttention = paidButUnrecorded > 0 || errors > 0;

    if (needsAttention) {
      console.error(
        `[RECONCILE ALERT] checked=${report.summary.checked} ` +
        `paidButUnrecorded=${paidButUnrecorded} repaired=${repaired} errors=${errors}`
      );
      const to = process.env.GMAIL_USER || 'admin@sugamproducts.com';
      await sendEmail({
        to,
        subject: `[Sugam] Reconciliation alert — ${paidButUnrecorded} unrecorded, ${errors} errors`,
        html: `<p>Payment reconciliation needs attention.</p>
               <pre>${JSON.stringify(report.summary, null, 2)}</pre>
               <p>Repaired this run: ${repaired}. Review the server logs for detail.</p>`,
      });
      process.exit(2); // non-zero, distinct from a hard failure (1)
    }

    process.exit(0);
  } catch (err) {
    console.error('[reconcile] failed:', err.message);
    process.exit(1);
  }
})();
