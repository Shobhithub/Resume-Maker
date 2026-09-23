const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createApp } = require('./app');
const { closeBrowser } = require('./services/pdf.service');

const port = Number(process.env.PORT) || 5000;
const app = createApp();

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Resume maker API listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => {
    closeBrowser().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
