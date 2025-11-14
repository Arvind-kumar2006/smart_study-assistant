const express = require('express');
const { fetchTopicSummary } = require('../services/wiki');
const { generateStudyContent } = require('../services/ai');
const { sendSuccess } = require('../utils/response');
const { HttpError } = require('../utils/errors');

const router = express.Router();

router.get('/', async (req, res, next) => {
  const topic = req.query.topic?.trim();
  const mode = (req.query.mode || 'default').toLowerCase();

  try {
    if (!topic) {
      throw new HttpError(400, 'Query parameter "topic" is required.');
    }

    if (!['default', 'math'].includes(mode)) {
      throw new HttpError(400, 'Invalid mode. Use "default" or "math".');
    }

    const wikiContent = await fetchTopicSummary(topic);
    if (!wikiContent) {
      throw new HttpError(404, `No data found for topic: ${topic}`);
    }

    const aiPayload = await generateStudyContent({
      topic,
      wikiText: wikiContent,
      mode,
    });

    const responseBody = {
      status: 'ok',
      topic,
      ...aiPayload,
    };

    sendSuccess(res, responseBody, 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
