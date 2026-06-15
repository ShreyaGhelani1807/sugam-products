// Off-platform database backup runner. Creates a compressed pg_dump of the
// Railway PostgreSQL database so there is a restore point independent of
// Railway's own backups. Intended for manual use and/or a daily cron.
//
//   node scripts/backup.js                 # writes ./backups/sugam-<ts>.dump
//   BACKUP_DIR=/data node scripts/backup.js
//
// Requires the `pg_dump` binary (PostgreSQL client tools) on PATH and a valid
// DATABASE_URL. Restore with:
//   pg_restore --clean --no-owner -d "$TARGET_DATABASE_URL" sugam-<ts>.dump
require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[backup] DATABASE_URL is not set.');
  process.exit(1);
}

const dir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outFile = path.join(dir, `sugam-${stamp}.dump`);

// -Fc = custom compressed format (smallest, restorable with pg_restore).
const args = ['-Fc', '--no-owner', '--no-privileges', '-f', outFile, url];
const child = spawn('pg_dump', args, { stdio: ['ignore', 'inherit', 'inherit'] });

child.on('error', (err) => {
  console.error('[backup] could not start pg_dump (is it installed and on PATH?):', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code === 0) {
    const size = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
    console.log(`[backup] OK → ${outFile} (${size} MB)`);
    process.exit(0);
  } else {
    console.error(`[backup] pg_dump exited with code ${code}`);
    process.exit(code || 1);
  }
});
