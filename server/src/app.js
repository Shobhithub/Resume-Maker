const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/ai.routes');
const exportRoutes = require('./routes/export.routes');
const parseRoutes = require('./routes/parse.routes');

function createApp() {
  const app = express();
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.disable('x-powered-by');
  app.use(
    cors({
      origin,
      methods: ['GET', 'POST'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'resume-maker' });
  });

  app.use('/api/ai', aiRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/parse', parseRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || error.statusCode || 500;
    const message = status >= 500 ? error.message || 'Server error' : error.message || 'Request failed';
    if (status >= 500) console.error(error);
    return res.status(status).json({ error: message });
  });

  return app;
}

module.exports = { createApp };
