const express = require('express');
const { exportSchema, validateBody } = require('../utils/validate');
const { contentDisposition, safeFileBase } = require('../utils/format');
const { renderPdf } = require('../services/pdf.service');
const { renderDocx } = require('../services/docx.service');

const router = express.Router();

router.post('/pdf', validateBody(exportSchema), async (req, res, next) => {
  try {
    const { resumeData, templateId } = req.body;
    const resume = { ...resumeData, templateId };
    const buffer = await renderPdf(resume, templateId);
    const filename = `${safeFileBase(resume.contact?.name || resume.title)}-resume.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition(filename));
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

router.post('/docx', validateBody(exportSchema), async (req, res, next) => {
  try {
    const { resumeData, templateId } = req.body;
    const resume = { ...resumeData, templateId };
    const buffer = await renderDocx(resume, templateId);
    const filename = `${safeFileBase(resume.contact?.name || resume.title)}-resume.docx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', contentDisposition(filename));
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
