const axios = require('axios');
const { HttpError } = require('../utils/errors');

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_CALLS = 30;
const callTimestamps = [];

function canCallAi() {
  const now = Date.now();
  while (callTimestamps.length && now - callTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    callTimestamps.shift();
  }

  if (callTimestamps.length >= RATE_LIMIT_MAX_CALLS) {
    return false;
  }

  callTimestamps.push(now);
  return true;
}

function buildPrompts(mode, topic, wikiText) {
  const trimmed = wikiText.trim();
  const commonPrefix = `Here is topic text: "${trimmed}"`;

  if (mode === 'math') {
    return {
      system: 'Return JSON only. Use keys: status, topic, mathQuestion.',
      user: `${commonPrefix}\nTask: Create a single math/logic question relevant to the topic with {question:string, answer:string, explanation:string (step-by-step)}\nReturn valid JSON only.`,
    };
  }

  return {
    system: 'Return JSON only. Use only keys: status, topic, summary, quiz, studyTip.',
    user: `${commonPrefix}\nTask: Create:\n- summary: array of 3 short bullets (<=20 words each) covering different aspects of the topic\n- quiz: array of 3 diverse MCQs that test different aspects of the topic. Each question should be unique, specific to the topic content, and test understanding rather than just recognition. Format: {id:int, question:string (specific to topic), choices:[4 strings where only one is correct and others are plausible distractors], answerIndex:int (0-3)}\n- studyTip: one short sentence (<=15 words)\n\nIMPORTANT: Questions must be diverse and topic-specific. Avoid generic template questions. Base questions on actual content from the topic text.\nReturn valid JSON only.`,
  };
}

function validateDefaultPayload(payload) {
  if (!Array.isArray(payload.summary) || payload.summary.length !== 3 || !payload.summary.every((item) => typeof item === 'string')) {
    throw new HttpError(502, 'AI response missing summary data');
  }

  if (!Array.isArray(payload.quiz) || payload.quiz.length !== 3) {
    throw new HttpError(502, 'AI response missing quiz data');
  }

  payload.quiz.forEach((item, index) => {
    if (
      typeof item !== 'object' ||
      typeof item.id !== 'number' ||
      typeof item.question !== 'string' ||
      !Array.isArray(item.choices) ||
      item.choices.length !== 4 ||
      item.choices.some((choice) => typeof choice !== 'string') ||
      typeof item.answerIndex !== 'number' ||
      item.answerIndex < 0 ||
      item.answerIndex > 3
    ) {
      throw new HttpError(502, `AI response quiz item ${index + 1} is invalid`);
    }
  });

  if (typeof payload.studyTip !== 'string' || !payload.studyTip.trim()) {
    throw new HttpError(502, 'AI response missing study tip');
  }
}

function validateMathPayload(payload) {
  if (typeof payload.mathQuestion !== 'object') {
    throw new HttpError(502, 'AI response missing math question');
  }

  const { mathQuestion } = payload;
  if (
    typeof mathQuestion.question !== 'string' ||
    typeof mathQuestion.answer !== 'string' ||
    typeof mathQuestion.explanation !== 'string'
  ) {
    throw new HttpError(502, 'AI math question is incomplete');
  }
}

