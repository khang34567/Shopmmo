import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { prisma } from "../src/lib/db";
import { hashPassword, validatePasswordPolicy } from "../src/lib/password";
import { appendAuditLog } from "../src/services/audit-service";

async function main() {
  const forceRecovery = process.argv.includes("--force-recovery");
  const existingOwner = await prisma.user.findFirst({ where: { role: "OWNER" } });

  if (existingOwner && !forceRecovery) {
    console.error("Đã tồn tại tài khoản OWNER. Từ chối chạy (chỉ cho phép với cờ --force-recovery).");
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  try {
    const email = (process.env.INIT_ADMIN_EMAIL || (await rl.question("Email OWNER: "))).trim();
    const username = (process.env.INIT_ADMIN_USERNAME || (await rl.question("Username OWNER: "))).trim();
    const password = process.env.INIT_ADMIN_PASSWORD || (await rl.question("Mật khẩu mạnh (>=10 ký tự): "));

    validatePasswordPolicy(password);
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        emailNormalized: email.toLowerCase(),
        username,
        usernameNorm: username.toLowerCase(),
        passwordHash,
        role: "OWNER",
        emailVerifiedAt: new Date(),
        wallet: { create: { balance: 0n, held: 0n } }
      }
    });

    await appendAuditLog({
      actorId: user.id,
      action: forceRecovery ? "ADMIN_RECOVERY_CREATE" : "ADMIN_INITIAL_CREATE",
      target: `user:${user.id}`,
      reason: forceRecovery ? "Khởi tạo khôi phục qua CLI" : "Khởi tạo OWNER đầu tiên qua CLI"
    });

    console.log(`Tạo OWNER thành công: ${user.email} (ID: ${user.id}). Hãy bật 2FA ngay sau khi đăng nhập.`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
