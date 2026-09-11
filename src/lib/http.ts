import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function handleRouteError(error: unknown) {
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as { status?: number }).status) || 500
    : 500;
  const message =
    error instanceof Error && error.message === "UNAUTHENTICATED"
      ? "请先登录"
      : error instanceof Error
        ? error.message
        : "服务器内部错误";
  if (status >= 500 && message !== "请先登录") {
    console.error(error);
  }
  return jsonError(status === 500 ? "服务器内部错误" : message, status);
}
