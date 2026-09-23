const express = require('express');
const { aiRateLimit } = require('../utils/rateLimit');
const { rewriteSchema, validateBody } = require('../utils/validate');
const { aiStatus, rewrite } = require('../services/ai.service');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json(aiStatus());
});

router.post('/rewrite', aiRateLimit, validateBody(rewriteSchema), async (req, res, next) => {
  try {
    const result = await rewrite(req.body);
    res.json({
      rewritten: result.rewritten,
      keywords: result.keywords,
      warnings: result.warnings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
