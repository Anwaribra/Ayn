/** Log only in development; no-op in production to avoid noisy console */
export function log(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}