async function callGemini(systemPrompt, userPrompt, attempt = 1) {
  if (!canCallAi()) {
    throw new HttpError(429, 'AI rate limit exceeded, please retry shortly');
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, 'AI_API_KEY is not configured');
  }

  try {
    const { data } = await axios.post(
      `${GEMINI_ENDPOINT}?key=${apiKey}`,
      {
        contents: [
          {
            role: 'system',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 6000,
      },
    );

    return data;
  } catch (error) {
    if (attempt >= 2) {
      throw new HttpError(502, 'Failed to generate study content', {
        cause: error.message,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    return callGemini(systemPrompt, userPrompt, attempt + 1);
  }
}

function extractAiText(response) {
  const candidate = response?.candidates?.[0];
  if (!candidate) {
    throw new HttpError(502, 'AI generation returned no candidates');
  }

  const text = candidate.content?.parts?.map((part) => part.text).join('').trim();
  if (!text) {
    throw new HttpError(502, 'AI generation returned empty content');
  }

  return text;
}

function trimToWords(text, maxWords) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words.slice(0, maxWords).join(' ')}…`;
}

function buildFallbackSummary(wikiText) {
  const sentences = wikiText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const bullets = [];
  let index = 0;

  while (bullets.length < 3 && index < sentences.length) {
    bullets.push(trimToWords(sentences[index], 20));
    index += 1;
  }

  while (bullets.length < 3) {
    bullets.push('Explore core ideas and definitions.');
  }

  return bullets;
}

function sanitizeTopicName(rawTopic) {
  if (typeof rawTopic !== 'string') {
    return '';
  }

  const cleaned = rawTopic.replace(/\$\{[^}]+\}/g, '').trim();
  return cleaned || rawTopic.trim();
}

function buildFallbackQuiz(topic, summary, wikiText) {
  const safeTopic = sanitizeTopicName(topic);
  // Extract key terms from wikiText to create more relevant questions
  const sentences = wikiText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const firstSentence = sentences[0]?.trim() || summary[0] || `${safeTopic} is an important subject.`;
  
  // Create more topic-specific distractors based on common patterns
  const createDistractors = (correctAnswer) => {
    const generic = [
      'It is a fundamental concept in mathematics.',
      'It relates to historical events and timelines.',
      'It involves scientific principles and experiments.',
      'It focuses on artistic expression and creativity.',
    ];
    
    // Shuffle and pick 3 that are different from the correct answer
    const shuffled = generic.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  const distractorSet1 = createDistractors(summary[0]);
  const distractorSet2 = createDistractors(summary[1] || summary[0]);
  const distractorSet3 = createDistractors(summary[2] || summary[0]);

  return [
    {
      id: 1,
      question: `Based on the information provided, which statement accurately describes ${safeTopic}?`,
      choices: [summary[0], ...distractorSet1],
      answerIndex: 0,
    },
    {
      id: 2,
      question: `What is a key characteristic or aspect of ${safeTopic}?`,
      choices: [
        summary[1] || summary[0],
        ...distractorSet2,
      ],
      answerIndex: 0,
    },
    {
      id: 3,
      question: `Which of the following is most relevant to understanding ${safeTopic}?`,
      choices: [
        summary[2] || summary[0],
        ...distractorSet3,
      ],
      answerIndex: 0,
    },
  ];
}

function buildFallbackMathQuestion(topic) {
  return {
    question: `You plan to review 3 sections on ${topic}, each taking 15 minutes. How long will the study session take?`,
    answer: '45 minutes',
    explanation:
      'Multiply the number of sections (3) by the time per section (15 minutes) to get 45 minutes total.',
  };
}

function buildFallbackContent({ topic, wikiText, mode }) {
  const summary = buildFallbackSummary(wikiText);
  const safeTopic = sanitizeTopicName(topic);

  if (mode === 'math') {
    return {
      mathQuestion: buildFallbackMathQuestion(safeTopic),
    };
  }

  return {
    summary,
    quiz: buildFallbackQuiz(safeTopic, summary, wikiText),
    studyTip: `Review the main definitions of ${safeTopic} twice today.`,
  };
}

async function generateStudyContent({ topic, wikiText, mode = 'default' }) {
  const { system, user } = buildPrompts(mode, topic, wikiText);
  let aiResponse;

  try {
    aiResponse = await callGemini(system, user);
  } catch (error) {
    if ([502, 429, 404].includes(error.statusCode)) {
      return buildFallbackContent({ topic, wikiText, mode });
    }

    throw error;
  }

  let parsed;

  try {
    const rawText = extractAiText(aiResponse);
    parsed = JSON.parse(rawText);
  } catch (error) {
    return buildFallbackContent({ topic, wikiText, mode });
  }

  try {
    if (mode === 'math') {
      validateMathPayload(parsed);
      return {
        mathQuestion: parsed.mathQuestion,
      };
    }

    validateDefaultPayload(parsed);
    return {
      summary: parsed.summary,
      quiz: parsed.quiz,
      studyTip: parsed.studyTip,
    };
  } catch (validationError) {
    return buildFallbackContent({ topic, wikiText, mode });
  }
}

module.exports = {
  generateStudyContent,
};
