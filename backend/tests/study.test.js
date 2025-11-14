const request = require('supertest');

jest.mock('../src/services/wiki');
jest.mock('../src/services/ai');

const app = require('../src/index');
const { fetchTopicSummary } = require('../src/services/wiki');
const { generateStudyContent } = require('../src/services/ai');

describe('GET /study', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when topic is missing', async () => {
    const response = await request(app).get('/study');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      status: 'error',
    });
  });

  it('returns study content for valid topic', async () => {
    fetchTopicSummary.mockResolvedValue('Photosynthesis is a process used by plants...');
    generateStudyContent.mockResolvedValue({
      summary: ['Plants use light.', 'Chlorophyll absorbs energy.', 'Produces oxygen.'],
      quiz: [
        { id: 1, question: 'What do plants use?', choices: ['Light', 'Sound', 'Heat', 'Air'], answerIndex: 0 },
        { id: 2, question: 'Which pigment?', choices: ['Chlorophyll', 'Melanin', 'Hemoglobin', 'Keratin'], answerIndex: 0 },
        { id: 3, question: 'Result?', choices: ['Oxygen', 'Nitrogen', 'Carbon', 'Iron'], answerIndex: 0 },
      ],
      studyTip: 'Review the light-dependent reactions.',
    });

    const response = await request(app)
      .get('/study')
      .query({ topic: 'Photosynthesis' });

    expect(fetchTopicSummary).toHaveBeenCalledWith('Photosynthesis');
    expect(generateStudyContent).toHaveBeenCalledWith({
      topic: 'Photosynthesis',
      wikiText: 'Photosynthesis is a process used by plants...',
      mode: 'default',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      topic: 'Photosynthesis',
      summary: expect.any(Array),
      quiz: expect.any(Array),
      studyTip: expect.any(String),
    });
  });

  it('returns math question payload in math mode', async () => {
    fetchTopicSummary.mockResolvedValue('Probability is the likelihood of events.');
    generateStudyContent.mockResolvedValue({
      mathQuestion: {
        question: 'A fair die is rolled twice. What is the probability of sum 7?',
        answer: '6/36',
        explanation: 'There are 6 favourable outcomes...',
      },
    });

    const response = await request(app)
      .get('/study')
      .query({ topic: 'Probability', mode: 'math' });

    expect(generateStudyContent).toHaveBeenCalledWith({
      topic: 'Probability',
      wikiText: 'Probability is the likelihood of events.',
      mode: 'math',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      topic: 'Probability',
      mathQuestion: {
        question: expect.any(String),
        answer: expect.any(String),
        explanation: expect.any(String),
      },
    });
  });
});
