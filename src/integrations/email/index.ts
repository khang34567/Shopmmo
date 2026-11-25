import { isEmailConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    logger.warn({ to: "[REDACTED]" }, "Email service chưa cấu hình — không gửi và không đánh dấu đã gửi.");
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "no-reply@example.com",
      to: params.to,
      subject: params.subject,
      text: params.text
    })
  });

  if (!res.ok) {
    logger.error({ status: res.status }, "Gửi email qua Resend thất bại.");
    return { sent: false, reason: "EMAIL_PROVIDER_ERROR" };
  }

  return { sent: true };
}
