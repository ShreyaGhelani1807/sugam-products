const app = require('./app');

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Sugam Products API running on port ${PORT}`);
});

// Log unexpected async failures instead of letting them silently crash the
// process. A rejected promise we never caught indicates a real bug — surface
// it loudly. Railway will restart the container if the process exits.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// An uncaught exception leaves the process in an undefined state. Log it, then
// shut down gracefully so the platform can restart a clean instance.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  server.close(() => process.exit(1));
  // Force-exit if connections do not drain promptly.
  setTimeout(() => process.exit(1), 10000).unref();
});

// Graceful shutdown on platform stop/redeploy signals.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[${signal}] shutting down...`);
    server.close(() => process.exit(0));
  });
}
