export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: { code: string; message: string };
}
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}
export function err(code: string, message: string): ApiErr {
  return { ok: false, error: { code, message } };
}
export function isOk<T>(r: ApiResult<T>): r is ApiOk<T> {
  return r.ok;
}
export function isErr(r: ApiResult<unknown>): r is ApiErr {
  return !r.ok;
}

export async function tryApi<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (e) {
    return err("INTERNAL_ERROR", e instanceof Error ? e.message : "Unknown error");
  }
}
