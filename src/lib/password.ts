import { hash, verify } from "@node-rs/argon2";
import { AppError } from "@/lib/errors";

// Danh sách mẫu mật khẩu phổ biến bị lộ (có thể mở rộng thêm HIBP k-anonymity)
const COMMON_LEAKED_PASSWORDS = new Set([
  "1234567890",
  "password123",
  "qwerty12345",
  "admin12345",
  "iloveyou123",
  "vietnam1234",
  "0000000000",
  "1111111111",
  "matkhau123",
  "changeme123"
]);

const ARGON2_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1
};

// Hash giả cố định dùng cho chống timing attack khi user không tồn tại
let cachedDummyHash: string | null = null;

export function validatePasswordPolicy(password: string): void {
  if (password.length < 10) {
    throw new AppError("WEAK_PASSWORD", "Mật khẩu phải có ít nhất 10 ký tự.", 400);
  }
  if (password.length > 128) {
    throw new AppError("WEAK_PASSWORD", "Mật khẩu tối đa 128 ký tự.", 400);
  }
  if (COMMON_LEAKED_PASSWORDS.has(password.toLowerCase())) {
    throw new AppError("WEAK_PASSWORD", "Mật khẩu này quá phổ biến. Vui lòng chọn mật khẩu khác.", 400);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hashStr: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashStr, plain);
  } catch {
    return false;
  }
}

export async function verifyDummyPassword(plain: string): Promise<void> {
  if (!cachedDummyHash) {
    cachedDummyHash = await hash("dummy-timing-shield-not-a-real-pass", ARGON2_OPTIONS);
  }
  await verifyPassword(cachedDummyHash, plain);
}
