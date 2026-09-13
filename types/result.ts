/**
 * Expected failures are values, not exceptions.
 *
 * Storage and service calls return a `Result` so a screen has to decide what to show. Throwing is
 * reserved for programmer error, which an error boundary catches.
 */
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E }

export type AppErrorCode =
  | 'storage/read-failed'
  | 'storage/write-failed'
  | 'storage/corrupt'
  | 'storage/unsupported-schema'
  | 'contact/invalid-name'
  | 'contact/invalid-address'
  | 'contact/invalid-note'
  | 'contact/not-found'
  | 'group/invalid-name'
  | 'group/duplicate-name'
  | 'group/not-found'
  | 'wallet/not-installed'
  | 'wallet/declined'
  | 'wallet/unavailable'
  | 'transfer/invalid-amount'
  | 'transfer/insufficient-funds'
  | 'transfer/failed'

export interface AppError {
  code: AppErrorCode
  /** Shown to the user, so write it in plain language. */
  message: string
  /** The original failure, kept for debugging. Never rendered. */
  cause?: unknown
}

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E extends AppError>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function appError(code: AppErrorCode, message: string, cause?: unknown): AppError {
  return { code, message, cause }
}
