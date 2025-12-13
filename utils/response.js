export function sendSuccess(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

export function sendError(res, status = 500, message = 'Error', details = undefined) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}