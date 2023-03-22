export function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject(new Error(`Promise timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}


export const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed in JavaScript
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}