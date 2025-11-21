const express = require('express');
const cors = require('cors');
const routinesRouter = require('./routes/routines');
const { requireUser } = require('./middleware/requireUser');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'routin0-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/routines', requireUser, routinesRouter);

  // Generic error handler
  app.use((err, _req, res, _next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

module.exports = { createApp };


