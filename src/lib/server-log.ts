export function logServerError(
  context: string,
  error: unknown,
  details?: Record<string, unknown>,
) {
  console.error(`[server-error] ${context}`, {
    ...details,
    error: serializeError(error),
  });
}

export function isPrismaMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && error.code === "P2021";
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}
