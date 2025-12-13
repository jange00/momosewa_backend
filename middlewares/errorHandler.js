import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }
  return sendError(res, status, message);
}