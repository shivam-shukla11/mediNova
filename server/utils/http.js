class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const success = (res, data, message = 'Operation completed successfully', status = 200) =>
  res.status(status).json({ success: true, message, data });

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.code === 11000 ? 409 : ['ValidationError', 'CastError'].includes(error.name) ? 400 : 500);
  const message = error.code === 11000 ? 'A booking with these details already exists' : status < 500 ? error.message : 'The server could not complete this request';
  res.status(status).json({ success: false, message, data: null });
};

module.exports = { HttpError, asyncRoute, success, errorHandler };
