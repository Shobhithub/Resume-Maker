const express = require('express');
const multer = require('multer');
const { parseRateLimit } = require('../utils/rateLimit');
const { parseResumeFile } = require('../services/parse.service');

const router = express.Router();

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 10 },
  fileFilter(req, file, cb) {
    const name = String(file.originalname || '');
    const mime = String(file.mimetype || '').toLowerCase();
    // Some browsers/OSes send DOCX as octet-stream; extension + magic-byte
    // checks below catch truly unknown files.
    const mimeOk = ALLOWED_MIME.has(mime) || mime === 'application/octet-stream' || mime === '';
    const extOk = /\.(pdf|docx)$/i.test(name);
    if (!mimeOk || !extOk) {
      const error = new Error('Only PDF and DOCX files are supported.');
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

function cleanField(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

router.post('/resume', parseRateLimit, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is larger than the 5MB limit.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected form field. Attach the resume as "file".' });
    }
    return res.status(error.status || 400).json({ error: error.message || 'Upload failed.' });
  });
}, async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded. Attach a PDF or DOCX in the "file" field.' });
    }

    // Trust content, not the client: verify magic bytes.
    const head = file.buffer.subarray(0, 5).toString('latin1');
    const isPdf = head.startsWith('%PDF-');
    const isDocx = head.startsWith('PK\x03\x04');
    if (!isPdf && !isDocx) {
      return res.status(400).json({ error: 'This file is not a valid PDF or DOCX.' });
    }

    const result = await parseResumeFile({
      buffer: file.buffer,
      kind: isPdf ? 'pdf' : 'docx',
      targetRole: cleanField(req.body?.targetRole, 200),
      jobDescription: cleanField(req.body?.jobDescription, 8000),
    });

    return res.json({ resumeData: result.resumeData, warnings: result.warnings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
