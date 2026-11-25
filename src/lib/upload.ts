import crypto from "node:crypto";
import { AppError } from "@/lib/errors";

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5MB

export type AllowedReceiptMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

export function detectFileMagicMime(buf: Uint8Array): AllowedReceiptMime | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  // WEBP: RIFF....WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  // PDF: %PDF-
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d) {
    return "application/pdf";
  }
  return null;
}

export function validateReceiptBuffer(buf: Uint8Array): { mime: AllowedReceiptMime; safeFilename: string } {
  if (buf.byteLength === 0 || buf.byteLength > MAX_RECEIPT_BYTES) {
    throw new AppError("INVALID_FILE", "Kích thước tệp phải từ 1 byte đến 5MB.", 400);
  }
  const mime = detectFileMagicMime(buf);
  if (!mime) {
    throw new AppError("INVALID_FILE_TYPE", "Chỉ chấp nhận ảnh JPEG, PNG, WEBP hoặc tệp PDF hợp lệ.", 400);
  }
  const extMap: Record<AllowedReceiptMime, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf"
  };
  return {
    mime,
    safeFilename: `receipt-${crypto.randomUUID()}.${extMap[mime]}`
  };
}
