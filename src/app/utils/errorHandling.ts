export const isConnectionError = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Check for common connection error messages
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network error') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.toLowerCase().includes('connection')
    );
  }
  return false;
};

export const getErrorMessage = (error: unknown): string => {
  if (isConnectionError(error)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  return error instanceof Error ? error.message : "An unknown error occurred";
}; 