export function logServerStart(port: number) {
  console.log(`Server running on port ${port}`);
}

export function logServerError(error: Error) {
  console.error('Server error:', {
    message: error.message,
    stack: error.stack
  });
}

export function logRequest(method: string, path: string) {
  console.log(`${method} ${path}`);
}