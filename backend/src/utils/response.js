function sendSuccess(res, payload = {}, statusCode = 200) {
  res.status(statusCode).json(payload);
}

function sendError(res, error) {
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal Server Error';
  const body = {
    status: 'error',
    message,
  };

  if (error.details) {
    body.details = error.details;
  }

  res.status(statusCode).json(body);
}

module.exports = {
  sendSuccess,
  sendError,
};
