import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiError = { error: { code: string; message: string; fields?: Record<string, string> } };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json<ApiError>({ error: { code, message, fields } }, { status });
}

export function invalid(err: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    fields[key] ??= issue.message;
  }
  return fail(422, "VALIDATION_FAILED", "Some fields need attention.", fields);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
