export interface ValidationError {
  path: string;
  code: string;
  message: string;
}

export interface SuccessResult<T> {
  ok: true;
  data: T;
}

export interface ErrorResult {
  ok: false;
  errors: ValidationError[];
}

export type Result<T> = SuccessResult<T> | ErrorResult;

export function success<T>(data: T): SuccessResult<T> {
  return { ok: true, data };
}

export function error(errors: ValidationError[]): ErrorResult {
  return { ok: false, errors };
}

export function singleError(path: string, code: string, message: string): ErrorResult {
  return { ok: false, errors: [{ path, code, message }] };
}

