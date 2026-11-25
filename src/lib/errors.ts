import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly statusCode: number = 400
  ) {
    super(userMessage);
  }
}

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function errorResponse(err: unknown, requestId = createRequestId()): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.userMessage, requestId } },
      { status: err.statusCode, headers: { "x-request-id": requestId } }
    );
  }

  logger.error({ requestId, errName: err instanceof Error ? err.name : "UnknownError" }, "Unhandled API error");
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        requestId
      }
    },
    { status: 500, headers: { "x-request-id": requestId } }
  );
}
