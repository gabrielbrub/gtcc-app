export function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error(`Promise timed out after ${timeoutMs} ms`));
      }, timeoutMs);
    });
  
    return Promise.race([promise, timeoutPromise]);
  }