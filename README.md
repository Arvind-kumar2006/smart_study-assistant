# Smart Study Assistant

Smart Study Assistant is a mini full-stack web app that turns any study topic into quick summaries, quizzes, and math challenges.

## Demo Video
Watch the demo video to see the Smart Study Assistant in action:

[📹 Demo Video](https://drive.google.com/file/d/1SYnJy9qifUMuz8BTYzk0oMo0ZZ3ZkQmo/view?usp=drive_link)

## Hosted URLs
- https://smart-study-frontend-88qx.vercel.app/

## Tech Stack
- Backend: Node.js, Express, Axios, NodeCache, Jest, Supertest
- Frontend: React (Vite), Fetch API, PropTypes, custom CSS
- External APIs: Wikipedia REST API, Google Gemini (or compatible JSON AI endpoint)

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Backend Setup
1. Copy the environment template and provide your keys:
   ```bash
   cd backend
   cp .env.example .env
   # edit .env to add AI_API_KEY and preferred PORT/WIKI_ENDPOINT
   ```
2. Install dependencies and start the server:
   ```bash
   npm install
   npm run dev
   ```
3. The backend defaults to `http://localhost:3000`.
   If `AI_API_KEY` is missing or Gemini is unavailable, the server automatically falls back to
   a lightweight rule-based generator so responses still render.

### Frontend Setup
1. In a separate terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Vite serves the UI at `http://localhost:5173`. A dev proxy forwards `/study` calls to the backend.

## Environment Variables
Place these in `backend/.env`:
```
PORT=3000
AI_API_KEY=<your_gemini_key>
WIKI_ENDPOINT=https://en.wikipedia.org/api/rest_v1/page/summary/
```
Optional frontend variable (create `frontend/.env` if hosting separately):
```
VITE_API_BASE_URL=https://your-backend-host
```

## API Reference
`GET /study?topic=<topic>&mode=<mode>`

- `topic` (string, required): subject to study.
- `mode` (optional): `default` (summary + quiz + tip) or `math` (math challenge).

### Sample Responses
Default mode:
```json
{
  "status": "ok",
  "topic": "Photosynthesis",
  "summary": ["Photosynthesis converts light to chemical energy.", "Chlorophyll captures sunlight for the process.", "Produces oxygen as a byproduct."],
  "quiz": [
    {"id":1,"question":"What do plants convert?","choices":["Light","Sound","Heat","DNA"],"answerIndex":0},
    {"id":2,"question":"Which pigment captures light?","choices":["Chlorophyll","Melanin","Keratin","Hemoglobin"],"answerIndex":0},
    {"id":3,"question":"What gas is released?","choices":["Oxygen","Carbon dioxide","Nitrogen","Hydrogen"],"answerIndex":0}
  ],
  "studyTip": "Sketch the light and dark reactions to memorise the steps."
}
```

Math mode:
```json
{
  "status": "ok",
  "topic": "Probability",
  "mathQuestion": {
    "question": "A fair die is rolled twice. What is the probability the sum is 7?",
    "answer": "6/36",
    "explanation": "There are six favourable pairs: (1,6)...(6,1); total outcomes = 36."
  }
}
```

### Curl Examples
```bash
# default
curl "http://localhost:3000/study?topic=Photosynthesis"

# math mode
curl "http://localhost:3000/study?topic=Probability&mode=math"

# missing topic -> 400
curl "http://localhost:3000/study"
```

## Prompt Templates
Use these prompts with Gemini or a compatible JSON-only LLM.

**Summary + Quiz + Tip**
```
System: Return JSON only. Use only keys: status, topic, summary, quiz, studyTip.
User: Here is topic text: "<wiki_text>"
Task: Create:
- summary: array of 3 short bullets (<=20 words each)
- quiz: array of 3 MCQs: each {id:int, question:string, choices:[4 strings], answerIndex:int}
- studyTip: one short sentence (<=15 words)
Return valid JSON only.
```

**Math Mode**
```
System: Return JSON only. Use keys: status, topic, mathQuestion.
User: Here is topic text: "<wiki_text>"
Task: Create a single math/logic question relevant to the topic with:
{question:string, answer:string, explanation:string (step-by-step)}
Return valid JSON only.
```

## Testing
Run backend tests:
```bash
cd backend
npm test
```

Manual test plan:
- Submit a popular topic (e.g., "Photosynthesis") and verify summary + quiz + tip.
- Toggle Math Mode for a quantitative topic (e.g., "Probability") and verify math question with explanation.
- Submit an empty topic to confirm the UI shows an error and no API call is made.
- Disconnect the backend to confirm the frontend displays fetch errors gracefully.

## Deployment

### Backend (Vercel)
1. Push the `backend` folder to a GitHub repository
2. In Vercel, create a new project and import the repository
3. Set **Root Directory** to `backend` in project settings
4. Configure environment variables:
   - `AI_API_KEY`: Your Gemini API key
   - `PORT`: (optional, Vercel sets this automatically)
   - `WIKI_ENDPOINT`: (optional, defaults to Wikipedia API)
5. Deploy

### Frontend (Vercel)
1. Push the `frontend` folder to a GitHub repository (or same repo with different root)
2. In Vercel, create a new project and import the repository
3. Set **Root Directory** to `frontend` in project settings
4. Add environment variable:
   - `VITE_API_BASE_URL`: `https://smart-study-backend-git-main-arvind-kumar214s-projects.vercel.app`
5. Deploy

**Note**: For local development, leave `VITE_API_BASE_URL` empty to use the Vite proxy that forwards `/study` to `http://localhost:3000`.

## AI Tooling Disclosure
Portions of this project were assisted by AI tooling for code generation and documentation. All outputs were reviewed and tested manually.
