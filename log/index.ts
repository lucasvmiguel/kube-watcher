export const message = (message: string): void => {
  console.log(`[${new Date().toUTCString()}]: ${message}`);
};
