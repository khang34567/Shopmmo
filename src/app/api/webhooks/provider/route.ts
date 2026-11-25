import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getProductProvider } from "@/integrations/provider";
import { AppError, errorResponse } from "@/lib/errors";

const WebhookPayloadSchema = z.object({
  eventId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");
    const provider = getProductProvider();

    if (!provider.verifyWebhook(rawBody, signature, timestamp)) {
      throw new AppError("INVALID_SIGNATURE", "Chữ ký webhook không hợp lệ.", 401);
    }

    const payload = WebhookPayloadSchema.parse(JSON.parse(rawBody));
    const existing = await prisma.processedEvent.findUnique({ where: { eventId: payload.eventId } });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await prisma.processedEvent.create({
      data: { provider: provider.name, eventId: payload.eventId }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
