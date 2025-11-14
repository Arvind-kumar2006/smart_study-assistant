const axios = require('axios');
const NodeCache = require('node-cache');
const { HttpError } = require('../utils/errors');

const cache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });
const DEFAULT_WIKI_ENDPOINT = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

function sanitizeTopic(topic) {
  return topic.trim().toLowerCase();
}

function trimContent(content) {
  if (!content) {
    return '';
  }

  const maxLength = 1100;
  const minPreferred = 800;

  if (content.length <= maxLength) {
    return content;
  }

  let trimmed = content.slice(0, maxLength);
  const lastSentenceBoundary = trimmed.lastIndexOf('.');
  if (lastSentenceBoundary >= minPreferred) {
    trimmed = trimmed.slice(0, lastSentenceBoundary + 1);
  }

  return trimmed;
}

async function fetchTopicSummary(topic) {
  const normalizedTopic = sanitizeTopic(topic);
  const cached = cache.get(normalizedTopic);
  if (cached) {
    return cached;
  }

  const endpoint = process.env.WIKI_ENDPOINT || DEFAULT_WIKI_ENDPOINT;
  const url = `${endpoint}${encodeURIComponent(topic)}`;

  let response;
  try {
    response = await axios.get(url, {
      timeout: 4000,
      headers: {
        'User-Agent': 'SmartStudyAssistant/1.0 (https://github.com/your-repo)',
      },
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new HttpError(404, `No summary found for topic: ${topic}`);
    }

    throw new HttpError(502, 'Failed to fetch topic data from encyclopedia', {
      cause: error.message,
    });
  }

  const { data } = response;
  const extract = data.extract || data.description;
  if (!extract) {
    throw new HttpError(404, `No sufficient content found for topic: ${topic}`);
  }

  const trimmed = trimContent(extract);
  cache.set(normalizedTopic, trimmed);
  return trimmed;
}

module.exports = {
  fetchTopicSummary,
};
