const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const { createApp } = require('./app');
const { closeBrowser } = require('./services/pdf.service');

const PORT = Number(process.env.PORT) || 5000;

const app = createApp();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Resume maker API listening on port ${PORT}`);
});

function shutdown() {
  console.log('Shutting down server...');

  server.close(() => {
    closeBrowser()
      .finally(() => {
        process.exit(0);
      });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);