import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(e => ({ field: e.param, msg: e.msg }));
    return sendError(res, 422, 'Validation failed', details);
  }
  return next();
};