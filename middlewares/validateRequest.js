import { sendError } from '../utils/response.js';

export function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!result.success) {
      return sendError(res, 400, 'Validation failed', result.error.flatten());
    }
    next();
  };
}