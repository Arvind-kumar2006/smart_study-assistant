const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const studyRouter = require('./routes/study');
const { sendError } = require('./utils/response');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/study', studyRouter);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
});

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
  }
  sendError(res, err);
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Smart Study Assistant backend running on port ${port}`);
  });
}

module.exports = app;
