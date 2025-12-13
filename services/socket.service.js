// Socket.IO service to store and access the io instance
let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized. Make sure server.js has called setIO().');
  }
  return ioInstance;
}


